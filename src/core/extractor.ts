import {getBlocksReferencingTag} from '../data/query';
import {filterBlocksByKeyword} from './filter';
import {getSortValue, sortResults} from './sort';
import {downloadMarkdown, generateFilename, generateMarkdown} from '../utils/markdown';
import {validateAndSetDefaultSortField} from "../utils/validation";
import {BlockEntity} from "@logseq/libs/dist/LSPlugin";
import {ExtendedBlockEntity, LinkReplacment} from "../types/LogseqAPITypeDefinitions";

type SortOption = 'ascending' | 'descending';

export async function extractFilteredBlocks(
    primaryTag: string,
    filterKeywords: string[] = [],
    sortOrder: string = 'asc',
    sortField: string = 'filename',
    filterMode: 'and' | 'or' = 'or',
    linkReplacement?: LinkReplacment,
    showFullHierarchy: boolean = false,
    includeOriginalContent: boolean = false // [NEW] 원본 문서 포함 여부 옵션
) {
    try {
        const validSortField: string = await validateAndSetDefaultSortField(sortField);

        const hasFilter: boolean = filterKeywords && filterKeywords.length > 0;
        const filterText: string = hasFilter ? `with filter: ${filterKeywords.join(', ')}` : 'without filter (all blocks)';
        const sortText: SortOption = sortOrder === 'asc' ? 'ascending' : 'descending';
        const fieldText: string = validSortField === 'filename' ? 'filename' : `property: ${validSortField}`;

        logseq.UI.showMsg(`Extracting blocks for tag: ${primaryTag} ${filterText} (${sortText} by ${fieldText})`, 'info');

        const results: BlockEntity[][] | null = await getBlocksReferencingTag(primaryTag);

        // [NEW] 사용자가 원본 포함 옵션을 선택했을 때만 API를 호출하여 블록 트리를 가져옵니다.
        let pageBlocksTree: BlockEntity[] | null = null;
        if (includeOriginalContent) {
            try {
                pageBlocksTree = await logseq.Editor.getPageBlocksTree(primaryTag);
            } catch (e) {
                console.warn(`Failed to fetch page blocks for ${primaryTag}`, e);
            }
        }

        if (!results || results.length === 0) {
            logseq.UI.showMsg(`No blocks found referencing "${primaryTag}"`, 'warning');
            return;
        }

        console.log(`Found ${results.length} blocks referencing ${primaryTag}`);
        logseq.UI.showMsg(`Processing ${results.length} blocks...`, 'info');

        const filteredResults: ExtendedBlockEntity[] = [];

        // 블록마다 순차 await하면 대형 그래프에서 매우 느려지므로 배치 단위로 병렬 처리
        const CONCURRENCY = 10;

        for (let i = 0; i < results.length; i += CONCURRENCY) {
            const batch = results.slice(i, i + CONCURRENCY);

            const processed: (ExtendedBlockEntity | null)[] = await Promise.all(
                batch.map(async (result): Promise<ExtendedBlockEntity | null> => {
                    try {
                        const block: BlockEntity = Array.isArray(result) ? result[0] : result;

                        if (!block || !block.uuid) {
                            console.warn('Invalid block found:', block);
                            return null;
                        }

                        const fullBlock: BlockEntity | null = await logseq.Editor.getBlock(block.uuid, {
                            includeChildren: true
                        });

                        if (!fullBlock) return null;

                        const processedBlock: BlockEntity | null = hasFilter
                            ? filterBlocksByKeyword(fullBlock, filterKeywords, filterMode)
                            : fullBlock;

                        if (!processedBlock) return null;

                        const {sortValue, secondarySortValue} = getSortValue(block, validSortField);

                        return {
                            block: processedBlock,
                            sortValue: sortValue,
                            secondarySortValue: secondarySortValue
                        };
                    } catch (blockError) {
                        console.error('Error processing block:', blockError);
                        return null;
                    }
                })
            );

            for (const item of processed) {
                if (item) filteredResults.push(item);
            }
        }

        sortResults(filteredResults, sortOrder, validSortField);

        if (filteredResults.length === 0) {
            logseq.UI.showMsg("No blocks found matching the criteria.", 'warning');
            return;
        }

        // [UPDATE] generateMarkdown 호출 시 가져온 pageBlocksTree (옵션 미사용 시 null)를 함께 넘겨줍니다.
        const markdown: string = await generateMarkdown(
            primaryTag,
            filterKeywords,
            validSortField,
            sortOrder,
            filteredResults,
            linkReplacement,
            showFullHierarchy,
            pageBlocksTree // 데이터가 있으면 배열, 없으면 null 상태로 전달됨
        );

        const filename: string = generateFilename(primaryTag, filterKeywords, validSortField);

        downloadMarkdown(markdown, filename);

        logseq.UI.showMsg(`Successfully extracted ${filteredResults.length} blocks!`, 'success');

    } catch (error: unknown) {
        console.error('Error extracting blocks:', error);
        if (error instanceof Error) {
            logseq.UI.showMsg(`Error: ${error.message}`, 'error');
        } else {
            logseq.UI.showMsg(`Error: ${String(error)}`, 'error');
        }
    }
}