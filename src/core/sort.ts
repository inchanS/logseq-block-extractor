import {ExtendedBlockEntity, SortValue} from "../types/LogseqAPITypeDefinitions";
import {BlockEntity} from "@logseq/libs/dist/LSPlugin";

export function sortResults(filteredResults: ExtendedBlockEntity[], sortOrder: string, validSortField: string) {
    if (validSortField === 'filename') {
        // 파일명 정렬 (filename 정렬 시 sortValue는 항상 문자열)
        if (sortOrder === 'desc') {
            filteredResults.sort((a, b) => String(b.sortValue).localeCompare(String(a.sortValue), 'ko', {numeric: true}));
        } else {
            filteredResults.sort((a, b) => String(a.sortValue).localeCompare(String(b.sortValue), 'ko', {numeric: true}));
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

export function getSortValue(block: BlockEntity, validSortField: string): { sortValue: SortValue; secondarySortValue: string } {
    let sortValue: SortValue;
    const secondarySortValue: string = block.page?.name || 'Unnamed Page';

    if (validSortField === 'filename') {
        sortValue = block.page?.name || 'Unnamed Page';
    } else {
        const pageProps = block.page?.properties || {};
        const blockProps = block.properties || {};

        const rawValue = pageProps[validSortField] ||
            pageProps[`:${validSortField}`] ||
            blockProps[validSortField] ||
            blockProps[`:${validSortField}`] ||
            block.page?.[validSortField] ||
            null;

        // Logseq 프로퍼티가 배열 형태인 경우 첫 번째 요소 추출
        if (Array.isArray(rawValue) && rawValue.length > 0) {
            sortValue = rawValue[0];
        } else {
            sortValue = rawValue;
        }

        // 날짜 형태의 값 처리
        if (validSortField.includes('date') || validSortField.includes('created') || validSortField.includes('updated')) {
            if (typeof sortValue === 'string') {
                // 언더스코어를 하이픈으로 변경: 2025_03_29 → 2025-03-29
                const cleanDateString = sortValue.replace(/_/g, '-');
                const dateValue = new Date(cleanDateString).getTime();
                sortValue = isNaN(dateValue) ? null : dateValue;
            } else if (typeof sortValue !== 'number') {
                sortValue = null;
            }
        }
    }

    return { sortValue, secondarySortValue };
}
