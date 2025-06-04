
export function blockContainsKeywords(block: any, keywords: string[], filterMode: 'and' | 'or' = 'or') {
    if (!block || !block.content) return false;

    const content = block.content.toLowerCase();

    if (filterMode === 'or') {
        return keywords.some(keyword =>
            content.includes(keyword.toLowerCase())
        );
    } else { // and 방식
        return keywords.every(keyword =>
            content.includes(keyword.toLowerCase())
        );
    }
}

export function filterBlocksByKeyword(block: any, keywords: string[], filterMode: 'and' | 'or' = 'or') {
    if (!block) return null;

    const contentIncludesKeyword = blockContainsKeywords(block, keywords, filterMode);

    if (contentIncludesKeyword) {
        return {
            ...block,
            children: block.children || []
        };
    } else {
        let filteredChildren = [];
        if (block.children && Array.isArray(block.children)) {
            filteredChildren = block.children
                .map((child:string) => filterBlocksByKeyword(child, keywords, filterMode))
                .filter((child: string) => child !== null);
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
