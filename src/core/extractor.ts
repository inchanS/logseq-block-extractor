import {getBlocksReferencingTag} from '../data/query';
import {filterBlocksByKeyword} from './filter';
import {sortResults, getSortValue} from './sort';
import {generateMarkdown, downloadMarkdown, generateFilename} from '../utils/markdown';
import {validateAndSetDefaultSortField} from "../utils/validation";

export async function extractFilteredBlocks(
    primaryTag: string,
    filterKeywords: string[] = [],
    sortOrder: string = 'asc',
    sortField: string = 'filename',
    filterMode: 'and' | 'or' = 'or'
) {
    try {
        const validSortField = await validateAndSetDefaultSortField(sortField);

        const hasFilter = filterKeywords && filterKeywords.length > 0;
        const filterText = hasFilter ? `with filter: ${filterKeywords.join(', ')}` : 'without filter (all blocks)';
        const sortText = sortOrder === 'asc' ? 'ascending' : 'descending';
        const fieldText = validSortField === 'filename' ? 'filename' : `property: ${validSortField}`;

        logseq.UI.showMsg(`Extracting blocks for tag: ${primaryTag} ${filterText} (${sortText} by ${fieldText})`, 'info');

        const results = await getBlocksReferencingTag(primaryTag);

        if (!results || results.length === 0) {
            logseq.UI.showMsg(`No blocks found referencing "${primaryTag}"`, 'warning');
            return;
        }

        console.log(`Found ${results.length} blocks referencing ${primaryTag}`);
        logseq.UI.showMsg(`Processing ${results.length} blocks...`, 'info');

        let filteredResults: any[] = [];
        let processedCount = 0;

        for (const result of results) {
            try {
                const block = Array.isArray(result) ? result[0] : result;

                if (!block || !block.uuid) {
                    console.warn('Invalid block found:', block);
                    continue;
                }

                const fullBlock = await logseq.Editor.getBlock(block.uuid, {
                    includeChildren: true
                });

                if (fullBlock) {
                    let processedBlock;

                    if (hasFilter) {
                        processedBlock = filterBlocksByKeyword(fullBlock, filterKeywords, filterMode);
                    } else {
                        processedBlock = fullBlock;
                    }

                    if (processedBlock) {
                        const {sortValue, secondarySortValue} = getSortValue(block, validSortField);

                        filteredResults.push({
                            block: processedBlock,
                            page: block.page,
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

        const markdown = generateMarkdown(primaryTag, filterKeywords, validSortField, sortOrder, filteredResults);
        const filename = generateFilename(primaryTag, filterKeywords, validSortField);

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
