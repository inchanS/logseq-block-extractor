import { describe, it, expect } from 'vitest';
import { blockContainsKeywords, filterBlocksByKeyword } from '../src/core/filter';
import type { BlockEntity } from '@logseq/libs/dist/LSPlugin';

const block = (content: string, children: BlockEntity[] = []): BlockEntity =>
    ({ id: Math.floor(Math.random() * 1e9), uuid: 'test-uuid', content, children } as unknown as BlockEntity);

describe('blockContainsKeywords', () => {
    it('빈 콘텐츠는 false', () => {
        expect(blockContainsKeywords(block(''), ['a'])).toBe(false);
    });

    it('or 모드: 키워드 중 하나만 포함해도 true', () => {
        expect(blockContainsKeywords(block('coding note'), ['coding', 'music'], 'or')).toBe(true);
        expect(blockContainsKeywords(block('travel log'), ['coding', 'music'], 'or')).toBe(false);
    });

    it('and 모드: 모든 키워드를 포함해야 true', () => {
        expect(blockContainsKeywords(block('coding music note'), ['coding', 'music'], 'and')).toBe(true);
        expect(blockContainsKeywords(block('coding note'), ['coding', 'music'], 'and')).toBe(false);
    });

    it('대소문자 무시', () => {
        expect(blockContainsKeywords(block('CODING Note'), ['coding'])).toBe(true);
    });

    it('- 접두사 키워드는 제외 조건으로 동작', () => {
        expect(blockContainsKeywords(block('coding draft'), ['coding', '-draft'])).toBe(false);
        expect(blockContainsKeywords(block('coding final'), ['coding', '-draft'])).toBe(true);
    });

    it('제외 키워드만 있는 경우: 제외 키워드가 없으면 true', () => {
        expect(blockContainsKeywords(block('final version'), ['-draft'])).toBe(true);
        expect(blockContainsKeywords(block('draft version'), ['-draft'])).toBe(false);
    });
});

describe('filterBlocksByKeyword', () => {
    it('본문이 매칭되면 자식까지 그대로 유지', () => {
        const child = block('child content');
        const parent = block('coding note', [child]);

        const result = filterBlocksByKeyword(parent, ['coding']);
        expect(result).not.toBeNull();
        expect(result!.children).toHaveLength(1);
    });

    it('본문이 매칭되지 않아도 매칭되는 자식이 있으면 계층 유지', () => {
        const matching = block('coding tip');
        const nonMatching = block('random');
        const parent = block('daily note', [matching, nonMatching]);

        const result = filterBlocksByKeyword(parent, ['coding']);
        expect(result).not.toBeNull();
        expect(result!.children).toHaveLength(1);
        expect((result!.children![0] as BlockEntity).content).toBe('coding tip');
    });

    it('본문·자식 모두 매칭되지 않으면 null', () => {
        const parent = block('daily note', [block('random')]);
        expect(filterBlocksByKeyword(parent, ['coding'])).toBeNull();
    });

    it('include 매칭된 블록의 하위에서도 제외 키워드가 적용됨', () => {
        const parent = block('coding note', [
            block('sub task hold', [block('grandchild of excluded')]),
            block('keep me'),
        ]);

        const result = filterBlocksByKeyword(parent, ['coding', '-hold']);
        expect(result).not.toBeNull();
        expect(result!.children).toHaveLength(1);
        expect((result!.children![0] as BlockEntity).content).toBe('keep me');
    });

    it('블록 자체에 제외 키워드가 있으면 자손이 매칭되어도 트리째 제거됨', () => {
        const parent = block('note hold', [block('coding tip')]);
        expect(filterBlocksByKeyword(parent, ['coding', '-hold'])).toBeNull();
    });

    it('제외 키워드만 있는 경우: 해당 블록만 제거되고 나머지 계층은 유지', () => {
        const parent = block('parent note', [
            block('child hold'),
            block('child ok', [block('nested hold'), block('nested ok')]),
        ]);

        const result = filterBlocksByKeyword(parent, ['-hold']);
        expect(result).not.toBeNull();
        expect(result!.children).toHaveLength(1);

        const survivingChild = result!.children![0] as BlockEntity;
        expect(survivingChild.content).toBe('child ok');
        expect(survivingChild.children).toHaveLength(1);
        expect((survivingChild.children![0] as BlockEntity).content).toBe('nested ok');
    });

    it('"-" 단독 입력은 빈 제외 키워드로 취급되어 무시됨', () => {
        const parent = block('anything');
        expect(filterBlocksByKeyword(parent, ['-'])).not.toBeNull();
    });
});
