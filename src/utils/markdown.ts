import {ExtendedBlockEntity, LinkReplacment} from "../types/LogseqAPITypeDefinitions";
import {BlockEntity, BlockUUIDTuple} from "@logseq/libs/dist/LSPlugin";

export function renderBlockWithChildren(
    block: BlockEntity,
    options?: {
        indent?: number;
        maxDepth?: number;
        linkReplacement?: { open: string, close: string };
    }
): string {
    const { indent = 0, maxDepth = 10, linkReplacement } = options || {};

    if (!block || !block.content || indent > maxDepth) return '';

    let content: string = '';
    const indentStr: string = '  '.repeat(indent);

    let processedContent: string = block.content;
    if (linkReplacement) {
        processedContent = processedContent.replace(
            /\[\[([^\]]+)\]\]/g,
            `${linkReplacement.open}$1${linkReplacement.close}`
        );
    }

    content += indentStr + '- ' + processedContent + '\n';

    if (block.children && Array.isArray(block.children) && block.children.length > 0) {
        block.children
            .filter(isBlockEntity)
            .forEach((child: BlockEntity) => {
                content += renderBlockWithChildren(child, {
                    indent: indent + 1,
                    maxDepth,
                    linkReplacement
                });
            });
    }

    return content;
}

export async function renderBlockWithParents(
    block: BlockEntity,
    options?: {
        indent?: number;
        maxDepth?: number;
        linkReplacement?: { open: string, close: string };
        showFullHierarchy?: boolean;
    }
): Promise<string> {
    const { indent = 0, maxDepth = 10, linkReplacement, showFullHierarchy } = options || {};

    if (!showFullHierarchy) {
        return renderBlockWithChildren(block, { indent, maxDepth, linkReplacement });
    }

    // 최상위 부모 블록 찾기
    const rootBlock: BlockEntity = await findRootParent(block);

    // 타겟 블록까지의 전체 경로 구성
    const fullPath: BlockEntity[] = await buildFullPath(rootBlock, block);

    // 경로를 따라 렌더링하되, 타겟 블록에서는 모든 하위 블록 포함
    return renderFullHierarchy(fullPath, block, { indent, maxDepth, linkReplacement });
}

// 타겟 블록까지의 전체 경로를 구성
async function buildFullPath(rootBlock: BlockEntity, targetBlock: BlockEntity): Promise<BlockEntity[]> {
    const path: BlockEntity[] = [];

    async function findPath(currentBlock: BlockEntity): Promise<boolean> {
        path.push(currentBlock);

        if (currentBlock.id === targetBlock.id) {
            return true;
        }

        // 자식 블록들을 완전히 로드
        if (currentBlock.children && Array.isArray(currentBlock.children)) {
            for (const childRef of currentBlock.children) {
                if (isBlockEntity(childRef)) {
                    // 자식 블록의 완전한 정보 로드
                    try {
                        const fullChild: BlockEntity | null = await logseq.Editor.getBlock(childRef.id, { includeChildren: true });
                        if (fullChild && await findPath(fullChild)) {
                            return true;
                        }
                    } catch (error) {
                        // 블록 로드 실패 시 원본 데이터로 시도
                        if (await findPath(childRef)) {
                            return true;
                        }
                    }
                }
            }
        }

        path.pop();
        return false;
    }

    await findPath(rootBlock);
    return path;
}

// 전체 계층 렌더링
function renderFullHierarchy(
    path: BlockEntity[],
    targetBlock: BlockEntity,
    options: {
        indent?: number;
        maxDepth?: number;
        linkReplacement?: { open: string, close: string };
    }
): string {
    const { indent = 0, maxDepth = 10, linkReplacement } = options;

    let content: string = '';

    for (let i = 0; i < path.length; i++) {
        const currentBlock: BlockEntity = path[i];
        const currentIndent: number = indent + i;

        if (currentIndent > maxDepth) break;

        const indentStr: string = '  '.repeat(currentIndent);

        // 블록 내용 처리
        let processedContent: string = currentBlock.content || '';
        if (linkReplacement) {
            processedContent = processedContent.replace(
                /\[\[([^\]]+)\]\]/g,
                `${linkReplacement.open}$1${linkReplacement.close}`
            );
        }

        content += indentStr + '- ' + processedContent + '\n';

        // 타겟 블록에 도달했으면 모든 하위 블록 포함
        if (currentBlock.id === targetBlock.id) {
            if (currentBlock.children && Array.isArray(currentBlock.children)) {
                currentBlock.children
                    .filter(isBlockEntity)
                    .forEach((child: BlockEntity) => {
                        content += renderBlockWithChildren(child, {
                            indent: currentIndent + 1,
                            maxDepth,
                            linkReplacement
                        });
                    });
            }
            break; // 타겟 블록 처리 완료 후 종료
        }
    }

    return content;
}

async function findRootParent(block: BlockEntity): Promise<BlockEntity> {
    let currentBlock = block;

    // 현재 블록의 완전한 정보 먼저 로드
    try {
        const fullBlock = await logseq.Editor.getBlock(block.id, { includeChildren: true });
        if (fullBlock) {
            currentBlock = fullBlock;
        }
    } catch (error) {
        // 로드 실패 시 원본 사용
    }

    while (currentBlock.parent && currentBlock.parent.id) {
        try {
            const parentBlock = await logseq.Editor.getBlock(currentBlock.parent.id, { includeChildren: true });
            if (parentBlock) {
                currentBlock = parentBlock;
            } else {
                break;
            }
        } catch (error) {
            break;
        }
    }

    return currentBlock;
}

// 타입 가드 함수
function isBlockEntity(item: BlockEntity | BlockUUIDTuple): item is BlockEntity {
    return typeof item === 'object' && item !== null && 'id' in item;
}

export async function generateMarkdown(
    primaryTag: string,
    filterKeywords: string[],
    validSortField: string,
    sortOrder: string,
    filteredResults: ExtendedBlockEntity[],
    linkReplacement?: LinkReplacment,
    showFullHierarchy: boolean = false
): Promise<string> {
    const hasFilter = filterKeywords && filterKeywords.length > 0;
    const sortText = sortOrder === 'asc' ? 'ascending' : 'descending';
    const fieldText = validSortField === 'filename' ? 'filename' : `property: ${validSortField}`;

    let markdown = `# Extracting reference blocks **${primaryTag}**  \n\n`;
    markdown += `Search conditions:  \n\n`;
    markdown += `1. Blocks that reference tags "**${primaryTag}**"  \n`;

    if (hasFilter) {
        markdown += `2. Keep the hierarchy, but show all **"${filterKeywords.join(', ')}"** related blocks and their children  \n`;
    } else {
        markdown += `2. Show all blocks and their child blocks (no filter)  \n`;
    }

    markdown += `3. Sort by: **${fieldText}** (${sortText})  \n\n`;
    markdown += `A total of **${filteredResults.length} blocks** found  \n\n`;

    for (let i = 0; i < filteredResults.length; i++) {
        const item = filteredResults[i];
        markdown += `## ${i + 1}. ${item.block.page.name}\n\n`;

        if (showFullHierarchy) {
            markdown += await renderBlockWithParents(item.block, { linkReplacement, showFullHierarchy});
        } else {
            markdown += renderBlockWithChildren(item.block, { linkReplacement });
        }

        markdown += "\n---\n\n";
    }

    return markdown;
}

export function downloadMarkdown(content: string, filename: string) {
    try {
        const blob = new Blob([content], {type: 'text/markdown;charset=utf-8;'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`Downloaded: ${filename}`);
    } catch (error) {
        console.error('Error downloading file:', error);
        logseq.UI.showMsg('Error downloading file', 'error');
    }
}

export function generateFilename(primaryTag: string, filterKeywords: string[], validSortField: string) {
    const hasFilter = filterKeywords && filterKeywords.length > 0;
    const filterSuffix = hasFilter ? `_filtered_${filterKeywords.join('_').replace(/[^a-zA-Z0-9가-힣_]/g, '_')}` : '_all_blocks';
    const sortSuffix = validSortField !== 'filename' ? `_sortBy_${validSortField}` : '';
    return `${primaryTag}${filterSuffix}${sortSuffix}.md`;
}
