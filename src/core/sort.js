import { getAllProperties } from '../data/query.js';

export async function validateAndSetDefaultSortField(sortField) {
    if (!sortField || sortField.trim() === '') {
        console.log('Sort field is empty, using default: filename');
        return 'filename';
    }

    const trimmedSortField = sortField.trim();

    if (trimmedSortField === 'filename') {
        return 'filename';
    }

    const commonSystemFields = [
        'date', 'created-at', 'updated-at', 'tags', 'alias',
        'created_at', 'updated_at', 'journal-day', 'journal_day'
    ];

    if (commonSystemFields.includes(trimmedSortField)) {
        console.log(`Using system field: ${trimmedSortField}`);
        return trimmedSortField;
    }

    try {
        const allProperties = await getAllProperties();

        const normalizedField = trimmedSortField.toLowerCase();
        const validProperty = allProperties.find(prop =>
            prop.toLowerCase() === normalizedField
        );

        if (validProperty) {
            console.log(`Valid property found: ${validProperty}`);
            return validProperty;
        }

        const colonField = `:${trimmedSortField}`;
        const validColonProperty = allProperties.find(prop =>
            prop.toLowerCase() === colonField.toLowerCase()
        );

        if (validColonProperty) {
            console.log(`Valid colon property found: ${validColonProperty}`);
            return validColonProperty.replace(/^:+/, '');
        }

        console.warn(`Invalid sort field: ${trimmedSortField}, falling back to filename`);
        logseq.UI.showMsg(`Invalid sort field "${trimmedSortField}", using filename instead`, 'warning');
        return 'filename';

    } catch (error) {
        console.error('Error validating sort field:', error);
        console.log('Error occurred during validation, using default: filename');
        return 'filename';
    }
}

export function sortResults(filteredResults, sortOrder, validSortField) {
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

export function getSortValue(block, validSortField) {
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
