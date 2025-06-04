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

    let markdown = `# ${primaryTag} 참조 블록 추출\n\n`;
    markdown += `검색 조건:\n`;
    markdown += `1. "${primaryTag}" 태그를 참조하는 블록\n`;

    if (hasFilter) {
        markdown += `2. 계층 구조를 유지하되 "${filterKeywords.join(', ')}" 관련 블록과 그 하위 블록 모두 표시\n`;
    } else {
        markdown += `2. 모든 블록과 그 하위 블록 표시 (필터 없음)\n`;
    }

    markdown += `3. 정렬 기준: ${fieldText} (${sortText})\n\n`;
    markdown += `총 ${filteredResults.length}개 블록 발견\n\n`;

    filteredResults.forEach((item: any, index: number) => {
        markdown += `### ${index + 1}. ${item.page.name}\n\n`;
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
