import {getAllPages, getAllProperties} from '../data/query';

export const autoCompleteSelectFieldColor = '#3c7059';

export async function setupAutoComplete() {
    const allPages = await getAllPages();
    const allProperties = await getAllProperties();

    setupFieldAutoComplete('primaryTag', 'primaryTagSuggestions', allPages);
    setupFieldAutoComplete('filterKeywords', 'filterKeywordsSuggestions', allPages, true);
    setupFieldAutoComplete('sortField', 'sortFieldSuggestions', allProperties);
}

function setupFieldAutoComplete(inputId: any, suggestionsId: any, pages: any, multipleKeywords = false) {
    const input: any = parent.document.getElementById(inputId) || document.getElementById(inputId);
    const suggestions = parent.document.getElementById(suggestionsId) || document.getElementById(suggestionsId);

    if (!input || !suggestions) {
        console.warn(`Could not find elements: ${inputId}, ${suggestionsId}`);
        return;
    }

    // 기존 이벤트 리스너 제거
    const handlerMap = {
        'input': '_autoCompleteInputHandler',
        'keydown': '_autoCompleteKeydownHandler'
    };

    Object.entries(handlerMap).forEach(([eventType, handlerProp]) => {
        if ((input as any)[handlerProp]) {
            input.removeEventListener(eventType, (input as any)[handlerProp]);
        }
    });

    let currentSuggestionIndex = -1;

    const inputHandler = (e: any) => {
        const value = e.target.value;
        let searchTerm = value;

        if (multipleKeywords) {
            const lastCommaIndex = value.lastIndexOf(',');
            if (lastCommaIndex !== -1) {
                searchTerm = value.substring(lastCommaIndex + 1).trim();
            }
        }

        if (searchTerm.length < 2) {
            suggestions.style.display = 'none';
            return;
        }

        const filteredPages = pages.filter((page: string) =>
            page.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 10);

        if (filteredPages.length === 0) {
            suggestions.style.display = 'none';
            return;
        }

        suggestions.innerHTML = filteredPages.map((page: string, index: number) => `
            <div class="suggestion-item" data-index="${index}" data-page="${page}"
                 style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;
                        ${index === currentSuggestionIndex ? 'background-color: #f0f0f0;' : ''}">
                ${page}
            </div>
        `).join('');

        suggestions.style.display = 'block';
        currentSuggestionIndex = -1;

        // 클릭 이벤트 추가
        suggestions.querySelectorAll('.suggestion-item').forEach((item:any) => {
            item.addEventListener('click', (e:any) => {
                e.preventDefault();
                e.stopPropagation();
                const selectedPage = item.dataset.page;
                insertSelectedPage(input, selectedPage, multipleKeywords);
                suggestions.style.display = 'none';
                setTimeout(() => input.focus(), 10);
            });

            item.addEventListener('mouseenter', () => {
                suggestions.querySelectorAll('.suggestion-item').forEach((i: any) => {
                    i.style.backgroundColor = '';
                });
                item.style.backgroundColor = autoCompleteSelectFieldColor;
                currentSuggestionIndex = parseInt(item.dataset.index);
            });
        });
    };

    const keydownHandler = (e: any) => {
        const suggestionItems: any = suggestions.querySelectorAll('.suggestion-item');

        if (suggestions.style.display === 'none' || suggestionItems.length === 0) {
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                e.stopPropagation();
                currentSuggestionIndex = Math.min(currentSuggestionIndex + 1, suggestionItems.length - 1);
                updateSuggestionHighlight(suggestionItems, currentSuggestionIndex);
                break;

            case 'ArrowUp':
                e.preventDefault();
                e.stopPropagation();
                currentSuggestionIndex = Math.max(currentSuggestionIndex - 1, 0);
                updateSuggestionHighlight(suggestionItems, currentSuggestionIndex);
                break;

            case 'Enter':
                e.preventDefault();
                e.stopPropagation();
                if (currentSuggestionIndex >= 0 && suggestionItems[currentSuggestionIndex]) {
                    const selectedPage = suggestionItems[currentSuggestionIndex].dataset.page;
                    insertSelectedPage(input, selectedPage, multipleKeywords);
                    suggestions.style.display = 'none';
                    setTimeout(() => {
                        input.focus();
                        input.setSelectionRange(input.value.length, input.value.length);
                    }, 10);
                }
                break;

            case 'Escape':
                e.preventDefault();
                e.stopPropagation();
                suggestions.style.display = 'none';
                currentSuggestionIndex = -1;
                input.focus();
                break;
        }
    };

    (input as any)._autoCompleteInputHandler = inputHandler;
    (input as any)._autoCompleteKeydownHandler = keydownHandler;

    input.addEventListener('input', inputHandler);
    input.addEventListener('keydown', keydownHandler);

    input.addEventListener('focus', (e:any) => {
        e.stopPropagation();
    });

    input.addEventListener('blur', () => {
        setTimeout(() => {
            if (!suggestions.contains(document.activeElement)) {
                suggestions.style.display = 'none';
            }
        }, 150);
    });
}

function insertSelectedPage(input: any, selectedPage: any, multipleKeywords: any) {
    if (multipleKeywords) {
        const value = input.value;
        const lastCommaIndex = value.lastIndexOf(',');

        if (lastCommaIndex !== -1) {
            input.value = value.substring(0, lastCommaIndex + 1) + ' ' + selectedPage;
        } else {
            input.value = selectedPage;
        }
    } else {
        input.value = selectedPage;
    }

    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
}

function updateSuggestionHighlight(suggestionItems: any, currentIndex: any) {
    suggestionItems.forEach((item: any, index: number) => {
        item.style.backgroundColor = index === currentIndex ? autoCompleteSelectFieldColor : '';
    });
}
