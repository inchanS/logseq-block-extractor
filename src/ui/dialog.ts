import {autoCompleteSelectFieldColor, setupAutoComplete} from './autocomplete';

export async function showInputDialog() {
    try {
        console.log('showInputDialog called');

        const key = 'block-extractor-input';

        logseq.provideUI({
            key,
            template: `
              <div id="block-extractor-dialog" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                          background: white; border: 2px solid #ccc; border-radius: 8px; 
                          padding: 20px; z-index: 1000; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                          min-width: 400px;">
                <h3 style="margin-top: 0; color: #333;">Block Extractor Settings</h3>
                
                <div style="margin-bottom: 15px; position: relative;">
                  <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">Primary Tag:</label>
                  <input type="text" id="primaryTag" placeholder="e.g., TagName" 
                         style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; 
                                font-size: 14px; color: #333333;">
                  <div id="primaryTagSuggestions" style="position: absolute; top: 100%; left: 0; right: 0; 
                                                         background: dimgray; border: 1px solid #ddd; 
                                                         border-top: none; border-radius: 0 0 4px 4px; 
                                                         max-height: 200px; overflow-y: auto; 
                                                         display: none; z-index: 1001;"></div>
                </div>
                
                <div style="margin-bottom: 15px; position: relative;">
                  <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">Filter Keywords (comma separated, optional):</label>
                  <input type="text" id="filterKeywords" placeholder="e.g., keyword1, keyword2 (leave empty for all blocks)" 
                         style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; 
                                font-size: 14px; color: #333333;">
                  <div id="filterKeywordsSuggestions" style="position: absolute; top: 100%; left: 0; right: 0; 
                                                             background: dimgray; border: 1px solid #ddd; 
                                                             border-top: none; border-radius: 0 0 4px 4px; 
                                                             max-height: 200px; overflow-y: auto; 
                                                             display: none; z-index: 1001;"></div>
                </div>

                <div style="margin-bottom: 15px;">
                  <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">Filter Mode: (For multiple keywords)</label>
                  <div style="display: flex; gap: 20px;">
                    <label style="display: flex; align-items: center; cursor: pointer; font-size: 14px; color: #333;">
                      <input type="radio" id="filterModeOr" name="filterMode" value="or" checked 
                             style="margin-right: 6px; cursor: pointer;">
                      Any (OR)
                    </label>
                    <label style="display: flex; align-items: center; cursor: pointer; font-size: 14px; color: #333;">
                      <input type="radio" id="filterModeAnd" name="filterMode" value="and" 
                             style="margin-right: 6px; cursor: pointer;">
                      All (AND)
                    </label>
                  </div>
                </div>
                
                <div style="margin-bottom: 15px; position: relative;">
                  <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">Sort Field (optional):</label>
                  <input type="text" id="sortField" placeholder="e.g., date, created-at (leave empty for filename)" 
                         style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; 
                                font-size: 14px; color: #333333;">
                  <div id="sortFieldSuggestions" style="position: absolute; top: 100%; left: 0; right: 0; 
                                                       background: dimgray; border: 1px solid #ddd; 
                                                       border-top: none; border-radius: 0 0 4px 4px; 
                                                       max-height: 200px; overflow-y: auto; 
                                                       display: none; z-index: 1001;"></div>
                  <small style="color: #666; font-size: 12px;">Default: filename. For other fields, enter property name like 'date', 'created-at', etc.</small>
                </div>
                
                <div style="margin-bottom: 20px;">
                  <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">Sort Order:</label>
                  <div style="display: flex; gap: 20px;">
                    <label style="display: flex; align-items: center; cursor: pointer; font-size: 14px; color: #333;">
                      <input type="radio" id="sortAsc" name="sortOrder" value="asc" checked 
                             style="margin-right: 6px; cursor: pointer;">
                      Ascending (A → Z)
                    </label>
                    <label style="display: flex; align-items: center; cursor: pointer; font-size: 14px; color: #333;">
                      <input type="radio" id="sortDesc" name="sortOrder" value="desc" 
                             style="margin-right: 6px; cursor: pointer;">
                      Descending (Z → A)
                    </label>
                  </div>
                </div>
                
                <div style="text-align: right;">
                  <button data-on-click="cancelDialog" style="padding: 8px 16px; margin-right: 10px; 
                                              background: #f5f5f5; border: 1px solid #ddd; 
                                              border-radius: 4px; cursor: pointer; color: #333;">Cancel</button>
                  <button data-on-click="executeExtraction" style="padding: 8px 16px; background: #4CAF50; 
                                               color: white; border: none; border-radius: 4px; 
                                               cursor: pointer;">Extract Blocks</button>
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
            color: #cccccc !important;
            opacity: 0.6 !important;
        }
        
        .suggestion-item:hover {
            background-color: ${autoCompleteSelectFieldColor} !important;
        }
        
        #block-extractor-dialog input:focus {
            outline: 2px solid #4CAF50;
            outline-offset: -2px;
        }
    `;

    if (parent.document.head) {
        parent.document.head.appendChild(style);
    } else if (document.head) {
        document.head.appendChild(style);
    }
}
