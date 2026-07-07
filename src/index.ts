import '@logseq/libs'
import { showInputDialog } from './ui/dialog';
import { extractFilteredBlocks } from './core/extractor';

const main = () => {
    console.log('Block Extractor Plugin loaded');

    // 커맨드 팔레트에 등록 (mod+shift+e 단축키로 마우스 없이 바로 열기)
    logseq.App.registerCommandPalette({
        key: "extract-filtered-blocks",
        label: "Extract Filtered Blocks",
        keybinding: {
            binding: 'mod+shift+e',
            mode: 'global',
        },
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
            const filterModeRadio = parent.document.querySelector('input[name="filterMode"]:checked') as HTMLInputElement | null;

            const linkOpenInput = parent.document.querySelector('#linkOpen') as HTMLInputElement | null;
            const linkCloseInput = parent.document.querySelector('#linkClose') as HTMLInputElement | null;

            const excludeParentsCheckbox = parent.document.querySelector('#excludeParents') as HTMLInputElement | null;

            // [NEW] 새로 추가된 원본 본문 포함 옵션 체크박스 가져오기
            const includeOriginalContentCheckbox = parent.document.querySelector('#includeOriginalContent') as HTMLInputElement | null;

            const primaryTag = primaryTagInput?.value?.trim();
            const filterKeywords = filterKeywordsInput?.value?.trim();
            const sortField = sortFieldInput?.value?.trim() || 'filename';
            const sortOrder = sortOrderRadio?.value || 'asc';
            const filterMode = filterModeRadio?.value as 'and' | 'or' || 'or';

            const plainTextLinksCheckbox = parent.document.querySelector('#plainTextLinks') as HTMLInputElement | null;
            const isPlainTextLinks = plainTextLinksCheckbox?.checked === true;

            const linkOpen = linkOpenInput?.value || '';
            const linkClose = linkCloseInput?.value || '';
            // Plain text 토글 체크 시 괄호를 완전히 제거([[abc]] → abc).
            // 그 외에는 입력값 사용, 둘 다 비어 있으면 기본값(**)으로 볼드 변환.
            // Logseq 문법을 유지하려면 [[ 와 ]] 를 직접 입력하면 된다 (치환 결과가 원문과 동일)
            const linkReplacement = isPlainTextLinks
                ? { open: '', close: '' }
                : (linkOpen || linkClose)
                    ? { open: linkOpen, close: linkClose }
                    : { open: '**', close: '**' };

            const isExcludeParentsChecked = excludeParentsCheckbox?.checked === true;
            const showFullHierarchy = !isExcludeParentsChecked;

            // [NEW] 체크 여부를 boolean 값으로 추출
            const includeOriginalContent = includeOriginalContentCheckbox?.checked === true;

            if (!primaryTag) {
                logseq.UI.showMsg("Primary tag is required", 'warning');
                return;
            }

            // 다음 실행 때 미리 채워둘 수 있도록 마지막 사용 값을 플러그인 설정에 저장
            logseq.updateSettings({
                lastPrimaryTag: primaryTag,
                lastFilterKeywords: filterKeywords || '',
                lastSortField: sortFieldInput?.value?.trim() || '',
                lastSortOrder: sortOrder,
                lastFilterMode: filterMode,
                lastLinkOpen: linkOpen,
                lastLinkClose: linkClose,
                lastPlainTextLinks: isPlainTextLinks,
                lastExcludeParents: isExcludeParentsChecked,
                lastIncludeOriginalContent: includeOriginalContent,
            });

            let keywords: string[] = [];
            if (filterKeywords && filterKeywords.length > 0) {
                keywords = filterKeywords.split(',')
                    .map(k => k.trim())
                    .filter(k => k.length > 0);
            }

            logseq.provideUI({key: 'block-extractor-input', template: ''});

            // [UPDATE] extractFilteredBlocks 호출 시 8번째 파라미터로 includeOriginalContent 추가 전달
            await extractFilteredBlocks(primaryTag, keywords, sortOrder, sortField, filterMode, linkReplacement, showFullHierarchy, includeOriginalContent);
        },

        cancelDialog: () => {
            logseq.provideUI({key: 'block-extractor-input', template: ''});
        }
    });
};

logseq.ready(main).catch(console.error);