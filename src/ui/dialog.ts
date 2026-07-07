import {autoCompleteSelectFieldColor, setupAutoComplete} from './autocomplete';

export async function showInputDialog() {
    try {
        console.log('showInputDialog called');

        const key = 'block-extractor-input';

        logseq.provideUI({
            key,
            template: `
  <div id="block-extractor-dialog" role="dialog" aria-modal="true" aria-labelledby="block-extractor-title"
       style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
              background: var(--ls-primary-background-color, white); border: 2px solid var(--ls-border-color, #ccc); border-radius: 8px;
              padding: 16px; z-index: 1000; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
              min-width: 420px; max-width: 90vw; max-height: 85vh; overflow-y: auto;">
    <h3 id="block-extractor-title" style="margin-top: 0; margin-bottom: 8px; color: var(--ls-primary-text-color, #333); font-size: 18px;">Block Extractor Settings</h3>
    <p style="margin-bottom: 12px; color: var(--ls-secondary-text-color, #666); font-size: 14px;">
      Extract the Linked References Contents of a Tag (or a Page) to an MD file.
    </p>
    
    <div style="margin-bottom: 12px; position: relative;">
      <label for="primaryTag" style="display: block; margin-bottom: 6px; font-weight: bold; color: var(--ls-primary-text-color, #333);">Primary Tag:</label>
      <input type="text" id="primaryTag" placeholder="e.g., TagName" 
             style="width: 100%; padding: 8px; border: 1px solid var(--ls-border-color, #ddd); border-radius: 6px; 
                    font-size: 14px; color: var(--ls-link-ref-text-color, #333) !important; background: var(--ls-secondary-background-color, white);">
      <div id="primaryTagSuggestions" style="position: absolute; top: 100%; left: 0; right: 0; 
                                             background: var(--ls-secondary-background-color, dimgray); border: 1px solid var(--ls-border-color, #ddd); 
                                             border-top: none; border-radius: 0 0 6px 6px; 
                                             max-height: 200px; overflow-y: auto; 
                                             display: none; z-index: 1001;"></div>
      <small style="color: var(--ls-secondary-text-color, #666); font-size: 12px; margin-top: 2px; display: block;">Extract the block where this tag (or page) is referenced.</small>
    </div>
    
    <div style="margin-bottom: 12px; position: relative;">
      <label for="filterKeywords" style="display: block; margin-bottom: 6px; font-weight: bold; color: var(--ls-primary-text-color, #333);">Filter Keywords (comma separated, optional):</label>
      <input type="text" id="filterKeywords" placeholder="e.g., keyword1, keyword2, -exclude (leave empty for all blocks)" 
             style="width: 100%; padding: 8px; border: 1px solid var(--ls-border-color, #ddd); border-radius: 6px; 
                    font-size: 14px; color: var(--ls-link-ref-text-color, #333) !important; background: var(--ls-secondary-background-color, white);">
      <div id="filterKeywordsSuggestions" style="position: absolute; top: 100%; left: 0; right: 0; 
                                                 background: var(--ls-secondary-background-color, dimgray); border: 1px solid var(--ls-border-color, #ddd); 
                                                 border-top: none; border-radius: 0 0 6px 6px; 
                                                 max-height: 200px; overflow-y: auto; 
                                                 display: none; z-index: 1001;"></div>
      <small style="color: var(--ls-secondary-text-color, #666); font-size: 12px; margin-top: 2px; display: block;"> Use '-' prefix to exclude keywords (e.g., "coding, -draft" includes coding but excludes draft)</small>
    </div>
    
    <div style="margin-bottom: 12px;">
      <label style="display: block; margin-bottom: 6px; font-weight: bold; color: var(--ls-primary-text-color, #333);">Filter Mode: (For multiple keywords)</label>
      
      <!--   라디오 버튼 스타일      -->
      <style>
        .filter-mode-container,
        .sort-order-container {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        
        .filter-option,
        .sort-option {
          transition: all 0.2s ease;
          padding: 8px 12px;
          border-radius: 8px;
          border: 2px solid transparent;
          margin-bottom: 6px;
          flex: 1;
          min-width: 150px;
        }
        
        .filter-option:has(input:checked),
        .sort-option:has(input:checked) {
          background-color: var(--ls-secondary-background-color, #e8f4fd);
          box-shadow: 0 2px 8px rgba(0, 102, 204, 0.15);
        }
        
        .filter-option:has(input:checked) .option-text,
        .sort-option:has(input:checked) .option-text {
          font-weight: bold;
          color: var(--ls-link-text-color, #0066cc) !important;
        }
        
        .filter-option input[type="radio"]:checked,
        .sort-option input[type="radio"]:checked {
          transform: scale(1.3);
          accent-color: var(--ls-link-text-color, #0066cc);
        }
        
        .filter-option input[type="radio"]:checked:not(:focus),
        .sort-option input[type="radio"]:checked:not(:focus) {
          background-color: #004499;
          accent-color: var(--ls-link-text-color, #0066cc);
          box-shadow: 0 0 0 2px #004499;
        }
                            
        .filter-option:hover,
        .sort-option:hover {
          background-color: var(--ls-tertiary-background-color, #f8f9fa);
        }
        
        .filter-option:has(input[type="checkbox"]:checked) {
          background-color: var(--ls-secondary-background-color, #e8f4fd);
          border-color: var(--ls-link-text-color, #0066cc);
          box-shadow: 0 2px 8px rgba(0, 102, 204, 0.15);
        }
        
        .filter-option:has(input[type="checkbox"]:checked) .option-text {
          font-weight: bold;
          color: var(--ls-link-text-color, #0066cc) !important;
        }
        
        .filter-option input[type="checkbox"]:checked {
          transform: scale(1.3);
          accent-color: var(--ls-link-text-color, #0066cc);
          border-color: var(--ls-link-text-color, #0066cc);
          background-color: var(--ls-link-text-color, #0066cc);
          box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.2);
        }
          
        .filter-option input[type="checkbox"] {
          margin-right: 12px; 
          cursor: pointer; 
          width: 16px; 
          height: 16px; 
          accent-color: var(--ls-link-text-color, #0066cc);
          border: 2px solid var(--ls-border-color, #ddd);
          border-radius: 3px;
        }
      </style>
      
      <div class="filter-mode-container" style="display: flex; gap: 16px; flex-wrap: wrap;">
        <div class="filter-option" style="display: flex; align-items: center; cursor: pointer; flex: 1; min-width: 150px;">
          <label style="display: flex; align-items: center; cursor: pointer; font-size: 14px; color: var(--ls-primary-text-color, #333); width: 100%;">
            <input type="radio" id="filterModeOr" name="filterMode" value="or" checked 
                   style="margin-right: 12px; cursor: pointer;">
            <span class="option-text">Any</span>
          </label>
        </div>
        <div class="filter-option" style="display: flex; align-items: center; cursor: pointer; flex: 1; min-width: 150px;">
          <label style="display: flex; align-items: center; cursor: pointer; font-size: 14px; color: var(--ls-primary-text-color, #333); width: 100%;">
            <input type="radio" id="filterModeAnd" name="filterMode" value="and" 
                   style="margin-right: 12px; cursor: pointer;">
            <span class="option-text">All</span>
          </label>
        </div>
      </div>
    </div>
    
    <div style="margin-bottom: 12px; position: relative;">
      <label for="sortField" style="display: block; margin-bottom: 6px; font-weight: bold; color: var(--ls-primary-text-color, #333);">Sort Field (optional):</label>
      <input type="text" id="sortField" placeholder="e.g., date, created-at (leave empty for filename)" 
             style="width: 100%; padding: 8px; border: 1px solid var(--ls-border-color, #ddd); border-radius: 6px; 
                    font-size: 14px; color: var(--ls-link-ref-text-color, #333) !important; background: var(--ls-secondary-background-color, white);">
      <div id="sortFieldSuggestions" style="position: absolute; top: 100%; left: 0; right: 0; 
                                           background: var(--ls-secondary-background-color, dimgray); border: 1px solid var(--ls-border-color, #ddd); 
                                           border-top: none; border-radius: 0 0 6px 6px; 
                                           max-height: 200px; overflow-y: auto; 
                                           display: none; z-index: 1001;"></div>
      <small style="color: var(--ls-secondary-text-color, #666); font-size: 12px; margin-top: 2px; display: block;">Enter one property name only (e.g., 'date', 'created-at'). Default: filename if empty.</small>
    </div>
    
    <div style="margin-bottom: 12px;">
      <label style="display: block; margin-bottom: 6px; font-weight: bold; color: var(--ls-primary-text-color, #333);">Sort Order:</label>
      
      <div class="sort-order-container" style="display: flex; gap: 16px; flex-wrap: wrap;">
        <div class="sort-option" style="display: flex; align-items: center; cursor: pointer; flex: 1; min-width: 150px;">
          <label style="display: flex; align-items: center; cursor: pointer; font-size: 14px; color: var(--ls-primary-text-color, #333); width: 100%;">
            <input type="radio" id="sortAsc" name="sortOrder" value="asc" checked 
                   style="margin-right: 12px; cursor: pointer;">
            <span class="sort-text">Ascending (A → Z)</span>
          </label>
        </div>
        
        <div class="sort-option" style="display: flex; align-items: center; cursor: pointer; flex: 1; min-width: 150px;">
          <label style="display: flex; align-items: center; cursor: pointer; font-size: 14px; color: var(--ls-primary-text-color, #333); width: 100%;">
            <input type="radio" id="sortDesc" name="sortOrder" value="desc" 
                   style="margin-right: 12px; cursor: pointer;">
            <span class="sort-text">Descending (Z → A)</span>
          </label>
        </div>
      </div>
    </div>
    
    <!-- Link Replacement와 Hierarchy Options를 가로로 배치 -->
    <div style="margin-bottom: 16px;">
      <label style="display: block; margin-bottom: 6px; font-weight: bold; color: var(--ls-primary-text-color, #333);">Options:</label>
      
      <div style="display: flex; gap: 16px; align-items: flex-start;">
        <!-- Link Replacement (2/3 비율) -->
        <div style="flex: 2;">
          <label style="display: block; margin-bottom: 4px; font-size: 13px; color: var(--ls-secondary-text-color, #666);">Link Replacement (optional):</label>
          <div style="display: flex; gap: 8px;">
            <div style="flex: 1;">
              <input type="text" id="linkOpen" placeholder="**" aria-label="Link replacement opening text"
                     style="width: 100%; padding: 6px; border: 1px solid var(--ls-border-color, #ddd); border-radius: 4px; 
                            font-size: 14px; color: var(--ls-link-ref-text-color, #333) !important; background: var(--ls-secondary-background-color, white);">
            </div>
            <div style="flex: 1;">
              <input type="text" id="linkClose" placeholder="**" aria-label="Link replacement closing text"
                     style="width: 100%; padding: 6px; border: 1px solid var(--ls-border-color, #ddd); border-radius: 4px;
                            font-size: 14px; color: var(--ls-link-ref-text-color, #333) !important; background: var(--ls-secondary-background-color, white);">
            </div>
          </div>
          <div class="filter-option" style="display: flex; align-items: center; cursor: pointer; padding: 4px 8px; border-radius: 6px; border: 2px solid transparent; margin-top: 4px;">
            <label style="display: flex; align-items: center; cursor: pointer; font-size: 13px; color: var(--ls-primary-text-color, #333); width: 100%;">
              <input type="checkbox" id="plainTextLinks"
                     style="margin-right: 8px; cursor: pointer; width: 16px; height: 16px; accent-color: var(--ls-link-text-color, #0066cc);">
              <span class="option-text">Plain text ([[abc]] &rarr; abc)</span>
            </label>
          </div>
        </div>
        
        <div style="flex: 1.5;">
          <label style="display: block; margin-bottom: 4px; font-size: 13px; color: var(--ls-secondary-text-color, #666);">Toggles:</label>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div class="filter-option" style="display: flex; align-items: center; cursor: pointer; padding: 4px 8px; border-radius: 6px; border: 2px solid transparent;">
              <label style="display: flex; align-items: center; cursor: pointer; font-size: 14px; color: var(--ls-primary-text-color, #333); width: 100%;">
                <input type="checkbox" id="excludeParents" 
                       style="margin-right: 8px; cursor: pointer; width: 16px; height: 16px; accent-color: var(--ls-link-text-color, #0066cc);">
                <span class="option-text">Exclude Parents</span>
              </label>
            </div>
            
            <div class="filter-option" style="display: flex; align-items: center; cursor: pointer; padding: 4px 8px; border-radius: 6px; border: 2px solid transparent;">
              <label style="display: flex; align-items: center; cursor: pointer; font-size: 14px; color: var(--ls-primary-text-color, #333); width: 100%; white-space: nowrap;">
                <input type="checkbox" id="includeOriginalContent" 
                       style="margin-right: 8px; cursor: pointer; width: 16px; height: 16px; accent-color: var(--ls-link-text-color, #0066cc);">
                <span class="option-text">Include Tag Body</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <small style="color: var(--ls-secondary-text-color, #666); font-size: 12px; margin-top: 6px; display: block;">
        Links [[...]] are converted to bold (**...**) by default. Enter "[[" and "]]" to keep Logseq syntax, or check "Plain text" to remove brackets. "Exclude Parents" shows only target block and children. "Include Tag Body" appends original page content.
      </small>
    </div>

    
    <div style="margin-bottom: 10px; padding-top: 8px; border-top: 1px solid var(--ls-border-color, #eee);
                color: var(--ls-secondary-text-color, #888); font-size: 11px; text-align: center;">
      <kbd>Tab</kbd> Move &nbsp;·&nbsp; <kbd>↑↓</kbd> Suggestions
    </div>

    <div style="text-align: right; display: flex; justify-content: flex-end; gap: 12px;">
      <button data-on-click="cancelDialog" style="padding: 8px 14px;
                                  background: var(--ls-tertiary-background-color, #f5f5f5); border: 1px solid var(--ls-border-color, #ddd);
                                  border-radius: 6px; cursor: pointer; color: var(--ls-primary-text-color, #333);
                                  font-weight: normal; transition: all 0.2s ease;">Cancel <span class="btn-kbd">Esc</span></button>
      <button data-on-click="executeExtraction" style="padding: 8px 16px; background: var(--ls-secondary-background-color, #4CAF50);
                               color: white; border: none; border-radius: 6px;
                               cursor: pointer; color: var(--ls-active-secondary-color, #333); font-weight: bold; transition: all 0.2s ease;">Extract Blocks <span class="btn-kbd">⌘/Ctrl+Enter</span></button>
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
                injectDialogStyles();
                await prefillLastUsedValues();
                setupPlainTextLinksToggle();

                const firstInput = (parent.document || document).querySelector('#primaryTag') as HTMLInputElement | null;
                if (firstInput) {
                    setTimeout(() => {
                        firstInput.focus();
                        // 미리 채워진 값을 전체 선택해 두면 바로 타이핑으로 교체하거나 Enter로 재실행 가능
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

    // 포커스 대상은 Tab을 누를 때마다 다시 계산한다.
    // 라디오 그룹은 체크된 항목만 포함해 그룹당 Tab 정거장을 하나로 만들고,
    // 그룹 내 이동은 브라우저 기본 동작(화살표 키)에 맡긴다.
    const getFocusableElements = (): HTMLElement[] =>
        (Array.from(dialog.querySelectorAll(
            'input, button, select, textarea, [tabindex]:not([tabindex="-1"])'
        )) as HTMLElement[]).filter(el => {
            const input = el as HTMLInputElement;
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
        // 추출 실행은 Cmd/Ctrl+Enter 또는 버튼으로만 가능 (버튼 위에서는 기본 동작 유지)
        if (e.key === 'Enter') {
            const target = e.target as HTMLElement;
            if (target.tagName !== 'BUTTON') {
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

function injectDialogStyles() {
    const doc: Document = parent.document.head ? parent.document : document;

    // 다이얼로그를 열 때마다 style 요소가 누적되지 않도록 이미 주입되어 있으면 건너뜀
    const STYLE_ID = 'block-extractor-dialog-styles';
    if (doc.getElementById(STYLE_ID)) return;

    const style = doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        #primaryTag::placeholder,
        #filterKeywords::placeholder,
        #sortField::placeholder {
            color: var(--ls-secondary-text-color, #aaa) !important;
            opacity: 0.7 !important;
        }
        
        .suggestion-item {
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid var(--ls-border-color, #eee);
            color: var(--ls-primary-text-color, #333);
        }
        
        .suggestion-item:hover {
            background-color: var(--ls-selection-background-color, ${autoCompleteSelectFieldColor}) !important;
            color: var(--ls-selection-text-color, white) !important;
        }
        
        #block-extractor-dialog kbd {
            padding: 1px 5px;
            border: 1px solid var(--ls-border-color, #ccc);
            border-radius: 3px;
            font-size: 10px;
            font-family: inherit;
            background: var(--ls-secondary-background-color, #f5f5f5);
        }

        #block-extractor-dialog .btn-kbd {
            font-size: 10px;
            font-weight: normal;
            opacity: 0.65;
            margin-left: 6px;
            padding: 1px 4px;
            border: 1px solid currentColor;
            border-radius: 3px;
        }

        #block-extractor-dialog input:focus {
            outline: 2px solid var(--ls-active-primary-color, #4CAF50);
            outline-offset: -2px;
            box-shadow: 0 0 0 1px rgba(76, 175, 80, 0.2);
        }
        
        #block-extractor-dialog button:hover {
            opacity: 0.9;
            transform: translateY(-1px);
        }
        
        #block-extractor-dialog button:active {
            transform: translateY(0);
        }
        
        @media (prefers-color-scheme: dark) {
            #block-extractor-dialog {
                background: var(--ls-primary-background-color, #2a2a2a) !important;
                color: var(--ls-primary-text-color, #eee) !important;
            }
            
            #block-extractor-dialog input, 
            #block-extractor-dialog button[data-on-click="cancelDialog"] {
                background: var(--ls-secondary-background-color, #333) !important;
                color: var(--ls-primary-text-color, #eee) !important;
            }
        }
    `;

    doc.head.appendChild(style);
}