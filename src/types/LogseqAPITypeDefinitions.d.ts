// Logseq API 타입 정의
import {BlockEntity} from "@logseq/libs/dist/LSPlugin";

export interface LogseqAPI {
  App: {
    registerCommandPalette: (config: CommandPaletteConfig, callback: () => Promise<void>) => void;
    registerUIItem: (type: string, config: UIItemConfig) => void;
    desc: (type: string) => void;
  };
  Editor: {
    registerSlashCommand: (name: string, callback: () => Promise<void>) => void;
    registerBlockContextMenuItem: (name: string, callback: (e: any) => Promise<void>) => void;
    getCurrentPage: () => Promise<PageEntity | null>;
  };
  UI: {
    showMsg: (message: string, status?: 'success' | 'warning' | 'error') => void;
  };
  DB: {
    datascriptQuery: (query: string) => Promise<any[]>;
  };
}

export interface CommandPaletteConfig {
  key: string;
  label: string;
  desc: string;
}

export interface UIItemConfig {
  key: string;
  template: string;
}

export interface PageEntity {
  name?: string;
  properties?: Record<string, any>;
  [key: string]: any;
}

export interface Block {
  content: string;
  children: Block[];
}

export interface ExtendedBlockEntity {
  block: BlockEntity;
  sortValue: string;
  secondarySortValue: string;
}

export interface LinkReplacment { open: string; close: string; }

// 앱 관련 타입 정의
export interface DialogState {
  primaryTag: string;
  filterKeywords: string;
  sortField: string;
  sortDesc: boolean;
  maxResults: number;
  includeChildren: boolean;
  inheritFilters: boolean;
}