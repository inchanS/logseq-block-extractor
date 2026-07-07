import {PageEntity} from "../types/LogseqAPITypeDefinitions";
import {BlockEntity} from "@logseq/libs/dist/LSPlugin";

// 다이얼로그를 열 때마다 전체 그래프를 재조회하지 않도록 짧은 TTL 캐시 사용
const CACHE_TTL_MS = 60_000;
let pagesCache: { data: string[]; fetchedAt: number } | null = null;
let propertiesCache: { data: string[]; fetchedAt: number } | null = null;

export async function getAllPages(): Promise<string[]> {
    if (pagesCache && Date.now() - pagesCache.fetchedAt < CACHE_TTL_MS) {
        return pagesCache.data;
    }
    try {
        const pages = await logseq.DB.datascriptQuery(`
            [:find (pull ?p [:block/name])
             :where [?p :block/name]]
        `);

        if (!pages || !Array.isArray(pages)) {
            console.warn('No pages found or invalid response format');
            return [];
        }

        const pageNames = pages
            .map(page => page[0]?.name)
            .filter(name => name && typeof name === 'string' && name.trim());

        pagesCache = { data: pageNames, fetchedAt: Date.now() };
        return pageNames;
    } catch (error) {
        console.error('Error fetching pages:', error);
        logseq.UI.showMsg('An error occurred while fetching the page list.', 'warning');
        return [];
    }
}

export async function getAllProperties(): Promise<string[]> {
    if (propertiesCache && Date.now() - propertiesCache.fetchedAt < CACHE_TTL_MS) {
        return propertiesCache.data;
    }
    try {
        console.log('Fetching properties from current graph...');

        let allPropertyKeys: Set<string> = new Set();

        // 블록 프로퍼티 쿼리
        try {
            const blockProperties = await logseq.DB.datascriptQuery(`
                [:find ?props
                 :where
                 [?b :block/properties ?props]
                 [(> (count ?props) 0)]]
            `);

            if (blockProperties && Array.isArray(blockProperties)) {
                blockProperties.forEach(propResult => {
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
            console.warn('Block properties query failed:', error);
        }

        // 페이지 프로퍼티 쿼리
        try {
            const pageProperties = await logseq.DB.datascriptQuery(`
                [:find ?props
                 :where
                 [?p :block/name]
                 [?p :block/properties ?props]
                 [(> (count ?props) 0)]]
            `);

            if (pageProperties && Array.isArray(pageProperties)) {
                pageProperties.forEach(propResult => {
                    if (propResult && propResult[0]) {
                        const props = propResult[0];
                        if (typeof props === 'object' && props !== null) {
                            Object.keys(props).forEach((key: string) => {
                                let cleanKey: string = key;
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

        // 현재 페이지 프로퍼티 확인
        try {
            const currentPage: PageEntity | BlockEntity | null = await logseq.Editor.getCurrentPage();
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
        const actualProperties: string[] = Array.from(allPropertyKeys)
            .filter((key: any) => {
                return !key.startsWith('block/') &&
                    !key.startsWith('page/') &&
                    !key.startsWith('db/') &&
                    !key.startsWith('file/') &&
                    key.length > 0 &&
                    key !== 'uuid' &&
                    key !== 'id';
            })
            .sort();

        // 기본 프로퍼티들 추가
        const commonProperties: string[] = ['date', 'created-at', 'updated-at', 'tags', 'alias'];
        commonProperties.forEach((prop: string) => {
            if (!actualProperties.includes(prop)) {
                actualProperties.push(prop);
            }
        });

        const finalProperties: string[] = ['filename', ...actualProperties.sort()];

        if (finalProperties.length <= 1) {
            return ['filename', 'date', 'created-at', 'updated-at', 'tags'];
        }

        propertiesCache = { data: finalProperties, fetchedAt: Date.now() };
        return finalProperties;

    } catch (error) {
        console.error('Critical error in getAllProperties:', error);
        logseq.UI.showMsg('An error occurred while fetching the property list.', 'error');
        return ['filename', 'date', 'created-at', 'updated-at', 'tags'];
    }
}

export async function getBlocksReferencingTag(primaryTag: string): Promise<BlockEntity[][] | null> {
    // Logseq은 :block/name을 소문자로 정규화해 저장하므로 소문자로 변환해 조회
    // 쿼리 문자열이 깨지지 않도록 백슬래시와 큰따옴표는 이스케이프
    const escapedTag = primaryTag
        .toLowerCase()
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"');

    return await logseq.DB.datascriptQuery(`
      [:find (pull ?b [:block/uuid :block/content :block/created-at
                       {:block/page [:block/name :block/created-at :block/journal-day
                                     :block/journal? :block/properties]}])
       :where
       [?b :block/refs ?p1]
       [?p1 :block/name "${escapedTag}"]]
    `);
}
