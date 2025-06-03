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

    // 자동완성 설정 함수
    async function setupAutoComplete() {
        const allPages = await getAllPages();

        // Primary Tag 필드 자동완성
        setupFieldAutoComplete('primaryTag', 'primaryTagSuggestions', allPages);

        // Filter Keywords 필드 자동완성 (쉼표로 구분된 여러 키워드 지원)
        setupFieldAutoComplete('filterKeywords', 'filterKeywordsSuggestions', allPages, true);
    }

    // 개별 필드 자동완성 설정
// 개별 필드 자동완성 설정
    function setupFieldAutoComplete(inputId, suggestionsId, pages, multipleKeywords = false) {
        const input = parent.document.getElementById(inputId) || document.getElementById(inputId);
        const suggestions = parent.document.getElementById(suggestionsId) || document.getElementById(suggestionsId);

        if (!input || !suggestions) {
            console.warn(`Could not find elements: ${inputId}, ${suggestionsId}`);
            return;
        }

        // 기존 이벤트 리스너 제거 (중복 방지)
        input.removeEventListener('input', input._autoCompleteInputHandler);
        input.removeEventListener('keydown', input._autoCompleteKeydownHandler);

        let currentSuggestionIndex = -1;

        // 이벤트 핸들러를 변수에 저장하여 나중에 제거할 수 있도록 함
        const inputHandler = (e) => {
            // 기존 input 이벤트 로직
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
                item.addEventListener('click', () => {
                    const selectedPage = item.dataset.page;
                    insertSelectedPage(input, selectedPage, multipleKeywords);
                    suggestions.style.display = 'none';
                });

                item.addEventListener('mouseenter', () => {
                    suggestions.querySelectorAll('.suggestion-item').forEach(i => {
                        i.style.backgroundColor = '';
                    });
                    item.style.backgroundColor = '#f0f0f0';
                    currentSuggestionIndex = parseInt(item.dataset.index);
                });
            });
        };

        const keydownHandler = (e) => {
            // 기존 keydown 이벤트 로직
            const suggestionItems = suggestions.querySelectorAll('.suggestion-item');

            if (suggestions.style.display === 'none' || suggestionItems.length === 0) {
                return;
            }

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    currentSuggestionIndex = Math.min(currentSuggestionIndex + 1, suggestionItems.length - 1);
                    updateSuggestionHighlight(suggestionItems, currentSuggestionIndex);
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    currentSuggestionIndex = Math.max(currentSuggestionIndex - 1, 0);
                    updateSuggestionHighlight(suggestionItems, currentSuggestionIndex);
                    break;

                case 'Enter':
                    e.preventDefault();
                    if (currentSuggestionIndex >= 0 && suggestionItems[currentSuggestionIndex]) {
                        const selectedPage = suggestionItems[currentSuggestionIndex].dataset.page;
                        insertSelectedPage(input, selectedPage, multipleKeywords);
                        suggestions.style.display = 'none';
                    }
                    break;

                case 'Escape':
                    suggestions.style.display = 'none';
                    currentSuggestionIndex = -1;
                    break;
            }
        };

        // 핸들러를 input 요소에 저장하여 나중에 제거할 수 있도록 함
        input._autoCompleteInputHandler = inputHandler;
        input._autoCompleteKeydownHandler = keydownHandler;

        // 이벤트 리스너 등록
        input.addEventListener('input', inputHandler);
        input.addEventListener('keydown', keydownHandler);
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
            item.style.backgroundColor = index === currentIndex ? '#f0f0f0' : '';
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
              <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
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
                
                <div style="margin-bottom: 15px;">
                  <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">Sort Field (optional):</label>
                  <input type="text" id="sortField" placeholder="e.g., date, created-at (leave empty for filename)" 
                         style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; 
                                font-size: 14px; color: #333333;">
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
                    // 자동완성기능 초기화
                    setupAutoComplete();

                    const style = document.createElement('style');
                    style.textContent = `
                    #primaryTag::placeholder,
                    #filterKeywords::placeholder,
                    #sortField::placeholder {
                        color: #cccccc !important;
                        opacity: 0.6 !important;
                    }
                    
                    #primaryTag::-webkit-input-placeholder,
                    #filterKeywords::-webkit-input-placeholder,
                    #sortField::-webkit-input-placeholder {
                        color: #cccccc !important;
                        opacity: 0.6 !important;
                    }
                    
                    #primaryTag::-moz-placeholder,
                    #filterKeywords::-moz-placeholder,
                    #sortField::-moz-placeholder {
                        color: #cccccc !important;
                        opacity: 0.6 !important;
                    }
                    
                    #primaryTag:-ms-input-placeholder,
                    #filterKeywords:-ms-input-placeholder,
                    #sortField:-ms-input-placeholder {
                        color: #cccccc !important;
                        opacity: 0.6 !important;
                    }
                    
                    input[type="radio"]:checked {
                        accent-color: #4CAF50;
                    }
                `;

                    if (parent.document.head) {
                        parent.document.head.appendChild(style);
                    } else if (document.head) {
                        document.head.appendChild(style);
                    }

                    console.log('CSS style injected');
                } catch (error) {
                    console.error('Error injecting CSS:', error);
                }
            }, 100);

        } catch (error) {
            console.error('Error in showInputDialog:', error);
            logseq.UI.showMsg(`Error: ${error.message}`, 'error');
        }
    }

    // 메인 추출 함수
    async function extractFilteredBlocks(primaryTag, filterKeywords, sortOrder = 'asc', sortField = 'filename') {
        try {
            const hasFilter = filterKeywords && filterKeywords.length > 0;
            const filterText = hasFilter ? `with filter: ${filterKeywords.join(', ')}` : 'without filter (all blocks)';
            const sortText = sortOrder === 'asc' ? 'ascending' : 'descending';
            const fieldText = sortField === 'filename' ? 'filename' : `property: ${sortField}`;

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
                            // 정렬 기준 값 결정
                            let sortValue;
                            if (sortField === 'filename') {
                                sortValue = block.page?.name || 'Unnamed Page';
                            } else {
                                // 다른 필드인 경우 properties에서 찾거나 페이지 속성에서 찾기
                                sortValue = block.page?.properties?.[sortField] ||
                                    block.page?.[sortField] ||
                                    block.page?.['created-at'] ||
                                    Date.now();
                            }

                            filteredResults.push({
                                block: processedBlock,
                                page: {
                                    name: block.page?.name || 'Unnamed Page'
                                },
                                sortValue: sortValue,
                                sortField: sortField
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
            if (sortField === 'filename') {
                // 파일명 정렬 (문자열)
                if (sortOrder === 'desc') {
                    filteredResults.sort((a, b) => b.sortValue.localeCompare(a.sortValue, 'ko', {numeric: true}));
                } else {
                    filteredResults.sort((a, b) => a.sortValue.localeCompare(b.sortValue, 'ko', {numeric: true}));
                }
            } else {
                // 기타 필드 정렬 (숫자 또는 문자열)
                if (sortOrder === 'desc') {
                    filteredResults.sort((a, b) => {
                        if (typeof a.sortValue === 'number' && typeof b.sortValue === 'number') {
                            return b.sortValue - a.sortValue;
                        } else {
                            return String(b.sortValue).localeCompare(String(a.sortValue), 'ko', {numeric: true});
                        }
                    });
                } else {
                    filteredResults.sort((a, b) => {
                        if (typeof a.sortValue === 'number' && typeof b.sortValue === 'number') {
                            return a.sortValue - b.sortValue;
                        } else {
                            return String(a.sortValue).localeCompare(String(b.sortValue), 'ko', {numeric: true});
                        }
                    });
                }
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
            const sortSuffix = sortField !== 'filename' ? `_sortBy_${sortField}` : '';
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
