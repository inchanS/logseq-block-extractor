export function sortResults(filteredResults: any[], sortOrder:string, validSortField:string) {
    if (validSortField === 'filename') {
        // 파일명 정렬
        if (sortOrder === 'desc') {
            filteredResults.sort((a, b) => b.sortValue.localeCompare(a.sortValue, 'ko', {numeric: true}));
        } else {
            filteredResults.sort((a, b) => a.sortValue.localeCompare(b.sortValue, 'ko', {numeric: true}));
        }
    } else {
        // 프로퍼티 정렬
        filteredResults.sort((a, b) => {
            if (a.sortValue !== null && b.sortValue !== null) {
                if (typeof a.sortValue === 'number' && typeof b.sortValue === 'number') {
                    return sortOrder === 'desc' ? b.sortValue - a.sortValue : a.sortValue - b.sortValue;
                } else {
                    const comparison = String(a.sortValue).localeCompare(String(b.sortValue), 'ko', {numeric: true});
                    return sortOrder === 'desc' ? -comparison : comparison;
                }
            }

            if (a.sortValue !== null && b.sortValue === null) {
                return sortOrder === 'desc' ? -1 : 1;
            }
            if (a.sortValue === null && b.sortValue !== null) {
                return sortOrder === 'desc' ? 1 : -1;
            }

            const comparison = a.secondarySortValue.localeCompare(b.secondarySortValue, 'ko', {numeric: true});
            return sortOrder === 'desc' ? -comparison : comparison;
        });
    }
}

export function getSortValue(block: any, validSortField: string) {
    let sortValue;
    let secondarySortValue = block.page?.name || 'Unnamed Page';

    if (validSortField === 'filename') {
        sortValue = block.page?.name || 'Unnamed Page';
    } else {
        const pageProps = block.page?.properties || {};
        const blockProps = block.properties || {};

        sortValue = pageProps[validSortField] ||
            pageProps[`:${validSortField}`] ||
            blockProps[validSortField] ||
            blockProps[`:${validSortField}`] ||
            block.page?.[validSortField] ||
            null;

        // 날짜 형태의 값 처리
        if (validSortField.includes('date') || validSortField.includes('created') || validSortField.includes('updated')) {
            if (typeof sortValue === 'number') {
                sortValue = sortValue;
            } else if (typeof sortValue === 'string') {
                const dateValue = new Date(sortValue).getTime();
                sortValue = isNaN(dateValue) ? null : dateValue;
            } else {
                sortValue = null;
            }
        }
    }

    return { sortValue, secondarySortValue };
}
