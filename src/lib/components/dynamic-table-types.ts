// DynamicTable 组件的类型定义（独立 .ts 文件，便于外部按需 import）
import type { Snippet } from 'svelte';

export type Align = 'left' | 'center' | 'right';

/** 表格列定义 */
export interface ColumnDef<T = Record<string, any>> {
  /** 字段名，支持点路径如 "user.name" */
  key: string;
  /** 表头文案 */
  title: string;
  /** 列宽，如 "w-32" 或 "min-w-[160px]" */
  width?: string;
  /** 单元格内容对齐 */
  align?: Align;
  /** 单元格（td）额外 class */
  class?: string;
  /** 表头（th）额外 class */
  thClass?: string;
  /** 自定义单元格渲染；优先于 key 取值 */
  cell?: Snippet<[T]>;
}

/** 行内操作按钮 */
export interface RowAction<T = Record<string, any>> {
  /** 唯一 key */
  key: string;
  /** 按钮文案 */
  label?: string;
  /** 条件渲染；不传则总是显示 */
  show?: (row: T) => boolean;
  /** 自定义按钮内容（可与 label 共存） */
  snippet?: Snippet<[T]>;
  /** 按钮 class；不传则使用默认主色 */
  class?: string;
  /** 点击处理 */
  onclick: (row: T) => void;
}

/** 分页配置 */
export interface PaginationConfig {
  /** 总开关 */
  enabled: boolean;
  /** 每页条数，默认 10 */
  pageSize?: number;
  /** 是否显示 "共 X 条，第 N/M 页" 提示，默认 true */
  showInfo?: boolean;
}