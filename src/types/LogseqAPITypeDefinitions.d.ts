// Logseq API 타입 정의
import {BlockEntity} from "@logseq/libs/dist/LSPlugin";

export interface PageEntity {
  name?: string;
  properties?: Record<string, any>;
  [key: string]: any;
}

// 정렬 값: filename 정렬은 문자열, 프로퍼티 정렬은 숫자(타임스탬프)·문자열·null 모두 가능
export type SortValue = string | number | null;

export interface ExtendedBlockEntity {
  block: BlockEntity;
  sortValue: SortValue;
  secondarySortValue: string;
}

export interface LinkReplacment { open: string; close: string; }
