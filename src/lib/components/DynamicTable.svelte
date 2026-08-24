<!--
  通用动态表格组件
  - 字段、行操作、分页均可配置
  - pagination.enabled=false 时不渲染分页
-->
<script lang="ts" generics="T extends Record<string, any> = Record<string, any>">
  import type { ColumnDef, RowAction, PaginationConfig, Align } from './dynamic-table-types';

  interface Props {
    rows: T[];
    columns: ColumnDef<T>[];
    /** 行唯一键 */
    rowKey: (row: T) => string;
    /** 行点击事件（设了之后行 hover 高亮且可点） */
    onRowClick?: (row: T) => void;
    /** 行内操作按钮 */
    rowActions?: RowAction<T>[];
    /** 空数据文案 */
    emptyText?: string;
    /** 分页配置；不传等同于 { enabled: false } */
    pagination?: PaginationConfig;
    /** 容器 class */
    class?: string;
  }

  let {
    rows,
    columns,
    rowKey,
    onRowClick,
    rowActions = [],
    emptyText = '暂无数据',
    pagination,
    class: containerClass = ''
  }: Props = $props();

  // ---- 内部状态 ----
  const pageSize = $derived(pagination?.pageSize ?? 10);
  const showInfo = $derived(pagination?.showInfo ?? true);
  const paginationEnabled = $derived(pagination?.enabled ?? false);

  let currentPage = $state(1);

  // 当 rows / pageSize 变化导致超出范围时，回到最后一页（避免空页）
  let totalPages = $derived(Math.max(1, Math.ceil(rows.length / pageSize)));
  $effect(() => {
    if (currentPage > totalPages) currentPage = totalPages;
  });

  let paginatedRows = $derived(
    rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  );

  function goToPage(page: number) {
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    currentPage = page;
  }

  // 可见页码：首尾 + 当前页 ±2，中间用省略号
  let pageNumbers = $derived.by(() => {
    const out: (number | 'ellipsis')[] = [];
    const around = 2;
    for (let p = 1; p <= totalPages; p++) {
      if (
        p === 1 ||
        p === totalPages ||
        (p >= currentPage - around && p <= currentPage + around)
      ) {
        out.push(p);
      } else if (out[out.length - 1] !== 'ellipsis') {
        out.push('ellipsis');
      }
    }
    return out;
  });

  // 用点路径取嵌套字段
  function getValue(row: T, path: string): unknown {
    return path.split('.').reduce<unknown>((acc, k) => {
      if (acc && typeof acc === 'object' && k in (acc as object)) {
        return (acc as Record<string, unknown>)[k];
      }
      return undefined;
    }, row);
  }
</script>

<div class={containerClass}>
  {#if rows.length === 0}
    <div class="text-center py-12">
      <p class="text-gray-500 text-lg">{emptyText}</p>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-200">
            {#each columns as col (col.key)}
              <th
                class="py-3 px-4 font-semibold text-gray-600
                  {col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}
                  {col.thClass ?? ''}"
                style={col.width ? `width:${col.width}` : ''}
              >
                {col.title}
              </th>
            {/each}
            {#if rowActions.length > 0}
              <th class="text-left py-3 px-4 font-semibold text-gray-600">操作</th>
            {/if}
          </tr>
        </thead>
        <tbody>
          {#each paginatedRows as row (rowKey(row))}
            <tr
              class="border-b border-gray-100 transition-colors
                {onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''}"
              onclick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {#each columns as col (col.key)}
                <td
                  class="py-3 px-4 {col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}
                    {col.class ?? ''}"
                >
                  {#if col.cell}
                    {@render col.cell(row)}
                  {:else}
                    {getValue(row, col.key) ?? ''}
                  {/if}
                </td>
              {/each}
              {#if rowActions.length > 0}
                <td class="py-3 px-4" onclick={(e) => e.stopPropagation()}>
                  <div class="flex items-center gap-2">
                    {#each rowActions as action (action.key)}
                      {#if !action.show || action.show(row)}
                        <button
                          onclick={() => action.onclick(row)}
                          class="cursor-pointer {action.class ?? 'px-2 py-1 text-xs text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-600 rounded transition-colors'}"
                        >
                          {#if action.label}{action.label}{/if}
                          {#if action.snippet}{@render action.snippet(row)}{/if}
                        </button>
                      {/if}
                    {/each}
                  </div>
                </td>
              {/if}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- 分页控件 -->
    {#if paginationEnabled && totalPages > 1}
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-2">
        {#if showInfo}
          <p class="text-sm text-gray-500">
            共 <span class="font-medium text-gray-700">{rows.length}</span> 条记录，
            第 <span class="font-medium text-gray-700">{currentPage}</span> /
            <span class="font-medium text-gray-700">{totalPages}</span> 页
          </p>
        {:else}
          <span></span>
        {/if}
        <nav class="flex items-center gap-1" aria-label="分页">
          <button
            onclick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="上一页"
            class="cursor-pointer px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {#each pageNumbers as page}
            {#if page === 'ellipsis'}
              <span class="px-2 text-gray-400 select-none">…</span>
            {:else}
              <button
                onclick={() => goToPage(page)}
                aria-current={page === currentPage ? 'page' : undefined}
                class="cursor-pointer min-w-9 px-3 py-1.5 text-sm rounded-md border transition-colors
                  {page === currentPage
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-100'}"
              >
                {page}
              </button>
            {/if}
          {/each}

          <button
            onclick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="下一页"
            class="cursor-pointer px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </nav>
      </div>
    {/if}
  {/if}
</div>