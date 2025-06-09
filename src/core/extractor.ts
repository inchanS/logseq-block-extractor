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
    showFullHierarchy: boolean = false
) {
    try {
        const validSortField: string = await validateAndSetDefaultSortField(sortField);

        const hasFilter: boolean = filterKeywords && filterKeywords.length > 0;
        const filterText: string = hasFilter ? `with filter: ${filterKeywords.join(', ')}` : 'without filter (all blocks)';
        const sortText: SortOption = sortOrder === 'asc' ? 'ascending' : 'descending';
        const fieldText: string = validSortField === 'filename' ? 'filename' : `property: ${validSortField}`;

        logseq.UI.showMsg(`Extracting blocks for tag: ${primaryTag} ${filterText} (${sortText} by ${fieldText})`, 'info');

        const results: string = await getBlocksReferencingTag(primaryTag);

        if (!results || results.length === 0) {
            logseq.UI.showMsg(`No blocks found referencing "${primaryTag}"`, 'warning');
            return;
        }

        console.log(`Found ${results.length} blocks referencing ${primaryTag}`);
        logseq.UI.showMsg(`Processing ${results.length} blocks...`, 'info');

        let filteredResults: ExtendedBlockEntity[] = [];
        let processedCount: number = 0;

        for (const result of results) {
            try {
                const block: BlockEntity = Array.isArray(result) ? result[0] : result;

                if (!block || !block.uuid) {
                    console.warn('Invalid block found:', block);
                    continue;
                }

                const fullBlock: BlockEntity | null = await logseq.Editor.getBlock(block.uuid, {
                    includeChildren: true
                });

                if (fullBlock) {
                    let processedBlock: BlockEntity | null;

                    if (hasFilter) {
                        processedBlock = filterBlocksByKeyword(fullBlock, filterKeywords, filterMode);
                    } else {
                        processedBlock = fullBlock;
                    }

                    if (processedBlock) {
                        const {sortValue, secondarySortValue} = getSortValue(block, validSortField);

                        filteredResults.push({
                            block: processedBlock,
                            sortValue: sortValue,
                            secondarySortValue: secondarySortValue
                        });
                    }
                }

                processedCount++;

                if (processedCount % 10 === 0) {
                    console.log(`Processed ${processedCount}/${results.length} blocks...`);
                }
            } catch (blockError) {
                console.error('Error processing block:', blockError);
                processedCount++;
                continue;
            }
        }

        sortResults(filteredResults, sortOrder, validSortField);

        if (filteredResults.length === 0) {
            logseq.UI.showMsg("No blocks found matching the criteria.", 'warning');
            return;
        }

        const markdown: string = await generateMarkdown(primaryTag, filterKeywords, validSortField, sortOrder, filteredResults, linkReplacement, showFullHierarchy);
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
