import {BlockEntity, BlockUUIDTuple} from "@logseq/libs/dist/LSPlugin";

// 키워드를 포함(include)/제외(exclude) 목록으로 분리한다.
// '-' 단독 입력처럼 비어 있는 키워드는 모든 블록을 제외해 버리므로 걸러낸다.
function splitKeywords(keywords: string[]): { includeKeywords: string[]; excludeKeywords: string[] } {
    const includeKeywords = keywords
        .filter(keyword => !keyword.startsWith('-'))
        .map(keyword => keyword.toLowerCase())
        .filter(keyword => keyword.length > 0);

    const excludeKeywords = keywords
        .filter(keyword => keyword.startsWith('-'))
        .map(keyword => keyword.substring(1).toLowerCase())
        .filter(keyword => keyword.length > 0);

    return { includeKeywords, excludeKeywords };
}

function hasExcludedKeyword(block: BlockEntity, excludeKeywords: string[]): boolean {
    if (excludeKeywords.length === 0 || !block.content) return false;
    const content = block.content.toLowerCase();
    return excludeKeywords.some(keyword => content.includes(keyword));
}

function matchesIncludeKeywords(block: BlockEntity, includeKeywords: string[], filterMode: 'and' | 'or'): boolean {
    if (includeKeywords.length === 0) return true;
    if (!block.content) return false;

    const content = block.content.toLowerCase();
    return filterMode === 'or'
        ? includeKeywords.some(keyword => content.includes(keyword))
        : includeKeywords.every(keyword => content.includes(keyword));
}

export function blockContainsKeywords(block: BlockEntity, keywords: string[], filterMode: 'and' | 'or' = 'or') {
    if (!block || !block.content) return false;

    const { includeKeywords, excludeKeywords } = splitKeywords(keywords);

    if (hasExcludedKeyword(block, excludeKeywords)) return false;

    return matchesIncludeKeywords(block, includeKeywords, filterMode);
}

// 타입 가드 함수 정의
function isBlockEntity(item: BlockEntity | BlockUUIDTuple): item is BlockEntity {
    return typeof item === 'object' && item !== null && 'id' in item;
}

function childBlocks(block: BlockEntity): BlockEntity[] {
    return Array.isArray(block.children) ? block.children.filter(isBlockEntity) : [];
}

// 제외 키워드만 적용해 서브트리를 가지치기한다.
// include에 매칭된 블록의 하위 트리는 원칙적으로 모두 포함하되, 제외 키워드 블록은 걸러내야 한다.
function pruneExcludedBlocks(block: BlockEntity, excludeKeywords: string[]): BlockEntity | null {
    if (hasExcludedKeyword(block, excludeKeywords)) return null;

    const children = childBlocks(block)
        .map(child => pruneExcludedBlocks(child, excludeKeywords))
        .filter((child): child is BlockEntity => child !== null);

    return { ...block, children };
}

function filterNode(
    block: BlockEntity,
    includeKeywords: string[],
    excludeKeywords: string[],
    filterMode: 'and' | 'or'
): BlockEntity | null {
    // 제외 키워드가 포함된 블록은 하위 트리째 제거한다 (자손이 매칭되어도 되살리지 않음)
    if (hasExcludedKeyword(block, excludeKeywords)) return null;

    if (matchesIncludeKeywords(block, includeKeywords, filterMode)) {
        // 본인이 매칭되면 하위 트리를 유지하되, 하위의 제외 키워드 블록은 걸러낸다
        const children = childBlocks(block)
            .map(child => pruneExcludedBlocks(child, excludeKeywords))
            .filter((child): child is BlockEntity => child !== null);

        return { ...block, children };
    }

    // 본인이 매칭되지 않아도 매칭되는 자손이 있으면 계층을 유지한다
    const filteredChildren = childBlocks(block)
        .map(child => filterNode(child, includeKeywords, excludeKeywords, filterMode))
        .filter((child): child is BlockEntity => child !== null);

    return filteredChildren.length > 0 ? { ...block, children: filteredChildren } : null;
}

export function filterBlocksByKeyword(block: BlockEntity, keywords: string[], filterMode: 'and' | 'or' = 'or'): BlockEntity | null {
    if (!block) return null;

    const { includeKeywords, excludeKeywords } = splitKeywords(keywords);

    return filterNode(block, includeKeywords, excludeKeywords, filterMode);
}
