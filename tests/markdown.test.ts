import { describe, it, expect } from 'vitest';
import {
    cleanLogseqProperties,
    convertPageBlocksToMarkdown,
    generateFilename,
    hasOrderedListProperty,
    renderBlockWithChildren
} from '../src/utils/markdown';
import type { BlockEntity } from '@logseq/libs/dist/LSPlugin';

const block = (content: string, children: BlockEntity[] = []): BlockEntity =>
    ({ id: Math.floor(Math.random() * 1e9), uuid: 'test-uuid', content, children } as unknown as BlockEntity);

describe('hasOrderedListProperty', () => {
    it('order-list-type:: number 속성 감지', () => {
        expect(hasOrderedListProperty('item\nlogseq.order-list-type:: number')).toBe(true);
        expect(hasOrderedListProperty('plain item')).toBe(false);
        expect(hasOrderedListProperty('')).toBe(false);
    });
});

describe('cleanLogseqProperties', () => {
    it('블록 프로퍼티 라인 제거', () => {
        expect(cleanLogseqProperties('content\nlogseq.order-list-type:: number')).toBe('content');
        expect(cleanLogseqProperties('id:: 1234\ncontent')).toBe('content');
    });

    it('일반 본문은 그대로 유지', () => {
        expect(cleanLogseqProperties('just text')).toBe('just text');
    });
});

describe('renderBlockWithChildren', () => {
    it('자식 블록은 탭 인덴트로 렌더링', () => {
        const tree = block('parent', [block('child', [block('grandchild')])]);
        const md = renderBlockWithChildren(tree);
        expect(md).toBe('- parent\n\t- child\n\t\t- grandchild\n');
    });

    it('순서형 리스트 블록은 1. 접두사 사용', () => {
        const tree = block('item\nlogseq.order-list-type:: number');
        expect(renderBlockWithChildren(tree)).toBe('1. item\n');
    });

    it('링크 치환 적용', () => {
        const tree = block('see [[Some Page]]');
        const md = renderBlockWithChildren(tree, { linkReplacement: { open: '**', close: '**' } });
        expect(md).toBe('- see **Some Page**\n');
    });

    it('maxDepth 초과 시 렌더링 중단', () => {
        const tree = block('parent', [block('child')]);
        expect(renderBlockWithChildren(tree, { maxDepth: 0 })).toBe('- parent\n');
    });
});

describe('convertPageBlocksToMarkdown', () => {
    it('페이지 본문도 동일하게 탭 인덴트로 렌더링', () => {
        const blocks = [block('top', [block('nested')])];
        expect(convertPageBlocksToMarkdown(blocks)).toBe('- top\n\t- nested\n');
    });

    it('빈 입력은 빈 문자열', () => {
        expect(convertPageBlocksToMarkdown([])).toBe('');
    });
});

describe('generateFilename', () => {
    it('기본 형식', () => {
        expect(generateFilename('tag', [], 'filename')).toBe('tag_all_blocks.md');
    });

    it('계층 페이지의 슬래시 등 금지 문자를 _로 치환', () => {
        expect(generateFilename('project/sub', [], 'filename')).toBe('project_sub_all_blocks.md');
        expect(generateFilename('a:b?c', [], 'filename')).toBe('a_b_c_all_blocks.md');
    });

    it('필터 키워드와 정렬 필드 반영', () => {
        expect(generateFilename('tag', ['kw1', 'kw2'], 'date')).toBe('tag_filtered_kw1_kw2_sortBy_date.md');
    });
});
