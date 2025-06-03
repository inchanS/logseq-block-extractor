const main = () => {
    console.log('Block Extractor Plugin loaded');

    // 커맨드 팔레트에 등록 (단축키는 사용자가 설정)
    logseq.App.registerCommandPalette({
        key: "extract-filtered-blocks",
        label: "Extract Filtered Blocks",
        desc: "Extract blocks with hierarchical filtering",
    }, async () => {
        await showInputDialog();
    });

    // 슬래시 커맨드로 등록
    logseq.Editor.registerSlashCommand('Extract Filtered Blocks', async () => {
        await showInputDialog();
    });

    // 블록 컨텍스트 메뉴에 추가
    logseq.Editor.registerBlockContextMenuItem('Extract Filtered Blocks', async (e) => {
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

    // 모든 페이지 목록을 가져오는 함수
    async function getAllPages() {
        try {
            const pages = await logseq.DB.datascriptQuery(`
            [:find (pull ?p [:block/name])
             :where [?p :block/name]]
        `);

            if (!pages || !Array.isArray(pages)) {
                console.warn('No pages found or invalid response format');
                return [];
            }

            return pages
                .map(page => page[0]?.name)
                .filter(name => name && typeof name === 'string' && name.trim());
        } catch (error) {
            console.error('Error fetching pages:', error);
            logseq.UI.showMsg('페이지 목록을 가져오는 중 오류가 발생했습니다.', 'warning');
            return [];
        }
    }

    // 모든 프로퍼티 목록을 가져오는 함수
    async function getAllProperties() {
        try {
            console.log('Fetching properties from current graph...');

            let allPropertyKeys = new Set();

            // 방법 1: 단순한 블록 프로퍼티 쿼리
            try {
                const blockProperties = await logseq.DB.datascriptQuery(`
                [:find ?props
                 :where
                 [?b :block/properties ?props]
                 [(> (count ?props) 0)]]
            `);

                console.log('Block properties query result:', blockProperties);

                if (blockProperties && Array.isArray(blockProperties)) {
                    blockProperties.forEach(propResult => {
                        if (propResult && propResult[0]) {
                            const props = propResult[0];
                            console.log('Processing props object:', props);

                            // props가 객체인 경우 키들을 추출
                            if (typeof props === 'object' && props !== null) {
                                Object.keys(props).forEach(key => {
                                    // 콜론으로 시작하는 키워드 형태 처리
                                    let cleanKey = key;
                                    if (typeof key === 'string') {
                                        cleanKey = key.replace(/^:+/, '');
                                    }

                                    if (cleanKey && cleanKey.length > 0) {
                                        allPropertyKeys.add(cleanKey);
                                    }
                                });
                            }
                        }
                    });
                }
            } catch (error) {
                console.warn('Block properties query failed:', error);
            }

            // 방법 2: 페이지 프로퍼티 쿼리
            try {
                const pageProperties = await logseq.DB.datascriptQuery(`
                [:find ?props
                 :where
                 [?p :block/name]
                 [?p :block/properties ?props]
                 [(> (count ?props) 0)]]
            `);

                console.log('Page properties query result:', pageProperties);

                if (pageProperties && Array.isArray(pageProperties)) {
                    pageProperties.forEach(propResult => {
                        if (propResult && propResult[0]) {
                            const props = propResult[0];

                            if (typeof props === 'object' && props !== null) {
                                Object.keys(props).forEach(key => {
                                    let cleanKey = key;
                                    if (typeof key === 'string') {
                                        cleanKey = key.replace(/^:+/, '');
                                    }

                                    if (cleanKey && cleanKey.length > 0) {
                                        allPropertyKeys.add(cleanKey);
                                    }
                                });
                            }
                        }
                    });
                }
            } catch (error) {
                console.warn('Page properties query failed:', error);
            }

            // 방법 3: 대안 - 현재 페이지의 프로퍼티 직접 확인
            try {
                const currentPage = await logseq.Editor.getCurrentPage();
                if (currentPage && currentPage.properties) {
                    Object.keys(currentPage.properties).forEach(key => {
                        let cleanKey = key.replace(/^:+/, '');
                        if (cleanKey && cleanKey.length > 0) {
                            allPropertyKeys.add(cleanKey);
                        }
                    });
                }
            } catch (error) {
                console.warn('Current page properties check failed:', error);
            }

            // 시스템 프로퍼티 제외 및 정리
            const actualProperties = Array.from(allPropertyKeys)
                .filter(key => {
                    return !key.startsWith('block/') &&
                        !key.startsWith('page/') &&
                        !key.startsWith('db/') &&
                        !key.startsWith('file/') &&
                        key.length > 0 &&
                        key !== 'uuid' &&
                        key !== 'id';
                })
                .sort();

            console.log(`Found ${actualProperties.length} properties:`, actualProperties);

            // 기본 프로퍼티들 추가 (일반적으로 사용되는 것들)
            const commonProperties = ['date', 'created-at', 'updated-at', 'tags', 'alias'];
            commonProperties.forEach(prop => {
                if (!actualProperties.includes(prop)) {
                    actualProperties.push(prop);
                }
            });

            // filename을 첫 번째에 추가
            const finalProperties = ['filename', ...actualProperties.sort()];

            if (finalProperties.length <= 1) {
                console.warn('Very few properties found. Adding common defaults.');
                return ['filename', 'date', 'created-at', 'updated-at', 'tags'];
            }

            return finalProperties;

        } catch (error) {
            console.error('Critical error in getAllProperties:', error);
            logseq.UI.showMsg('프로퍼티 목록을 가져오는 중 오류가 발생했습니다.', 'error');
            return ['filename', 'date', 'created-at', 'updated-at', 'tags'];
        }
    }

    // 자동완성 설정 함수
    async function setupAutoComplete() {
        // 디버깅용 함수 - 실제 프로퍼티 구조 확인
        async function debugProperties() {
            try {
                // 단순한 쿼리로 실제 데이터 확인
                const result = await logseq.DB.datascriptQuery(`
            [:find ?b ?props
             :where
             [?b :block/properties ?props]
             :limit 5]
        `);

                console.log('Debug - Raw property data:', result);

                if (result && result.length > 0) {
                    result.forEach((item, index) => {
                        console.log(`Item ${index}:`, item);
                        if (item[1]) {
                            console.log(`Properties structure:`, typeof item[1], item[1]);
                            if (typeof item[1] === 'object') {
                                console.log(`Property keys:`, Object.keys(item[1]));
                            }
                        }
                    });
                }
            } catch (error) {
                console.error('Debug query failed:', error);
            }
        }

        const allPages = await getAllPages();
        const allProperties = await getAllProperties();

        // Primary Tag 필드 자동완성
        setupFieldAutoComplete('primaryTag', 'primaryTagSuggestions', allPages);

        // Filter Keywords 필드 자동완성 (쉼표로 구분된 여러 키워드 지원)
        setupFieldAutoComplete('filterKeywords', 'filterKeywordsSuggestions', allPages, true);

        // Sort Field 자동완성 추가
        setupFieldAutoComplete('sortField', 'sortFieldSuggestions', allProperties);
    }

    // 자동완성 필드 색상
    const autoCompleteSelectFieldColor = '#3c7059';

    // 개별 필드 자동완성 설정
    function setupFieldAutoComplete(inputId, suggestionsId, pages, multipleKeywords = false) {
        const input = parent.document.getElementById(inputId) || document.getElementById(inputId);
        const suggestions = parent.document.getElementById(suggestionsId) || document.getElementById(suggestionsId);

        if (!input || !suggestions) {
            console.warn(`Could not find elements: ${inputId}, ${suggestionsId}`);
            return;
        }

        // 기존 이벤트 리스너 제거 (중복 방지)
        const handlerMap = {
            'input': '_autoCompleteInputHandler',
            'keydown': '_autoCompleteKeydownHandler'
        };

        Object.entries(handlerMap).forEach(([eventType, handlerProp]) => {
            if (input[handlerProp]) {
                input.removeEventListener(eventType, input[handlerProp]);
            }
        });

        let currentSuggestionIndex = -1;

        const inputHandler = (e) => {
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

            const filteredPages = pages.filter(page =>
                page.toLowerCase().includes(searchTerm.toLowerCase())
            ).slice(0, 10);

            if (filteredPages.length === 0) {
                suggestions.style.display = 'none';
                return;
            }

            suggestions.innerHTML = filteredPages.map((page, index) => `
            <div class="suggestion-item" data-index="${index}" data-page="${page}"
                 style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;
                        ${index === currentSuggestionIndex ? 'background-color: #f0f0f0;' : ''}">
                ${page}
            </div>
        `).join('');

            suggestions.style.display = 'block';
            currentSuggestionIndex = -1;

            // 클릭 이벤트 추가
            suggestions.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const selectedPage = item.dataset.page;
                    insertSelectedPage(input, selectedPage, multipleKeywords);
                    suggestions.style.display = 'none';
                    // 입력 필드로 포커스 복귀
                    setTimeout(() => {
                        input.focus();
                    }, 10);
                });

                item.addEventListener('mouseenter', () => {
                    suggestions.querySelectorAll('.suggestion-item').forEach(i => {
                        i.style.backgroundColor = '';
                    });
                    item.style.backgroundColor = autoCompleteSelectFieldColor;
                    currentSuggestionIndex = parseInt(item.dataset.index);
                });
            });
        };

        const keydownHandler = (e) => {
            const suggestionItems = suggestions.querySelectorAll('.suggestion-item');

            // 자동완성 목록이 표시되지 않았거나 항목이 없으면 일반 동작 허용
            if (suggestions.style.display === 'none' || suggestionItems.length === 0) {
                return; // 이벤트를 차단하지 않고 그대로 진행
            }

            // 자동완성이 활성화된 상태에서만 특별한 키 처리
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
                        // 입력 필드로 포커스 유지
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
                    // 입력 필드로 포커스 복귀
                    input.focus();
                    break;

                default:
                    // 다른 키들은 기본 동작 허용
                    break;
            }
        };

        // 핸들러를 input 요소에 저장
        input._autoCompleteInputHandler = inputHandler;
        input._autoCompleteKeydownHandler = keydownHandler;

        // 이벤트 리스너 등록
        input.addEventListener('input', inputHandler);
        input.addEventListener('keydown', keydownHandler);

        // 입력 필드 포커스 이벤트 추가
        input.addEventListener('focus', (e) => {
            e.stopPropagation();
        });

        input.addEventListener('blur', (e) => {
            // 자동완성 목록 클릭 시 blur 방지
            setTimeout(() => {
                if (!suggestions.contains(document.activeElement)) {
                    suggestions.style.display = 'none';
                }
            }, 150);
        });
    }

    // 다이얼로그 내 포커스 관리 함수
    function maintainDialogFocus() {
        const dialog = parent.document.getElementById('block-extractor-dialog') ||
            document.getElementById('block-extractor-dialog');

        if (!dialog) return;

        // 다이얼로그 내의 모든 포커스 가능한 요소들
        const focusableElements = dialog.querySelectorAll(
            'input, button, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        // Tab 키 순환 처리 (자동완성이 활성화되지 않은 경우에만)
        dialog.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                // 자동완성 목록이 표시되어 있는지 확인
                const primarySuggestions = dialog.querySelector('#primaryTagSuggestions');
                const filterSuggestions = dialog.querySelector('#filterKeywordsSuggestions');
                const sortFieldSuggestions = dialog.querySelector('#sortFieldSuggestions'); // 추가

                const isPrimarySuggestionsVisible = primarySuggestions &&
                    primarySuggestions.style.display !== 'none' &&
                    primarySuggestions.querySelectorAll('.suggestion-item').length > 0;

                const isFilterSuggestionsVisible = filterSuggestions &&
                    filterSuggestions.style.display !== 'none' &&
                    filterSuggestions.querySelectorAll('.suggestion-item').length > 0;

                const isSortFieldSuggestionsVisible = sortFieldSuggestions &&
                    sortFieldSuggestions.style.display !== 'none' &&
                    sortFieldSuggestions.querySelectorAll('.suggestion-item').length > 0; // 추가

                // 자동완성이 활성화된 상태에서는 Tab 순환을 하지 않음
                if (isPrimarySuggestionsVisible || isFilterSuggestionsVisible || isSortFieldSuggestionsVisible) {
                    return;
                }

                e.preventDefault();
                e.stopPropagation();

                const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
                let nextIndex;

                if (e.shiftKey) {
                    // Shift + Tab: 이전 요소로
                    nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
                } else {
                    // Tab: 다음 요소로
                    nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
                }

                focusableElements[nextIndex].focus();
            }
        });
    }

    // 선택된 페이지 삽입
    function insertSelectedPage(input, selectedPage, multipleKeywords) {
        if (multipleKeywords) {
            const value = input.value;
            const lastCommaIndex = value.lastIndexOf(',');

            if (lastCommaIndex !== -1) {
                // 마지막 쉼표 이후의 텍스트를 선택된 페이지로 교체
                input.value = value.substring(0, lastCommaIndex + 1) + ' ' + selectedPage;
            } else {
                input.value = selectedPage;
            }
        } else {
            input.value = selectedPage;
        }

        input.focus();
        // 커서를 끝으로 이동
        input.setSelectionRange(input.value.length, input.value.length);
    }

    // 제안 하이라이트 업데이트
    function updateSuggestionHighlight(suggestionItems, currentIndex) {
        suggestionItems.forEach((item, index) => {
            item.style.backgroundColor = index === currentIndex ? autoCompleteSelectFieldColor : '';
        });
    }


    // 전역 모델 제공
    logseq.provideModel({
        showExtractDialog: async () => {
            await showInputDialog();
        },

        executeExtraction: async () => {
            console.log('executeExtraction called');

            // DOM 요소 직접 접근 시도
            const primaryTagInput = parent.document.querySelector('#primaryTag');
            const filterKeywordsInput = parent.document.querySelector('#filterKeywords');
            const sortFieldInput = parent.document.querySelector('#sortField');
            const sortOrderRadio = parent.document.querySelector('input[name="sortOrder"]:checked');

            console.log('primaryTagInput:', primaryTagInput);
            console.log('filterKeywordsInput:', filterKeywordsInput);
            console.log('sortFieldInput:', sortFieldInput);
            console.log('sortOrderRadio:', sortOrderRadio);

            const primaryTag = primaryTagInput?.value?.trim();
            const filterKeywords = filterKeywordsInput?.value?.trim();
            const sortField = sortFieldInput?.value?.trim() || 'filename'; // 기본값: filename
            const sortOrder = sortOrderRadio?.value || 'asc'; // 기본값: 오름차순

            console.log('primaryTag:', primaryTag);
            console.log('filterKeywords:', filterKeywords);
            console.log('sortField:', sortField);
            console.log('sortOrder:', sortOrder);

            if (!primaryTag) {
                logseq.UI.showMsg("Primary tag is required", 'warning');
                return;
            }

            // 필터 키워드가 없으면 빈 배열로 처리 (모든 블록 포함)
            let keywords = [];
            if (filterKeywords && filterKeywords.length > 0) {
                keywords = filterKeywords.split(',')
                    .map(k => k.trim())
                    .filter(k => k.length > 0);
            }

            // UI 닫기
            logseq.provideUI({key: 'block-extractor-input', template: ''});

            // 추출 실행 (정렬 필드와 순서 파라미터 추가)
            await extractFilteredBlocks(primaryTag, keywords, sortOrder, sortField);
        }
        ,

        cancelDialog: () => {
            console.log('cancelDialog called');
            logseq.provideUI({key: 'block-extractor-input', template: ''});
        }
    });

    // 커스텀 UI를 사용한 입력 다이얼로그
    async function showInputDialog() {
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
                  <small style="color: #666; font-size: 12px;">If the filter keyword is "A, B, C", it will find all reference blocks that contain A or B or C.</small>
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
                    // 자동완성 기능 초기화
                    setupAutoComplete();
                    maintainDialogFocus();

                    // 다이얼로그 컨테이너에 선택적 키보드 이벤트 차단 추가
                    const dialog = parent.document.getElementById('block-extractor-dialog') ||
                        document.getElementById('block-extractor-dialog');

                    if (dialog) {
                        // 선택적 키보드 이벤트 차단 - 자동완성이 활성화되지 않은 경우에만
                        dialog.addEventListener('keydown', (e) => {
                            // 자동완성 목록이 표시되어 있는지 확인
                            const primarySuggestions = dialog.querySelector('#primaryTagSuggestions');
                            const filterSuggestions = dialog.querySelector('#filterKeywordsSuggestions');
                            const sortFieldSuggestions = dialog.querySelector('#sortFieldSuggestions'); // 추가

                            const isPrimarySuggestionsVisible = primarySuggestions &&
                                primarySuggestions.style.display !== 'none' &&
                                primarySuggestions.querySelectorAll('.suggestion-item').length > 0;

                            const isFilterSuggestionsVisible = filterSuggestions &&
                                filterSuggestions.style.display !== 'none' &&
                                filterSuggestions.querySelectorAll('.suggestion-item').length > 0;

                            const isSortFieldSuggestionsVisible = sortFieldSuggestions &&
                                sortFieldSuggestions.style.display !== 'none' &&
                                sortFieldSuggestions.querySelectorAll('.suggestion-item').length > 0; // 추가

                            // 자동완성이 활성화된 상태에서는 방향키 이벤트를 차단하지 않음
                            if ((isPrimarySuggestionsVisible || isFilterSuggestionsVisible || isSortFieldSuggestionsVisible) &&
                                (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter' || e.key === 'Escape')) {
                                // 자동완성 관련 키는 전파를 허용
                                return;
                            }

                            // 다른 키들은 외부로 전파 차단
                            e.stopPropagation();
                        }, true);

                        dialog.addEventListener('keyup', (e) => {
                            // keyup은 항상 차단 (덜 중요)
                            e.stopPropagation();
                        }, true);

                        dialog.addEventListener('keypress', (e) => {
                            // keypress는 항상 차단 (덜 중요)
                            e.stopPropagation();
                        }, true);

                        // 첫 번째 입력 필드에 자동 포커스
                        const firstInput = dialog.querySelector('#primaryTag');
                        if (firstInput) {
                            setTimeout(() => {
                                firstInput.focus();
                            }, 100);
                        }
                    }

                    // CSS 스타일 추가
                    const style = document.createElement('style');
                    style.textContent = `
            #primaryTag::placeholder,
            #filterKeywords::placeholder,
            #sortField::placeholder {
                color: #cccccc !important;
                opacity: 0.6 !important;
            }
            
            /* 자동완성 목록 스타일 개선 */
            .suggestion-item:hover {
                background-color: ${autoCompleteSelectFieldColor} !important;
            }
            
            /* 다이얼로그 내부 포커스 스타일 */
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

                    console.log('CSS style injected and focus management setup');
                } catch (error) {
                    console.error('Error in dialog setup:', error);
                }
            }, 100);

        } catch (error) {
            console.error('Error in showInputDialog:', error);
            logseq.UI.showMsg(`Error: ${error.message}`, 'error');
        }
    }

    // sortField 유효성 검사 및 기본값 설정 함수
    async function validateAndSetDefaultSortField(sortField) {
        // 1. sortField가 비어있거나 null/undefined인 경우 기본값 반환
        if (!sortField || sortField.trim() === '') {
            console.log('Sort field is empty, using default: filename');
            return 'filename';
        }

        const trimmedSortField = sortField.trim();

        // 2. 'filename'인 경우 바로 반환 (항상 유효)
        if (trimmedSortField === 'filename') {
            return 'filename';
        }

        // 3. 일반적인 시스템 속성들은 바로 허용
        const commonSystemFields = [
            'date', 'created-at', 'updated-at', 'tags', 'alias',
            'created_at', 'updated_at', 'journal-day', 'journal_day'
        ];

        if (commonSystemFields.includes(trimmedSortField)) {
            console.log(`Using system field: ${trimmedSortField}`);
            return trimmedSortField;
        }

        // 4. 실제 프로퍼티 목록에서 유효성 검사
        try {
            const allProperties = await getAllProperties();

            // 대소문자 구분 없이 검사
            const normalizedField = trimmedSortField.toLowerCase();
            const validProperty = allProperties.find(prop =>
                prop.toLowerCase() === normalizedField
            );

            if (validProperty) {
                console.log(`Valid property found: ${validProperty}`);
                return validProperty;
            }

            // 5. 콜론 포함 형태도 검사
            const colonField = `:${trimmedSortField}`;
            const validColonProperty = allProperties.find(prop =>
                prop.toLowerCase() === colonField.toLowerCase()
            );

            if (validColonProperty) {
                console.log(`Valid colon property found: ${validColonProperty}`);
                return validColonProperty.replace(/^:+/, ''); // 콜론 제거해서 반환
            }

            // 6. 유효하지 않은 필드인 경우 기본값으로 fallback
            console.warn(`Invalid sort field: ${trimmedSortField}, falling back to filename`);
            logseq.UI.showMsg(`Invalid sort field "${trimmedSortField}", using filename instead`, 'warning');
            return 'filename';

        } catch (error) {
            console.error('Error validating sort field:', error);
            console.log('Error occurred during validation, using default: filename');
            return 'filename';
        }
    }

    // 메인 추출 함수
    async function extractFilteredBlocks(primaryTag, filterKeywords, sortOrder = 'asc', sortField = 'filename') {
        try {
            // sortField 유효성 검사 및 기본값 설정
            const validSortField = await validateAndSetDefaultSortField(sortField);

            const hasFilter = filterKeywords && filterKeywords.length > 0;
            const filterText = hasFilter ? `with filter: ${filterKeywords.join(', ')}` : 'without filter (all blocks)';
            const sortText = sortOrder === 'asc' ? 'ascending' : 'descending';
            const fieldText = validSortField === 'filename' ? 'filename' : `property: ${validSortField}`;

            logseq.UI.showMsg(`Extracting blocks for tag: ${primaryTag} ${filterText} (${sortText} by ${fieldText})`, 'info');

            // Datalog 쿼리 실행
            const results = await logseq.DB.datascriptQuery(`
      [:find (pull ?b [:block/uuid :block/content :block/created-at 
                       {:block/page [:block/name :block/created-at :block/journal-day 
                                     :block/journal? :block/properties]}])
       :where
       [?b :block/refs ?p1]
       [?p1 :block/name "${primaryTag}"]]
    `);

            if (!results || results.length === 0) {
                logseq.UI.showMsg(`No blocks found referencing "${primaryTag}"`, 'warning');
                return;
            }

            console.log(`Found ${results.length} blocks referencing ${primaryTag}`);
            logseq.UI.showMsg(`Processing ${results.length} blocks...`, 'info');

            let filteredResults = [];
            let processedCount = 0;

            for (const result of results) {
                try {
                    const block = Array.isArray(result) ? result[0] : result;

                    if (!block || !block.uuid) {
                        console.warn('Invalid block found:', block);
                        continue;
                    }

                    // 하위 블록을 포함한 완전한 블록 정보 가져오기
                    const fullBlock = await logseq.Editor.getBlock(block.uuid, {
                        includeChildren: true
                    });

                    if (fullBlock) {
                        let processedBlock;

                        if (hasFilter) {
                            // 필터가 있으면 키워드 필터링 적용
                            processedBlock = filterBlocksByKeyword(fullBlock, filterKeywords);
                        } else {
                            // 필터가 없으면 모든 블록 포함
                            processedBlock = fullBlock;
                        }

                        if (processedBlock) {
                            // 정렬 기준 값 결정 부분 수정
                            let sortValue;
                            let secondarySortValue = block.page?.name || 'Unnamed Page'; // 2차 정렬용

                            if (validSortField === 'filename') {
                                sortValue = block.page?.name || 'Unnamed Page';
                            } else {
                                // property 값 찾기
                                const pageProps = block.page?.properties || {};
                                const blockProps = block.properties || {};

                                sortValue = pageProps[validSortField] ||
                                    pageProps[`:${validSortField}`] ||
                                    blockProps[validSortField] ||
                                    blockProps[`:${validSortField}`] ||
                                    block.page?.[validSortField] ||
                                    null; // 'No Value' 대신 null 사용

                                // 날짜 형태의 값 처리
                                if (validSortField.includes('date') || validSortField.includes('created') || validSortField.includes('updated')) {
                                    if (typeof sortValue === 'number') {
                                        sortValue = sortValue;
                                    } else if (typeof sortValue === 'string') {
                                        const dateValue = new Date(sortValue).getTime();
                                        sortValue = isNaN(dateValue) ? null : dateValue;
                                    } else {
                                        sortValue = null;
                                    }
                                }
                            }

                            filteredResults.push({
                                block: processedBlock,
                                page: block.page,
                                sortValue: sortValue,
                                secondarySortValue: secondarySortValue // 2차 정렬값 추가
                            });
                        }
                    }

                    processedCount++;

                    // 진행상황 표시 (10개마다)
                    if (processedCount % 10 === 0) {
                        console.log(`Processed ${processedCount}/${results.length} blocks...`);
                    }
                } catch (blockError) {
                    console.error('Error processing block:', blockError);
                    processedCount++;
                    continue;
                }
            }

            // 정렬 기준에 따라 정렬
            if (validSortField === 'filename') {
                // 파일명 정렬
                if (sortOrder === 'desc') {
                    filteredResults.sort((a, b) => b.sortValue.localeCompare(a.sortValue, 'ko', {numeric: true}));
                } else {
                    filteredResults.sort((a, b) => a.sortValue.localeCompare(b.sortValue, 'ko', {numeric: true}));
                }
            } else {
                // 프로퍼티 정렬 (프로퍼티 없는 경우 filename으로 2차 정렬)
                filteredResults.sort((a, b) => {
                    // 둘 다 프로퍼티 값이 있는 경우
                    if (a.sortValue !== null && b.sortValue !== null) {
                        if (typeof a.sortValue === 'number' && typeof b.sortValue === 'number') {
                            return sortOrder === 'desc' ? b.sortValue - a.sortValue : a.sortValue - b.sortValue;
                        } else {
                            const comparison = String(a.sortValue).localeCompare(String(b.sortValue), 'ko', {numeric: true});
                            return sortOrder === 'desc' ? -comparison : comparison;
                        }
                    }

                    // 한쪽만 프로퍼티 값이 있는 경우 (프로퍼티 있는 것을 우선)
                    if (a.sortValue !== null && b.sortValue === null) {
                        return sortOrder === 'desc' ? -1 : 1;
                    }
                    if (a.sortValue === null && b.sortValue !== null) {
                        return sortOrder === 'desc' ? 1 : -1;
                    }

                    // 둘 다 프로퍼티 값이 없는 경우 filename으로 정렬
                    const comparison = a.secondarySortValue.localeCompare(b.secondarySortValue, 'ko', {numeric: true});
                    return sortOrder === 'desc' ? -comparison : comparison;
                });
            }

            if (filteredResults.length === 0) {
                logseq.UI.showMsg("No blocks found matching the criteria.", 'warning');
                return;
            }

            // 마크다운 생성
            let markdown = `# ${primaryTag} 참조 블록 추출\n\n`;
            markdown += `검색 조건:\n`;
            markdown += `1. "${primaryTag}" 태그를 참조하는 블록\n`;

            if (hasFilter) {
                markdown += `2. 계층 구조를 유지하되 "${filterKeywords.join(', ')}" 관련 블록과 그 하위 블록 모두 표시\n`;
            } else {
                markdown += `2. 모든 블록과 그 하위 블록 표시 (필터 없음)\n`;
            }

            markdown += `3. 정렬 기준: ${fieldText} (${sortText})\n\n`;
            markdown += `총 ${filteredResults.length}개 블록 발견\n\n`;

            filteredResults.forEach((item, index) => {
                markdown += `### ${index + 1}. ${item.page.name}\n\n`;
                markdown += renderBlockWithChildren(item.block);
                markdown += "\n---\n\n";
            });

            // 파일 다운로드
            const filterSuffix = hasFilter ? `_filtered_${filterKeywords.join('_').replace(/[^a-zA-Z0-9가-힣_]/g, '_')}` : '_all_blocks';
            const sortSuffix = validSortField !== 'filename' ? `_sortBy_${validSortField}` : '';
            const filename = `${primaryTag}${filterSuffix}${sortSuffix}.md`;
            downloadMarkdown(markdown, filename);

            logseq.UI.showMsg(`Successfully extracted ${filteredResults.length} blocks!`, 'success');

        } catch (error) {
            console.error('Error extracting blocks:', error);
            logseq.UI.showMsg(`Error: ${error.message}`, 'error');
        }
    }

    function blockContainsKeywords(block, keywords) {
        if (!block || !block.content) return false;

        const content = block.content.toLowerCase();
        return keywords.some(keyword =>
            content.includes(keyword.toLowerCase())
        );
    }

    function filterBlocksByKeyword(block, keywords) {
        if (!block) return null;

        const contentIncludesKeyword = blockContainsKeywords(block, keywords);

        if (contentIncludesKeyword) {
            return {
                ...block,
                children: block.children || []
            };
        } else {
            let filteredChildren = [];
            if (block.children && Array.isArray(block.children)) {
                filteredChildren = block.children
                    .map(child => filterBlocksByKeyword(child, keywords))
                    .filter(child => child !== null);
            }

            if (filteredChildren.length > 0) {
                return {
                    ...block,
                    children: filteredChildren
                };
            } else {
                return null;
            }
        }
    }

    function renderBlockWithChildren(block, indent = 0, maxDepth = 10) {
        if (!block || !block.content || indent > maxDepth) return '';

        let content = '';
        const indentStr = '  '.repeat(indent);

        content += indentStr + '- ' + block.content + '\n';

        if (block.children && Array.isArray(block.children) && block.children.length > 0) {
            block.children.forEach(child => {
                content += renderBlockWithChildren(child, indent + 1, maxDepth);
            });
        }

        return content;
    }

    function downloadMarkdown(content, filename) {
        try {
            const blob = new Blob([content], {type: 'text/markdown;charset=utf-8;'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log(`Downloaded: ${filename}`);
        } catch (error) {
            console.error('Error downloading file:', error);
            logseq.UI.showMsg('Error downloading file', 'error');
        }
    }
};

// 플러그인 로드
logseq.ready(main).catch(console.error);
