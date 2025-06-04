import {autoCompleteSelectFieldColor, setupAutoComplete} from './autocomplete';

export async function showInputDialog() {
    try {
        console.log('showInputDialog called');

        const key = 'block-extractor-input';

        logseq.provideUI({
            key,
            template: `
              <div id="block-extractor-dialog" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                          background: var(--ls-primary-background-color, white); border: 2px solid var(--ls-border-color, #ccc); border-radius: 8px; 
                          padding: 24px; z-index: 1000; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                          min-width: 420px; max-width: 90vw;">
                <h3 style="margin-top: 0; color: var(--ls-primary-text-color, #333); font-size: 18px;">Block Extractor Settings</h3>
                <p style="margin-bottom: 16px; color: var(--ls-secondary-text-color, #666); font-size: 14px;">
                  Extract the Linked References Contents of a Tag (or a Page) to an MD file.
                </p>
                
                <div style="margin-bottom: 18px; position: relative;">
                  <label style="display: block; margin-bottom: 8px; font-weight: bold; color: var(--ls-primary-text-color, #333);">Primary Tag:</label>
                  <input type="text" id="primaryTag" placeholder="e.g., TagName" 
                         style="width: 100%; padding: 10px; border: 1px solid var(--ls-border-color, #ddd); border-radius: 6px; 
                                font-size: 14px; color: var(--ls-link-ref-text-color, #333) !important; background: var(--ls-secondary-background-color, white);">
                  <div id="primaryTagSuggestions" style="position: absolute; top: 100%; left: 0; right: 0; 
                                                         background: var(--ls-secondary-background-color, dimgray); border: 1px solid var(--ls-border-color, #ddd); 
                                                         border-top: none; border-radius: 0 0 6px 6px; 
                                                         max-height: 200px; overflow-y: auto; 
                                                         display: none; z-index: 1001;"></div>
                  <small style="color: var(--ls-secondary-text-color, #666); font-size: 12px; margin-top: 4px; display: block;">Extract the block where this tag (or page) is referenced.</small>
                </div>
                
                <div style="margin-bottom: 18px; position: relative;">
                  <label style="display: block; margin-bottom: 8px; font-weight: bold; color: var(--ls-primary-text-color, #333);">Filter Keywords (comma separated, optional):</label>
                  <input type="text" id="filterKeywords" placeholder="e.g., keyword1, keyword2, -exclude (leave empty for all blocks)" 
                         style="width: 100%; padding: 10px; border: 1px solid var(--ls-border-color, #ddd); border-radius: 6px; 
                                font-size: 14px; color: var(--ls-link-ref-text-color, #333) !important; background: var(--ls-secondary-background-color, white);">
                  <div id="filterKeywordsSuggestions" style="position: absolute; top: 100%; left: 0; right: 0; 
                                                             background: var(--ls-secondary-background-color, dimgray); border: 1px solid var(--ls-border-color, #ddd); 
                                                             border-top: none; border-radius: 0 0 6px 6px; 
                                                             max-height: 200px; overflow-y: auto; 
                                                             display: none; z-index: 1001;"></div>
                  <small style="color: var(--ls-secondary-text-color, #666); font-size: 12px; margin-top: 4px; display: block;"> Use '-' prefix to exclude keywords (e.g., "coding, -draft" includes coding but excludes draft)</small>
                </div>
                
                <div style="margin-bottom: 18px;">
                  <label style="display: block; margin-bottom: 10px; font-weight: bold; color: var(--ls-primary-text-color, #333);">Filter Mode: (For multiple keywords)</label>
                  
                  
                <!--   라디오 버튼 스타일      -->
                  <style>
                    .filter-option,
                    .sort-option {
                      transition: all 0.2s ease;
                      padding: 10px 15px;
                      border-radius: 8px;
                      border: 2px solid transparent;
                      margin-bottom: 8px;
                    }
                    
                    .filter-option:has(input:checked), 
                    .sort-option:has(input:checked) {
                      background-color: var(--ls-secondary-background-color, #e8f4fd);
                      border-color: var(--ls-link-text-color, #0066cc);
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
                      background-color: #004499; /* 조금 더 어두운 색상 */
                      accent-color: var(--ls-link-text-color, #0066cc);
                      box-shadow: 0 0 0 2px #004499;
                    }
                                        
                    .filter-option:hover,
                    .sort-option:hover {
                      background-color: var(--ls-tertiary-background-color, #f8f9fa);
                    }
                  </style>
                  
                  <div class="filter-option" style="display: flex; align-items: center; cursor: pointer;">
                    <label style="display: flex; align-items: center; cursor: pointer; font-size: 14px; color: var(--ls-primary-text-color, #333); width: 100%;">
                      <input type="radio" id="filterModeOr" name="filterMode" value="or" checked 
                             style="margin-right: 12px; cursor: pointer;">
                      <span class="option-text">Any (OR)</span>
                      <span style="display: inline-block; margin-left: 8px; color: var(--ls-secondary-text-color, #666); font-size: 12px;">
                        - Include any of the following
                      </span>
                    </label>
                  </div>
                  <div class="filter-option" style="display: flex; align-items: center; cursor: pointer;">
                    <label style="display: flex; align-items: center; cursor: pointer; font-size: 14px; color: var(--ls-primary-text-color, #333); width: 100%;">
                      <input type="radio" id="filterModeAnd" name="filterMode" value="and" 
                             style="margin-right: 12px; cursor: pointer;">
                      <span class="option-text">All (AND)</span>
                      <span style="display: inline-block; margin-left: 8px; color: var(--ls-secondary-text-color, #666); font-size: 12px;">
                        - Include all keywords
                      </span>
                    </label>
                  </div>
                </div>
                
                <div style="margin-bottom: 18px; position: relative;">
                  <label style="display: block; margin-bottom: 8px; font-weight: bold; color: var(--ls-primary-text-color, #333);">Sort Field (optional):</label>
                  <input type="text" id="sortField" placeholder="e.g., date, created-at (leave empty for filename)" 
                         style="width: 100%; padding: 10px; border: 1px solid var(--ls-border-color, #ddd); border-radius: 6px; 
                                font-size: 14px; color: var(--ls-link-ref-text-color, #333) !important; background: var(--ls-secondary-background-color, white);">
                  <div id="sortFieldSuggestions" style="position: absolute; top: 100%; left: 0; right: 0; 
                                                       background: var(--ls-secondary-background-color, dimgray); border: 1px solid var(--ls-border-color, #ddd); 
                                                       border-top: none; border-radius: 0 0 6px 6px; 
                                                       max-height: 200px; overflow-y: auto; 
                                                       display: none; z-index: 1001;"></div>
                  <small style="color: var(--ls-secondary-text-color, #666); font-size: 12px; margin-top: 4px; display: block;">Default: filename. For other fields, enter property name like 'date', 'created-at', etc.</small>
                </div>
                
                <div style="margin-bottom: 24px;">
                  <label style="display: block; margin-bottom: 10px; font-weight: bold; color: var(--ls-primary-text-color, #333);">Sort Order:</label>
                   <div class="sort-option" style="display: flex; align-items: center; cursor: pointer;">
                    <label style="display: flex; align-items: center; cursor: pointer; font-size: 14px; color: var(--ls-primary-text-color, #333); width: 100%;">
                      <input type="radio" id="sortAsc" name="sortOrder" value="asc" checked 
                             style="margin-right: 12px; cursor: pointer;">
                      <span class="sort-text">Ascending (A → Z)</span>
                    </label>
                  </div>
                  
                  <div class="sort-option" style="display: flex; align-items: center; cursor: pointer;">
                    <label style="display: flex; align-items: center; cursor: pointer; font-size: 14px; color: var(--ls-primary-text-color, #333); width: 100%;">
                      <input type="radio" id="sortDesc" name="sortOrder" value="desc" 
                             style="margin-right: 12px; cursor: pointer;">
                      <span class="sort-text">Descending (Z → A)</span>
                    </label>
                  </div>
                </div>
                
                <div style="text-align: right; display: flex; justify-content: flex-end; gap: 12px;">
                  <button data-on-click="cancelDialog" style="padding: 10px 16px; 
                                              background: var(--ls-tertiary-background-color, #f5f5f5); border: 1px solid var(--ls-border-color, #ddd); 
                                              border-radius: 6px; cursor: pointer; color: var(--ls-primary-text-color, #333);
                                              font-weight: normal; transition: all 0.2s ease;">Cancel</button>
                  <button data-on-click="executeExtraction" style="padding: 10px 18px; background: var(--ls-secondary-background-color, #4CAF50); 
                                               color: white; border: none; border-radius: 6px; 
                                               cursor: pointer; color: var(--ls-active-secondary-color, #333); font-weight: bold; transition: all 0.2s ease;">Extract Blocks</button>
                </div>
              </div>
              <div data-on-click="cancelDialog" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                          background: rgba(0,0,0,0.5); z-index: 999;"></div>
            `,
            style: {
                width: '100vw',
                height: '100vh'
            }
        });

        setTimeout(() => {
            try {
                setupAutoComplete();
                maintainDialogFocus();
                setupDialogEventHandlers();
                injectDialogStyles();

                const firstInput = (parent.document || document).querySelector('#primaryTag');
                if (firstInput instanceof HTMLInputElement) {
                    setTimeout(() => firstInput.focus(), 100);
                }
            } catch (error) {
                console.error('Error in dialog setup:', error);
            }
        }, 100);

    } catch (error:unknown) {
        console.error('Error in showInputDialog:', error);
        if (error instanceof Error) {
            logseq.UI.showMsg(`Error: ${error.message}`, 'error');
        } else {
            logseq.UI.showMsg(`Error: ${String(error)}`, 'error');
        }
    }
}

function maintainDialogFocus() {
    const dialog = parent.document.getElementById('block-extractor-dialog') ||
        document.getElementById('block-extractor-dialog');

    if (!dialog) return;

    const focusableElements = dialog.querySelectorAll(
        'input, button, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    dialog.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            const primarySuggestions: any = dialog.querySelector('#primaryTagSuggestions')!;
            const filterSuggestions: any = dialog.querySelector('#filterKeywordsSuggestions');
            const sortFieldSuggestions: any = dialog.querySelector('#sortFieldSuggestions');

            const isPrimarySuggestionsVisible = primarySuggestions &&
                primarySuggestions.style.display !== 'none' &&
                primarySuggestions.querySelectorAll('.suggestion-item').length > 0;

            const isFilterSuggestionsVisible = filterSuggestions &&
                filterSuggestions.style.display !== 'none' &&
                filterSuggestions.querySelectorAll('.suggestion-item').length > 0;

            const isSortFieldSuggestionsVisible = sortFieldSuggestions &&
                sortFieldSuggestions.style.display !== 'none' &&
                sortFieldSuggestions.querySelectorAll('.suggestion-item').length > 0;

            if (isPrimarySuggestionsVisible || isFilterSuggestionsVisible || isSortFieldSuggestionsVisible) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            const focusableArray = Array.from(focusableElements);
            const currentIndex = focusableArray.indexOf(document.activeElement as Element);
            let nextIndex;

            if (e.shiftKey) {
                nextIndex = currentIndex <= 0 ? focusableArray.length - 1 : currentIndex - 1;
            } else {
                nextIndex = currentIndex >= focusableArray.length - 1 ? 0 : currentIndex + 1;
            }

            const nextElement = focusableArray[nextIndex];
            if (nextElement instanceof HTMLElement) {
                nextElement.focus();
            }
        }
    });
}

function setupDialogEventHandlers() {
    const dialog = parent.document.getElementById('block-extractor-dialog') ||
        document.getElementById('block-extractor-dialog');

    if (!dialog) return;

    dialog.addEventListener('keydown', (e) => {
        const primarySuggestions: any = dialog.querySelector('#primaryTagSuggestions');
        const filterSuggestions: any = dialog.querySelector('#filterKeywordsSuggestions');
        const sortFieldSuggestions: any = dialog.querySelector('#sortFieldSuggestions');

        const isPrimarySuggestionsVisible = primarySuggestions &&
            primarySuggestions.style.display !== 'none' &&
            primarySuggestions.querySelectorAll('.suggestion-item').length > 0;

        const isFilterSuggestionsVisible = filterSuggestions &&
            filterSuggestions.style.display !== 'none' &&
            filterSuggestions.querySelectorAll('.suggestion-item').length > 0;

        const isSortFieldSuggestionsVisible = sortFieldSuggestions &&
            sortFieldSuggestions.style.display !== 'none' &&
            sortFieldSuggestions.querySelectorAll('.suggestion-item').length > 0;

        if ((isPrimarySuggestionsVisible || isFilterSuggestionsVisible || isSortFieldSuggestionsVisible) &&
            (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter' || e.key === 'Escape')) {
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
    const style = document.createElement('style');
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

    if (parent.document.head) {
        parent.document.head.appendChild(style);
    } else if (document.head) {
        document.head.appendChild(style);
    }
}