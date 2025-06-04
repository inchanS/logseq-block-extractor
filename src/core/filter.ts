export function blockContainsKeywords(block: any, keywords: string[]) {
    if (!block || !block.content) return false;

    const content = block.content.toLowerCase();
    return keywords.some(keyword =>
        content.includes(keyword.toLowerCase())
    );
}

export function filterBlocksByKeyword(block: any, keywords: string[]) {
    if (!block) return null;

    const contentIncludesKeyword = blockContainsKeywords(block, keywords);

    if (contentIncludesKeyword) {
        return {
            ...block,
            children: block.children || []
        };
    } else {
        let filteredChildren = [];
        if (block.children && Array.isArray(block.children)) {
            filteredChildren = block.children
                .map((child:string) => filterBlocksByKeyword(child, keywords))
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
