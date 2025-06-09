import {BlockEntity, BlockUUIDTuple} from "@logseq/libs/dist/LSPlugin";

export function blockContainsKeywords(block: BlockEntity, keywords: string[], filterMode: 'and' | 'or' = 'or') {
    if (!block || !block.content) return false;

    const content = block.content.toLowerCase();

    // 포함 키워드와 제외 키워드 분리
    const includeKeywords = keywords.filter(keyword => !keyword.startsWith('-')).map(keyword => keyword.toLowerCase());
    const excludeKeywords = keywords.filter(keyword => keyword.startsWith('-')).map(keyword => keyword.substring(1).toLowerCase());

    // 제외 키워드가 하나라도 포함되어 있으면 바로 false 반환
    if (excludeKeywords.some(keyword => content.includes(keyword))) {
        return false;
    }

    // 포함 키워드에 대한 처리
    if (includeKeywords.length === 0) {
        // 포함 키워드가 없고 제외 키워드만 있는 경우, 제외 키워드가 없으면 true
        return true;
    }

    if (filterMode === 'or') {
        return includeKeywords.some(keyword => content.includes(keyword));
    } else { // and 방식
        return includeKeywords.every(keyword => content.includes(keyword));
    }
}

// 타입 가드 함수 정의
function isBlockEntity(item: BlockEntity | BlockUUIDTuple): item is BlockEntity {
    return typeof item === 'object' && item !== null && 'id' in item;
}

export function filterBlocksByKeyword(block: BlockEntity, keywords: string[], filterMode: 'and' | 'or' = 'or'): BlockEntity | null {
    if (!block) return null;

    const contentIncludesKeyword: boolean = blockContainsKeywords(block, keywords, filterMode);

    if (contentIncludesKeyword) {
        return {
            ...block,
            children: block.children || []
        };
    } else {
        let filteredChildren: BlockEntity[] = [];
        if (block.children && Array.isArray(block.children)) {
            filteredChildren = block.children
                .filter(isBlockEntity) // BlockEntity만 필터링
                .map((child: BlockEntity) => filterBlocksByKeyword(child, keywords, filterMode))
                .filter((child): child is BlockEntity => child !== null);
        }

        if (filteredChildren.length > 0) {
            return {
                ...block,
                children: filteredChildren
            };
        } else {
            return null;
        }
    }
}
