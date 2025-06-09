import {ExtendedBlockEntity} from "../types/LogseqAPITypeDefinitions";
import {BlockEntity, BlockUUIDTuple} from "@logseq/libs/dist/LSPlugin";


export function renderBlockWithChildren(block: BlockEntity, indent: number = 0, maxDepth: number = 10): string {
    if (!block || !block.content || indent > maxDepth) return '';

    let content = '';
    const indentStr = '  '.repeat(indent);

    content += indentStr + '- ' + block.content + '\n';

    // 타입 가드 함수 정의
    function isBlockEntity(item: BlockEntity | BlockUUIDTuple): item is BlockEntity {
        return typeof item === 'object' && item !== null && 'id' in item;
    }

    if (block.children && Array.isArray(block.children) && block.children.length > 0) {
        block.children
            .filter(isBlockEntity) // 타입 가드로 BlockEntity만 필터링
            .forEach((child: BlockEntity) => {
                content += renderBlockWithChildren(child, indent + 1, maxDepth);
            });
    }

    return content;
}

export function generateMarkdown(primaryTag:string, filterKeywords:string[], validSortField:string, sortOrder:string, filteredResults: ExtendedBlockEntity[] ): string {
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

    filteredResults.forEach((item: ExtendedBlockEntity, index: number) => {
        markdown += `## ${index + 1}. ${item.block.page.name}\n\n`;
        markdown += renderBlockWithChildren(item.block);
        markdown += "\n---\n\n";
    });

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
