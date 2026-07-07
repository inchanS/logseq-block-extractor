import { describe, it, expect } from 'vitest';
import { getSortValue, sortResults } from '../src/core/sort';
import type { ExtendedBlockEntity } from '../src/types/LogseqAPITypeDefinitions';
import type { BlockEntity } from '@logseq/libs/dist/LSPlugin';

const blockOnPage = (pageName: string, pageProps: Record<string, any> = {}): BlockEntity =>
    ({ id: 1, uuid: 'u', content: '', page: { name: pageName, properties: pageProps } } as unknown as BlockEntity);

const entry = (sortValue: string | number | null, secondary = 'page'): ExtendedBlockEntity =>
    ({ block: {} as BlockEntity, sortValue, secondarySortValue: secondary });

describe('getSortValue', () => {
    it('filename 정렬은 페이지 이름 사용', () => {
        const { sortValue, secondarySortValue } = getSortValue(blockOnPage('My Page'), 'filename');
        expect(sortValue).toBe('My Page');
        expect(secondarySortValue).toBe('My Page');
    });

    it('페이지 이름이 없으면 Unnamed Page', () => {
        const b = { id: 1, uuid: 'u', content: '' } as unknown as BlockEntity;
        expect(getSortValue(b, 'filename').sortValue).toBe('Unnamed Page');
    });

    it('프로퍼티 정렬: 페이지 프로퍼티 값 사용', () => {
        const b = blockOnPage('p', { priority: 'high' });
        expect(getSortValue(b, 'priority').sortValue).toBe('high');
    });

    it('배열 프로퍼티는 첫 번째 요소 사용', () => {
        const b = blockOnPage('p', { tags: ['first', 'second'] });
        expect(getSortValue(b, 'tags').sortValue).toBe('first');
    });

    it('date 계열 필드의 문자열 값은 타임스탬프로 변환 (언더스코어 허용)', () => {
        const b = blockOnPage('p', { date: '2025_03_29' });
        expect(getSortValue(b, 'date').sortValue).toBe(new Date('2025-03-29').getTime());
    });

    it('date 계열 필드에 파싱 불가 값이면 null', () => {
        const b = blockOnPage('p', { date: 'not a date' });
        expect(getSortValue(b, 'date').sortValue).toBeNull();
    });

    it('프로퍼티가 없으면 null', () => {
        expect(getSortValue(blockOnPage('p'), 'missing').sortValue).toBeNull();
    });
});

describe('sortResults', () => {
    it('filename 오름차순/내림차순 (numeric 비교)', () => {
        const asc = [entry('page10'), entry('page2'), entry('page1')];
        sortResults(asc, 'asc', 'filename');
        expect(asc.map(e => e.sortValue)).toEqual(['page1', 'page2', 'page10']);

        const desc = [entry('page1'), entry('page10'), entry('page2')];
        sortResults(desc, 'desc', 'filename');
        expect(desc.map(e => e.sortValue)).toEqual(['page10', 'page2', 'page1']);
    });

    it('숫자 프로퍼티 정렬', () => {
        const results = [entry(30), entry(10), entry(20)];
        sortResults(results, 'asc', 'date');
        expect(results.map(e => e.sortValue)).toEqual([10, 20, 30]);

        sortResults(results, 'desc', 'date');
        expect(results.map(e => e.sortValue)).toEqual([30, 20, 10]);
    });

    it('null 값 처리: 오름차순에서는 앞, 내림차순에서는 뒤 (기존 동작)', () => {
        const results = [entry(10, 'a'), entry(null, 'b')];
        sortResults(results, 'asc', 'date');
        expect(results[0].sortValue).toBeNull();

        const results2 = [entry(null, 'b'), entry(10, 'a')];
        sortResults(results2, 'desc', 'date');
        expect(results2[0].sortValue).toBe(10);
    });

    it('둘 다 null이면 secondarySortValue(페이지명)로 정렬', () => {
        const results = [entry(null, 'zebra'), entry(null, 'apple')];
        sortResults(results, 'asc', 'date');
        expect(results.map(e => e.secondarySortValue)).toEqual(['apple', 'zebra']);
    });
});
