export function renderBlockWithChildren(block: { content: string; children: any[]; }, indent = 0, maxDepth = 10) {
    if (!block || !block.content || indent > maxDepth) return '';

    let content = '';
    const indentStr = '  '.repeat(indent);

    content += indentStr + '- ' + block.content + '\n';

    if (block.children && Array.isArray(block.children) && block.children.length > 0) {
        block.children.forEach(child => {
            content += renderBlockWithChildren(child, indent + 1, maxDepth);
        });
    }

    return content;
}

export function generateMarkdown(primaryTag:string, filterKeywords:string[], validSortField:string, sortOrder:string, filteredResults: string[]) {
    const hasFilter = filterKeywords && filterKeywords.length > 0;
    const sortText = sortOrder === 'asc' ? 'ascending' : 'descending';
    const fieldText = validSortField === 'filename' ? 'filename' : `property: ${validSortField}`;

    let markdown = `# Extracting reference blocks ${primaryTag}\n\n`;
    markdown += `Search conditions:\n`;
    markdown += `1. "Blocks that reference tags ${primaryTag}"\n`;

    if (hasFilter) {
        markdown += `2. Keep the hierarchy, but show all "${filterKeywords.join(', ')}" related blocks and their children\n`;
    } else {
        markdown += `2. Show all blocks and their child blocks (no filter)\n`;
    }

    markdown += `3. Sort by: ${fieldText} (${sortText})\n\n`;
    markdown += `A total of ${filteredResults.length} blocks found\n\n`;

    filteredResults.forEach((item: any, index: number) => {
        markdown += `## ${index + 1}. ${item.page.name}\n\n`;
        markdown += renderBlockWithChildren(item.block);
        markdown += "\n---\n\n";
    });

    return markdown;
}

export function downloadMarkdown(content: any, filename: string) {
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
