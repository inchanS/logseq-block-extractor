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

            console.log('primaryTagInput:', primaryTagInput);
            console.log('filterKeywordsInput:', filterKeywordsInput);

            const primaryTag = primaryTagInput?.value?.trim();
            const filterKeywords = filterKeywordsInput?.value?.trim();

            console.log('primaryTag:', primaryTag);
            console.log('filterKeywords:', filterKeywords);

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

            // 추출 실행
            await extractFilteredBlocks(primaryTag, keywords);
        },

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
                
                <div style="margin-bottom: 15px;">
                  <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">Primary Tag:</label>
                  <input type="text" id="primaryTag" placeholder="e.g., TagName" 
                         style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; 
                                font-size: 14px; color: #333333;">
                </div>
                
                <div style="margin-bottom: 20px;">
                  <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">Filter Keywords (comma separated, optional):</label>
                  <input type="text" id="filterKeywords" placeholder="e.g., keyword1, keyword2 (leave empty for all blocks)" 
                         style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; 
                                font-size: 14px; color: #333333;">
                  <small style="color: #666; font-size: 12px;">If the filter keyword is “A, B, C”, it will find all reference blocks that contain A or B or C.</small>
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

            // DOM이 로드된 후 CSS 동적 주입
            setTimeout(() => {
                try {
                    // CSS 스타일 동적으로 추가
                    const style = document.createElement('style');
                    style.textContent = `
                    #primaryTag::placeholder,
                    #filterKeywords::placeholder {
                        color: #cccccc !important;
                        opacity: 0.6 !important;
                    }
                    
                    #primaryTag::-webkit-input-placeholder,
                    #filterKeywords::-webkit-input-placeholder {
                        color: #cccccc !important;
                        opacity: 0.6 !important;
                    }
                    
                    #primaryTag::-moz-placeholder,
                    #filterKeywords::-moz-placeholder {
                        color: #cccccc !important;
                        opacity: 0.6 !important;
                    }
                    
                    #primaryTag:-ms-input-placeholder,
                    #filterKeywords:-ms-input-placeholder {
                        color: #cccccc !important;
                        opacity: 0.6 !important;
                    }
                `;

                    // parent 문서에 스타일 추가
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

    // 메인 추출 함수 (수정됨)
    async function extractFilteredBlocks(primaryTag, filterKeywords) {
        try {
            const hasFilter = filterKeywords && filterKeywords.length > 0;
            const filterText = hasFilter ? `with filter: ${filterKeywords.join(', ')}` : 'without filter (all blocks)';

            logseq.UI.showMsg(`Extracting blocks for tag: ${primaryTag} ${filterText}`, 'info');

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
                            filteredResults.push({
                                block: processedBlock,
                                page: {
                                    name: block.page?.name || 'Unnamed Page'
                                },
                                epochCreatedAt: block.page?.['created-at'] || Date.now()
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

            // 날짜순 정렬 (최신순)
            filteredResults.sort((a, b) => b.epochCreatedAt - a.epochCreatedAt);

            if (filteredResults.length === 0) {
                logseq.UI.showMsg("No blocks found matching the criteria.", 'warning');
                return;
            }

            // 마크다운 생성
            let markdown = `# ${primaryTag} 참조 블록 추출\n\n`;
            markdown += `검색 조건:\n`;
            markdown += `1. "${primaryTag}" 태그를 참조하는 블록\n`;

            if (hasFilter) {
                markdown += `2. 계층 구조를 유지하되 "${filterKeywords.join(', ')}" 관련 블록과 그 하위 블록 모두 표시\n\n`;
            } else {
                markdown += `2. 모든 블록과 그 하위 블록 표시 (필터 없음)\n\n`;
            }

            markdown += `총 ${filteredResults.length}개 블록 발견\n\n`;

            filteredResults.forEach((item, index) => {
                markdown += `### ${index + 1}. ${item.page.name}\n\n`;
                markdown += renderBlockWithChildren(item.block);
                markdown += "\n---\n\n";
            });

            // 파일 다운로드
            const filterSuffix = hasFilter ? `_filtered_${filterKeywords.join('_').replace(/[^a-zA-Z0-9가-힣_]/g, '_')}` : '_all_blocks';
            const filename = `${primaryTag}${filterSuffix}.md`;
            downloadMarkdown(markdown, filename);

            logseq.UI.showMsg(`Successfully extracted ${filteredResults.length} blocks!`, 'success');

        } catch (error) {
            console.error('Error extracting blocks:', error);
            logseq.UI.showMsg(`Error: ${error.message}`, 'error');
        }
    }

    // 나머지 함수들은 동일
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
