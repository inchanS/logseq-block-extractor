import {autoCompleteSelectFieldColor, setupAutoComplete} from './autocomplete';
import {generateFilename} from '../utils/markdown';

// Logseq은 provideUI 템플릿 안의 <style> 태그를 제거하므로,
// 레이아웃은 전부 인라인 스타일로 쓰고 인라인이 불가능한 상태 스타일(:hover, :checked,
// 포커스 하이라이트 등)만 공식 API인 provideStyle로 호스트 문서에 주입한다.
const DIALOG_STATE_CSS = `
#block-extractor-dialog input::placeholder {
    color: var(--ls-secondary-text-color, #aaa);
    opacity: 0.6;
}
#block-extractor-dialog .be-focused {
    outline: 3px solid var(--ls-active-primary-color, #4CAF50) !important;
    outline-offset: 2px !important;
    box-shadow: 0 0 12px var(--ls-active-primary-color, #4CAF50) !important;
}
#block-extractor-dialog summary.be-focused {
    background: var(--ls-tertiary-background-color, #f0f0f0);
    border-radius: 8px;
}
#block-extractor-dialog .be-segmented input.be-focused + span {
    box-shadow: inset 0 0 0 3px var(--ls-active-primary-color, #4CAF50);
}
#block-extractor-dialog .be-segmented input:checked + span {
    background: var(--ls-tertiary-background-color, #e8f4fd);
    color: var(--ls-link-text-color, #0066cc);
    font-weight: 600;
}
#block-extractor-dialog .suggestion-item:hover {
    background-color: var(--ls-selection-background-color, ${autoCompleteSelectFieldColor}) !important;
    color: var(--ls-selection-text-color, white) !important;
}
#block-extractor-dialog summary { list-style: none; }
#block-extractor-dialog summary::-webkit-details-marker { display: none; }
#block-extractor-dialog details[open] .be-chevron { transform: rotate(90deg); }
#block-extractor-dialog button:hover { opacity: 0.85; }
`;

// 인라인 스타일 조각 (템플릿에서 재사용)
const LABEL_STYLE = 'display: block; margin-bottom: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ls-secondary-text-color, #777);';
const INPUT_STYLE = 'width: 100%; box-sizing: border-box; padding: 7px 9px; border: 1px solid var(--ls-border-color, #ddd); border-radius: 6px; font-size: 14px; color: var(--ls-link-ref-text-color, #333) !important; background: var(--ls-secondary-background-color, white);';
const HINT_STYLE = 'display: block; font-size: 11px; font-style: italic; color: var(--ls-secondary-text-color, #888); opacity: 0.85; margin-top: 3px;';
const SUGGESTIONS_STYLE = 'position: absolute; top: 100%; left: 0; right: 0; background: var(--ls-secondary-background-color, white); border: 1px solid var(--ls-border-color, #ddd); border-top: none; border-radius: 0 0 6px 6px; max-height: 200px; overflow-y: auto; display: none; z-index: 1001;';
const SEGMENTED_STYLE = 'display: inline-flex; border: 1px solid var(--ls-border-color, #ccc); border-radius: 6px; overflow: hidden; flex-shrink: 0;';
const SEG_LABEL_STYLE = 'display: flex; cursor: pointer; position: relative;';
const SEG_INPUT_STYLE = 'position: absolute; opacity: 0; pointer-events: none; width: 1px; height: 1px;';
const SEG_SPAN_STYLE = 'padding: 5px 12px; font-size: 12px; display: flex; align-items: center; color: var(--ls-secondary-text-color, #666);';
const TOGGLE_LABEL_STYLE = 'display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ls-primary-text-color, #333); cursor: pointer;';
const CHECKBOX_STYLE = 'width: 15px; height: 15px; cursor: pointer; accent-color: var(--ls-link-text-color, #0066cc); flex-shrink: 0;';
const BTN_BASE_STYLE = 'border-radius: 6px; cursor: pointer; font-size: 13px; padding: 6px 18px; display: flex; flex-direction: column; align-items: center; gap: 1px; line-height: 1.3;';
const BTN_SUB_STYLE = 'font-size: 10px; font-style: italic; opacity: 0.75; font-weight: normal;';
const KBD_STYLE = 'padding: 1px 5px; border: 1px solid var(--ls-border-color, #ccc); border-radius: 3px; font-size: 10px; font-family: inherit; background: var(--ls-secondary-background-color, #f5f5f5);';

export async function showInputDialog() {
    try {
        console.log('showInputDialog called');

        logseq.provideStyle({
            key: 'block-extractor-dialog-css',
            style: DIALOG_STATE_CSS,
        });

        const key = 'block-extractor-input';

        logseq.provideUI({
            key,
            template: `
  <div id="block-extractor-dialog" role="dialog" aria-modal="true" aria-labelledby="block-extractor-title"
       style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); box-sizing: border-box;
              background: var(--ls-primary-background-color, white); border: 1px solid var(--ls-border-color, #ccc); border-radius: 10px;
              padding: 18px 22px; z-index: 1000; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
              width: 660px; max-width: 92vw;">

    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
      <h3 id="block-extractor-title" style="margin: 0; color: var(--ls-primary-text-color, #333); font-size: 16px;">Block Extractor</h3>
      <button id="closeDialogButton" data-on-click="cancelDialog" aria-label="Close dialog"
              style="background: none; border: none; cursor: pointer; color: var(--ls-secondary-text-color, #888); font-size: 15px; padding: 2px 6px; line-height: 1;">&#10005;</button>
    </div>

    <div style="margin-bottom: 12px;">
      <label for="primaryTag" style="${LABEL_STYLE}">Primary Tag</label>
      <div style="position: relative; width: 60%;">
        <input type="text" id="primaryTag" placeholder="TagName" style="${INPUT_STYLE} font-size: 15px;">
        <div id="primaryTagSuggestions" style="${SUGGESTIONS_STYLE}"></div>
      </div>
    </div>

    <div style="margin-bottom: 12px;">
      <label for="filterKeywords" style="${LABEL_STYLE}">Filter Keywords
        <span style="font-weight: normal; text-transform: none; letter-spacing: normal; font-style: italic;">&middot; "-" excludes</span>
      </label>
      <div style="display: flex; gap: 10px; align-items: center;">
        <div style="position: relative; width: 75%;">
          <input type="text" id="filterKeywords" placeholder="keyword1, keyword2, -exclude" style="${INPUT_STYLE}">
          <div id="filterKeywordsSuggestions" style="${SUGGESTIONS_STYLE}"></div>
        </div>
        <span class="be-segmented" title="Match mode for multiple keywords" style="${SEGMENTED_STYLE}">
          <label style="${SEG_LABEL_STYLE}"><input type="radio" id="filterModeOr" name="filterMode" value="or" checked style="${SEG_INPUT_STYLE}"><span style="${SEG_SPAN_STYLE}">Any</span></label>
          <label style="${SEG_LABEL_STYLE}"><input type="radio" id="filterModeAnd" name="filterMode" value="and" style="${SEG_INPUT_STYLE}"><span style="${SEG_SPAN_STYLE} border-left: 1px solid var(--ls-border-color, #ccc);">All</span></label>
        </span>
      </div>
    </div>

    <div style="display: flex; gap: 10px; align-items: flex-end; margin-bottom: 14px;">
      <div style="position: relative; width: 40%;">
        <label for="sortField" style="${LABEL_STYLE}">Sort By</label>
        <input type="text" id="sortField" placeholder="filename" style="${INPUT_STYLE}">
        <div id="sortFieldSuggestions" style="${SUGGESTIONS_STYLE}"></div>
      </div>
      <span class="be-segmented" title="Sort order" style="${SEGMENTED_STYLE} margin-bottom: 1px;">
        <label style="${SEG_LABEL_STYLE}"><input type="radio" id="sortAsc" name="sortOrder" value="asc" checked style="${SEG_INPUT_STYLE}"><span style="${SEG_SPAN_STYLE}">A&rarr;Z</span></label>
        <label style="${SEG_LABEL_STYLE}"><input type="radio" id="sortDesc" name="sortOrder" value="desc" style="${SEG_INPUT_STYLE}"><span style="${SEG_SPAN_STYLE} border-left: 1px solid var(--ls-border-color, #ccc);">Z&rarr;A</span></label>
      </span>
    </div>

    <details id="advancedOptions" style="border: 1px solid var(--ls-border-color, #ddd); border-radius: 8px; margin-bottom: 14px;">
      <summary id="advancedSummary" style="cursor: pointer; padding: 8px 12px; display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ls-secondary-text-color, #666);">
        <span class="be-chevron" aria-hidden="true" style="display: inline-block; transition: transform 0.15s ease; font-size: 11px;">&#9656;</span>
        <span>Advanced</span>
        <span id="advancedChips" style="margin-left: auto; display: flex; gap: 6px; overflow: hidden;"></span>
      </summary>
      <div style="padding: 8px 12px 12px; border-top: 1px solid var(--ls-border-color, #eee);">
        <label style="${LABEL_STYLE} margin-top: 4px;">Link Replacement</label>
        <div style="display: flex; gap: 8px; max-width: 50%;">
          <input type="text" id="linkOpen" placeholder="**" aria-label="Link replacement opening text" style="${INPUT_STYLE} flex: 1; min-width: 0;">
          <input type="text" id="linkClose" placeholder="**" aria-label="Link replacement closing text" style="${INPUT_STYLE} flex: 1; min-width: 0;">
        </div>
        <small style="${HINT_STYLE} margin-bottom: 8px;">Empty = bold (**). Enter "[[" and "]]" to keep Logseq syntax.</small>
        <label style="${TOGGLE_LABEL_STYLE}"><input type="checkbox" id="plainTextLinks" style="${CHECKBOX_STYLE}"><span>Plain text ([[abc]] &rarr; abc)</span></label>

        <div style="border-top: 1px solid var(--ls-border-color, #eee); margin: 10px 0;"></div>

        <label style="${TOGGLE_LABEL_STYLE}"><input type="checkbox" id="excludeParents" style="${CHECKBOX_STYLE}"><span>Exclude Parents</span></label>
        <small style="${HINT_STYLE} margin-bottom: 8px;">Exports only the matched block and its children, without the parent path.</small>
        <label style="${TOGGLE_LABEL_STYLE}"><input type="checkbox" id="includeOriginalContent" style="${CHECKBOX_STYLE}"><span>Include Tag Body</span></label>
        <small style="${HINT_STYLE}">Appends the tag page's own content before the results.</small>
      </div>
    </details>

    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
      <span id="filenamePreview" style="font-size: 11px; color: var(--ls-secondary-text-color, #999); font-family: monospace;
                                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0;"></span>
      <span style="display: flex; gap: 10px; flex-shrink: 0;">
        <button id="cancelButton" data-on-click="cancelDialog"
                style="${BTN_BASE_STYLE} background: var(--ls-tertiary-background-color, #f5f5f5); border: 1px solid var(--ls-border-color, #ddd); color: var(--ls-primary-text-color, #333);">
          <span style="font-weight: 500;">Cancel</span>
          <span style="${BTN_SUB_STYLE}">Esc</span>
        </button>
        <button id="extractButton" data-on-click="executeExtraction"
                style="${BTN_BASE_STYLE} background: var(--ls-active-primary-color, #4CAF50); border: 1px solid transparent; color: #fff;">
          <span style="font-weight: 600;">Extract</span>
          <span style="${BTN_SUB_STYLE}">&#8984;/Ctrl + Enter</span>
        </button>
      </span>
    </div>

    <div style="margin-top: 8px; text-align: center; font-size: 11px; color: var(--ls-secondary-text-color, #999);">
      <kbd style="${KBD_STYLE}">Tab</kbd> Move &nbsp;&middot;&nbsp; <kbd style="${KBD_STYLE}">&#8593;&#8595;</kbd> Suggestions
    </div>
  </div>

  <div data-on-click="cancelDialog" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%;
              background: rgba(0,0,0,0.5); z-index: 999;"></div>
            `,
            style: {
                width: 'auto',                    // 필요 최소 크기로 설정
                height: 'auto',
                backgroundColor: 'transparent',   // 래퍼 배경을 투명으로 설정
                border: 'none',                   // 혹시 기본 테두리가 있으면 제거
                padding: '0',                     // 여분 패딩이 남아있다면 0으로
                margin: '0'                       // 여분 margin도 0으로
            }
        });

        setTimeout(async () => {
            try {
                setupAutoComplete();
                maintainDialogFocus();
                setupDialogEventHandlers();
                setupFocusHighlight();
                await prefillLastUsedValues();
                setupPlainTextLinksToggle();
                setupDynamicPreviews();

                const firstInput = (parent.document || document).querySelector('#primaryTag') as HTMLInputElement | null;
                if (firstInput) {
                    setTimeout(() => {
                        firstInput.focus();
                        // 미리 채워진 값을 전체 선택해 두면 바로 타이핑으로 교체하거나 재실행 가능
                        firstInput.select();
                    }, 100);
                }
            } catch (error) {
                console.error('Error in dialog setup:', error);
            }
        }, 100);

    } catch (error: unknown) {
        console.error('Error in showInputDialog:', error);
        if (error instanceof Error) {
            logseq.UI.showMsg(`Error: ${error.message}`, 'error');
        } else {
            logseq.UI.showMsg(`Error: ${String(error)}`, 'error');
        }
    }
}

// 마지막 사용 값(없으면 현재 페이지 이름)으로 입력란을 미리 채운다
async function prefillLastUsedValues() {
    const doc = parent.document || document;
    const settings: Record<string, any> = (logseq.settings as Record<string, any>) || {};

    const setValue = (id: string, value: unknown) => {
        if (typeof value !== 'string' || value === '') return;
        const el = doc.getElementById(id) as HTMLInputElement | null;
        if (el) el.value = value;
    };
    const setChecked = (id: string, checked: unknown) => {
        if (checked !== true) return;
        const el = doc.getElementById(id) as HTMLInputElement | null;
        if (el) el.checked = true;
    };

    let primaryTag: string | undefined = settings.lastPrimaryTag;
    if (!primaryTag) {
        try {
            const currentPage = await logseq.Editor.getCurrentPage();
            primaryTag = (currentPage as any)?.originalName || currentPage?.name || undefined;
        } catch {
            // 현재 페이지를 가져오지 못하면 빈 값 유지
        }
    }

    setValue('primaryTag', primaryTag);
    setValue('filterKeywords', settings.lastFilterKeywords);
    setValue('sortField', settings.lastSortField);
    setValue('linkOpen', settings.lastLinkOpen);
    setValue('linkClose', settings.lastLinkClose);
    setChecked('sortDesc', settings.lastSortOrder === 'desc');
    setChecked('filterModeAnd', settings.lastFilterMode === 'and');
    setChecked('excludeParents', settings.lastExcludeParents);
    setChecked('includeOriginalContent', settings.lastIncludeOriginalContent);
    setChecked('plainTextLinks', settings.lastPlainTextLinks);
}

// Plain text 토글 체크 시 링크 치환 입력란을 비활성화해 두 옵션의 배타 관계를 드러낸다
function setupPlainTextLinksToggle() {
    const doc = parent.document || document;
    const checkbox = doc.getElementById('plainTextLinks') as HTMLInputElement | null;
    const linkOpen = doc.getElementById('linkOpen') as HTMLInputElement | null;
    const linkClose = doc.getElementById('linkClose') as HTMLInputElement | null;

    if (!checkbox || !linkOpen || !linkClose) return;

    const syncDisabledState = () => {
        const disabled = checkbox.checked;
        [linkOpen, linkClose].forEach(input => {
            input.disabled = disabled;
            input.style.opacity = disabled ? '0.4' : '';
        });
    };

    checkbox.addEventListener('change', syncDisabledState);
    syncDisabledState();
}

// 접힌 Advanced 섹션의 현재 설정을 요약 칩으로 표시
function updateAdvancedChips() {
    const doc = parent.document || document;
    const chips = doc.getElementById('advancedChips');
    if (!chips) return;

    const isChecked = (id: string) => (doc.getElementById(id) as HTMLInputElement | null)?.checked === true;
    const valueOf = (id: string) => (doc.getElementById(id) as HTMLInputElement | null)?.value || '';

    const open = valueOf('linkOpen');
    const close = valueOf('linkClose');

    const labels: string[] = [];
    labels.push(isChecked('plainTextLinks')
        ? 'plain links'
        : (open || close) ? `links: ${open}…${close}` : 'links: bold');
    if (isChecked('excludeParents')) labels.push('no parents');
    if (isChecked('includeOriginalContent')) labels.push('+tag body');

    chips.innerHTML = '';
    labels.forEach(text => {
        const chip = doc.createElement('span');
        chip.style.cssText = 'font-size: 11px; padding: 2px 8px; border-radius: 10px; background: var(--ls-tertiary-background-color, #f0f0f0); color: var(--ls-secondary-text-color, #666); white-space: nowrap;';
        chip.textContent = text;
        chips.appendChild(chip);
    });
}

// 하단에 실행 결과 파일명을 실시간 미리보기로 표시
function updateFilenamePreview() {
    const doc = parent.document || document;
    const preview = doc.getElementById('filenamePreview');
    if (!preview) return;

    const tag = (doc.getElementById('primaryTag') as HTMLInputElement | null)?.value.trim() || '';
    if (!tag) {
        preview.textContent = '';
        return;
    }

    const keywordsRaw = (doc.getElementById('filterKeywords') as HTMLInputElement | null)?.value || '';
    const keywords = keywordsRaw.split(',').map(k => k.trim()).filter(k => k.length > 0);
    const sortField = (doc.getElementById('sortField') as HTMLInputElement | null)?.value.trim() || 'filename';

    preview.textContent = '→ ' + generateFilename(tag, keywords, sortField);
}

// 입력 변경 시 파일명 미리보기와 Advanced 요약 칩을 갱신
function setupDynamicPreviews() {
    const doc = parent.document || document;

    ['primaryTag', 'filterKeywords', 'sortField'].forEach(id => {
        doc.getElementById(id)?.addEventListener('input', updateFilenamePreview);
    });
    ['linkOpen', 'linkClose'].forEach(id => {
        doc.getElementById(id)?.addEventListener('input', updateAdvancedChips);
    });
    ['plainTextLinks', 'excludeParents', 'includeOriginalContent'].forEach(id => {
        doc.getElementById(id)?.addEventListener('change', updateAdvancedChips);
    });

    updateFilenamePreview();
    updateAdvancedChips();
}

// CSS :focus/:focus-visible은 프로그래밍 방식 focus()에서 신뢰할 수 없으므로
// focusin/focusout으로 .be-focused 클래스를 직접 관리해 확실한 포커스 링을 보장한다
function setupFocusHighlight() {
    const dialog = parent.document.getElementById('block-extractor-dialog') ||
        document.getElementById('block-extractor-dialog');

    if (!dialog) return;

    dialog.addEventListener('focusin', (e) => {
        (e.target as HTMLElement)?.classList?.add('be-focused');
    });
    dialog.addEventListener('focusout', (e) => {
        (e.target as HTMLElement)?.classList?.remove('be-focused');
    });
}

// 다이얼로그 내 자동완성 목록이 하나라도 열려 있는지 확인
function anySuggestionsVisible(dialog: HTMLElement): boolean {
    return ['#primaryTagSuggestions', '#filterKeywordsSuggestions', '#sortFieldSuggestions']
        .some(selector => {
            const el = dialog.querySelector(selector) as HTMLElement | null;
            return !!el &&
                el.style.display !== 'none' &&
                el.querySelectorAll('.suggestion-item').length > 0;
        });
}

function maintainDialogFocus() {
    const dialog = parent.document.getElementById('block-extractor-dialog') ||
        document.getElementById('block-extractor-dialog');

    if (!dialog) return;

    // 포커스 대상은 Tab을 누를 때마다 DOM 순서대로 다시 계산한다.
    // (입력창 → 해당 옵션 순이 되도록 세그먼트 컨트롤을 입력창 뒤에 배치해 둠)
    // - 라디오 그룹은 체크된 항목만 포함해 그룹당 Tab 정거장을 하나로 만들고,
    //   그룹 내 이동은 브라우저 기본 동작(화살표 키)에 맡긴다.
    // - 접힌 details 내부는 focus()가 실패해 Tab이 갇히므로 제외한다 (summary 자신은 포함).
    // - disabled 요소도 같은 이유로 제외한다.
    const getFocusableElements = (): HTMLElement[] =>
        (Array.from(dialog.querySelectorAll(
            'input, button, select, textarea, summary, [tabindex]:not([tabindex="-1"])'
        )) as HTMLElement[]).filter(el => {
            const input = el as HTMLInputElement;
            if (input.disabled) return false;
            if (el.tagName !== 'SUMMARY' && el.closest('details:not([open])')) return false;
            if (input.type === 'radio') return input.checked;
            return true;
        });

    dialog.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        if (anySuggestionsVisible(dialog)) return;

        e.preventDefault();
        e.stopPropagation();

        const focusableArray = getFocusableElements();
        if (focusableArray.length === 0) return;

        // 플러그인은 iframe에서 실행되므로 다이얼로그가 속한 문서(parent)의 activeElement를 봐야 한다
        const active = dialog.ownerDocument.activeElement as HTMLElement | null;
        // 포커스가 체크 안 된 라디오에 있으면 같은 그룹(name)의 체크된 라디오 위치를 기준으로 삼는다
        const referenceElement = (active && (active as HTMLInputElement).type === 'radio' && !(active as HTMLInputElement).checked)
            ? focusableArray.find(el => (el as HTMLInputElement).name === (active as HTMLInputElement).name) || active
            : active;

        const currentIndex = referenceElement ? focusableArray.indexOf(referenceElement) : -1;
        let nextIndex: number;

        if (e.shiftKey) {
            nextIndex = currentIndex <= 0 ? focusableArray.length - 1 : currentIndex - 1;
        } else {
            nextIndex = currentIndex >= focusableArray.length - 1 ? 0 : currentIndex + 1;
        }

        focusableArray[nextIndex]?.focus();
    });
}

// data-on-click 속성이 달린 버튼을 프로그래밍 방식으로 클릭해 Logseq 모델 액션을 실행
function triggerDialogAction(dialog: HTMLElement, action: 'executeExtraction' | 'cancelDialog') {
    const button = dialog.querySelector(`[data-on-click="${action}"]`) as HTMLElement | null;
    button?.click();
}

function setupDialogEventHandlers() {
    const dialog = parent.document.getElementById('block-extractor-dialog') ||
        document.getElementById('block-extractor-dialog');

    if (!dialog) return;

    dialog.addEventListener('keydown', (e) => {
        // Cmd/Ctrl+Enter: 자동완성 표시 여부와 무관하게 항상 추출 실행
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            e.stopPropagation();
            triggerDialogAction(dialog, 'executeExtraction');
            return;
        }

        // 자동완성 목록이 열려 있으면 이동/선택/닫기 키는 autocomplete 핸들러에 맡긴다
        if (anySuggestionsVisible(dialog) &&
            (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter' || e.key === 'Escape')) {
            return;
        }

        // Enter 단독 입력은 오작동(의도치 않은 추출)을 막기 위해 무시한다.
        // 추출 실행은 Cmd/Ctrl+Enter 또는 버튼으로만 가능.
        // 버튼(클릭 실행)과 summary(Advanced 펼침/접힘)에서는 기본 동작을 유지한다.
        if (e.key === 'Enter') {
            const target = e.target as HTMLElement;
            if (target.tagName !== 'BUTTON' && target.tagName !== 'SUMMARY') {
                e.preventDefault();
            }
            e.stopPropagation();
            return;
        }

        // Escape: 다이얼로그 닫기
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            triggerDialogAction(dialog, 'cancelDialog');
            return;
        }

        e.stopPropagation();
    }, true);

    dialog.addEventListener('keyup', (e) => {
        e.stopPropagation();
    }, true);

    dialog.addEventListener('keypress', (e) => {
        e.stopPropagation();
    }, true);
}
