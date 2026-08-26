/**
 * DynamicTable 动态表格组件的类型定义
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import DynamicTable from '$lib/components/DynamicTable.svelte';
 *
 *   const columns: ColumnDef[] = [
 *     { key: 'name', title: '姓名', width: 'w-32' },
 *     { key: 'email', title: '邮箱', align: 'center' },
 *     { key: 'status', title: '状态', cell: (row) => h('span', {}, row.status) },
 *   ];
 *
 *   const actions: RowAction[] = [
 *     { key: 'edit', label: '编辑', onclick: (row) => navigate(`/edit/${row.id}`) },
 *     { key: 'delete', label: '删除', show: (row) => row.status !== 'deleted', onclick: deleteRow },
 *   ];
 * </script>
 *
 * <DynamicTable
 *   rows={data}
 *   {columns}
 *   rowKey={(row) => row.id}
 *   {rowActions}
 *   pagination={{ enabled: true, pageSize: 20, showInfo: true }}
 * />
 * ```
 */

import type { Snippet } from 'svelte';

/** 单元格/表头的水平对齐方式 */
export type Align = 'left' | 'center' | 'right';

/**
 * 表格列配置
 *
 * @template T - 表格行数据的类型，如 `User` 或 `{ id: number; name: string }`
 */
export interface ColumnDef<T = Record<string, unknown>> {
  /**
   * 数据字段路径，支持点notation读取嵌套值
   * @example "user.name" 会读取 row.user.name
   */
  key: string;
  /** 表头显示的文字 */
  title: string;
  /** 列宽，如 "w-32" 或 "min-w-[160px]" 或 "100px" */
  width?: string;
  /** 单元格内容水平对齐方式，默认 left */
  align?: Align;
  /** 单元格 <td> 的额外 Tailwind class */
  class?: string;
  /** 表头 <th> 的额外 Tailwind class */
  thClass?: string;
  /**
   * 自定义单元格渲染函数（优先级高于 key）
   * 传入 Svelte 的 Snippet 渲染函数，参数为当前行数据
   */
  cell?: Snippet<[T]>;
}

/**
 * 行内操作按钮配置
 *
 * @template T - 表格行数据的类型
 */
export interface RowAction<T = Record<string, unknown>> {
  /** 按钮唯一标识，用于 key 管理 */
  key: string;
  /** 按钮显示文字，与 snippet 二选一，也可同时使用 */
  label?: string;
  /** 条件渲染函数，返回 true 时显示按钮；不设置则始终显示 */
  show?: (row: T) => boolean;
  /**
   * 自定义按钮内容片段（可与 label 共存）
   * 传入 Svelte 的 Snippet 渲染函数
   */
  snippet?: Snippet<[T]>;
  /** 按钮的额外 Tailwind class，不设置则使用默认蓝色边框样式 */
  class?: string;
  /** 点击按钮时的回调处理函数 */
  onclick: (row: T) => void;
}

/**
 * 分页器配置
 *
 * @example
 * ```ts
 * // 禁用分页（默认）
 * pagination={undefined}
 *
 * // 启用分页，每页20条，显示总数信息
 * pagination={{ enabled: true, pageSize: 20, showInfo: true }}
 * ```
 */
export interface PaginationConfig {
  /** 是否启用分页功能 */
  enabled: boolean;
  /** 每页显示的记录条数，不设置默认为 10 */
  pageSize?: number;
  /** 是否在分页器左侧显示"共 X 条，第 N/M 页"提示文字 */
  showInfo?: boolean;
}
