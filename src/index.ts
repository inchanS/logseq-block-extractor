import '@logseq/libs'
import { showInputDialog } from './ui/dialog';
import { extractFilteredBlocks } from './core/extractor';

const main = () => {
    console.log('Block Extractor Plugin loaded');

    // 커맨드 팔레트에 등록
    logseq.App.registerCommandPalette({
        key: "extract-filtered-blocks",
        label: "Extract Filtered Blocks",
    }, async () => {
        await showInputDialog();
    });

    // 슬래시 커맨드로 등록
    logseq.Editor.registerSlashCommand('Extract Filtered Blocks', async () => {
        await showInputDialog();
    });

    // 블록 컨텍스트 메뉴에 추가
    logseq.Editor.registerBlockContextMenuItem('Extract Filtered Blocks', async () => {
        await showInputDialog();
    });

    // 툴바 버튼 추가
    logseq.App.registerUIItem('toolbar', {
        key: 'block-extractor',
        template: `
          <a class="button" data-on-click="showExtractDialog" title="Extract Blocks" 
             style="padding: 4px 6px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7,10 12,15 17,10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </a>
        `
    });

    // 전역 모델 제공
    logseq.provideModel({
        showExtractDialog: async () => {
            await showInputDialog();
        },

        executeExtraction: async () => {
            const primaryTagInput = parent.document.querySelector('#primaryTag') as HTMLInputElement | null;
            const filterKeywordsInput = parent.document.querySelector('#filterKeywords') as HTMLInputElement | null;
            const sortFieldInput = parent.document.querySelector('#sortField') as HTMLInputElement | null;
            const sortOrderRadio = parent.document.querySelector('input[name="sortOrder"]:checked') as HTMLInputElement | null;

            const primaryTag = primaryTagInput?.value?.trim();
            const filterKeywords = filterKeywordsInput?.value?.trim();
            const sortField = sortFieldInput?.value?.trim() || 'filename';
            const sortOrder = sortOrderRadio?.value || 'asc';

            if (!primaryTag) {
                logseq.UI.showMsg("Primary tag is required", 'warning');
                return;
            }

            let keywords: string[] = [];
            if (filterKeywords && filterKeywords.length > 0) {
                keywords = filterKeywords.split(',')
                    .map(k => k.trim())
                    .filter(k => k.length > 0);
            }

            logseq.provideUI({key: 'block-extractor-input', template: ''});
            await extractFilteredBlocks(primaryTag, keywords, sortOrder, sortField);
        },

        cancelDialog: () => {
            logseq.provideUI({key: 'block-extractor-input', template: ''});
        }
    });
};

logseq.ready(main).catch(console.error);
