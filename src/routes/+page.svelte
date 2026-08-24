<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { formatDateTime, formatDuration, getStatusText, getStatusStyle } from '$lib/storage';
  import Statistics from '$lib/components/Statistics.svelte';
  import DynamicTable from '$lib/components/DynamicTable.svelte';
  import type { ColumnDef, RowAction } from '$lib/components/dynamic-table-types';

  // 从服务端加载的数据
  interface Props {
    data: {
      records: OvertimeRecord[];
      formFields: typeof import('$lib/storage').OVERTIME_FORM_FIELDS;
    };
    form?: {
      success?: boolean;
      action?: string;
      error?: string;
      field?: string;
    };
  }

  let { data, form }: Props = $props();

  // 当前标签页
  let activeTab = $state<'list' | 'stats'>('list');

  // 删除确认
  let deleteId = $state<string | null>(null);

  // 排序记录
  let sortedRecords = $derived([...data.records].sort((a, b) =>
    new Date(b.submitTime).getTime() - new Date(a.submitTime).getTime()
  ));

  // 筛选后的记录
  let filteredRecords = $derived(sortedRecords.filter(record => {
    // 关键字搜索（匹配申请人）
    const keyword = searchKeyword.toLowerCase();
    const matchKeyword = !keyword ||
      record.applicantName.toLowerCase().includes(keyword);

    // 状态筛选
    const matchStatus = filterStatus === 'all' || record.status === filterStatus;

    // 时间范围筛选（按提交时间）
    let matchDate = true;
    if (filterDateRange !== 'all') {
      const submitDate = new Date(record.submitTime);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (filterDateRange === 'today') {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        matchDate = submitDate >= today && submitDate < tomorrow;
      } else if (filterDateRange === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchDate = submitDate >= weekAgo;
      } else if (filterDateRange === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        matchDate = submitDate >= monthAgo;
      } else if (filterDateRange === 'quarter') {
        const quarterAgo = new Date(today);
        quarterAgo.setMonth(quarterAgo.getMonth() - 3);
        matchDate = submitDate >= quarterAgo;
      } else if (filterDateRange === 'year') {
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        matchDate = submitDate >= yearAgo;
      } else if (filterDateRange === 'custom') {
        if (filterStartDate) {
          const start = new Date(filterStartDate);
          start.setHours(0, 0, 0, 0);
          if (submitDate < start) matchDate = false;
        }
        if (filterEndDate) {
          const end = new Date(filterEndDate);
          end.setHours(23, 59, 59, 999);
          if (submitDate > end) matchDate = false;
        }
      }
    }

    return matchKeyword && matchStatus && matchDate;
  }));

  // ---- 行内操作按钮 ----
  const rowActions: RowAction[] = [
    {
      key: 'primary',
      show: (record) => record.status === 'pending',
      label: '审批',
      onclick: (record) => goto(`/record/${record.id}`)
    },
    {
      key: 'edit',
      show: (record) => record.status === 'rejected',
      label: '编辑',
      class: 'px-2 py-1 text-xs text-orange-600 hover:text-white hover:bg-orange-600 border border-orange-600 rounded transition-colors',
      onclick: (record) => handleEdit(record)
    },
    {
      key: 'view',
      show: (record) => record.status !== 'pending' && record.status !== 'rejected',
      label: '查看',
      class: 'px-2 py-1 text-xs text-gray-600 hover:text-white hover:bg-gray-600 border border-gray-600 rounded transition-colors',
      onclick: (record) => goto(`/record/${record.id}`)
    },
    {
      key: 'delete',
      show: (record) => record.status !== 'approved',
      label: '删除',
      class: 'px-2 py-1 text-xs text-red-600 hover:text-white hover:bg-red-600 border border-red-600 rounded transition-colors',
      onclick: (record) => handleDeleteConfirm(record.id)
    }
  ];

  // ---- 分页 ----
  let currentPage = $state(1);

  // 筛选条件变化时回到第一页
  $effect(() => {
    // 读取筛选条件以建立依赖
    searchKeyword; filterStatus; filterDateRange; filterStartDate; filterEndDate;
    currentPage = 1;
  });

  // 是否有筛选条件激活
  let hasActiveFilter = $derived(
    searchKeyword !== '' || filterStatus !== 'all' || filterDateRange !== 'all'
  );

  // 状态选项
  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'pending', label: '待审批' },
    { value: 'approved', label: '已通过' },
    { value: 'rejected', label: '已驳回' }
  ];

  // 时间范围选项
  const dateRangeOptions = [
    { value: 'all', label: '全部时间' },
    { value: 'today', label: '今天' },
    { value: 'week', label: '最近一周' },
    { value: 'month', label: '最近一个月' },
    { value: 'quarter', label: '最近三个月' },
    { value: 'year', label: '最近一年' },
    { value: 'custom', label: '自定义' }
  ];

  // 筛选状态
  let searchKeyword = $state('');
  let filterStatus = $state('all');
  let filterDateRange = $state('all');
  let filterStartDate = $state('');
  let filterEndDate = $state('');

  // 清除所有筛选
  function clearFilters() {
    searchKeyword = '';
    filterStatus = 'all';
    filterDateRange = 'all';
    filterStartDate = '';
    filterEndDate = '';
  }

  // 进入编辑页面（与新增共用 /new 页面）
  function handleEdit(record: OvertimeRecord) {
    goto(`/new?id=${record.id}`);
  }

  // 确认删除
  function handleDeleteConfirm(id: string) {
    deleteId = id;
  }
</script>

<div class="max-w-7xl mx-auto">
  <!-- 页面标题 -->
  <div class="text-center mb-6">
    <h1 class="text-3xl font-bold text-gray-800 mb-1">
      加班申请系统
    </h1>
    <p class="text-gray-500 text-sm">管理您的加班申请流程</p>
  </div>

  <!-- 标签切换 -->
  <div class="flex justify-center mb-4">
    <div class="inline-flex bg-white rounded-xl shadow-md p-1">
      <button
        onclick={() => activeTab = 'list'}
        class="cursor-pointer px-5 py-2 rounded-lg font-medium transition-all text-sm
          {activeTab === 'list' 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}"
      >
        申请列表
        {#if data.records.length > 0}
          <span class="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
            {data.records.length}
          </span>
        {/if}
      </button>
      <button
        onclick={() => activeTab = 'stats'}
        class="cursor-pointer px-5 py-2 rounded-lg font-medium transition-all text-sm
          {activeTab === 'stats' 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}"
      >
        统计报表
      </button>
    </div>
  </div>

  <!-- 内容区域 -->
  <div class="space-y-4">
    {#if activeTab === 'list'}
      <div class="bg-white rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span class="text-xl">📋</span>
            申请列表
            <span class="ml-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              {filteredRecords.length} / {data.records.length} 条记录
            </span>
          </h2>
          <button
            onclick={() => goto('/new')}
            class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            新建申请
          </button>
        </div>

        <!-- 搜索和筛选区域 -->
        <div class="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
            <!-- 搜索框 -->
            <div class="md:col-span-4">
              <label class="block text-xs text-gray-500 mb-1">姓名搜索</label>
              <div class="relative">
                <input
                  type="text"
                  bind:value={searchKeyword}
                  placeholder="输入申请人姓名..."
                  class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <svg class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <!-- 状态筛选 -->
            <div class="md:col-span-3">
              <label class="block text-xs text-gray-500 mb-1">状态</label>
              <select
                bind:value={filterStatus}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                {#each statusOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>

            <!-- 时间范围筛选 -->
            <div class="md:col-span-3">
              <label class="block text-xs text-gray-500 mb-1">提交时间</label>
              <select
                bind:value={filterDateRange}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                {#each dateRangeOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>

            <!-- 清除按钮 -->
            <div class="md:col-span-2 flex items-end">
              {#if hasActiveFilter}
                <button
                  onclick={clearFilters}
                  class="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  清除筛选
                </button>
              {/if}
            </div>
          </div>

          <!-- 自定义日期范围 -->
          {#if filterDateRange === 'custom'}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-200">
              <div>
                <label class="block text-xs text-gray-500 mb-1">开始日期</label>
                <input
                  type="date"
                  bind:value={filterStartDate}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">结束日期</label>
                <input
                  type="date"
                  bind:value={filterEndDate}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          {/if}
        </div>

        {#if data.records.length === 0}
          <div class="text-center py-12">
            <p class="text-gray-500 text-lg">暂无加班申请记录</p>
            <p class="text-gray-400 text-sm mt-2">点击上方按钮提交您的第一条加班申请</p>
          </div>
        {:else if filteredRecords.length === 0}
          <div class="text-center py-12">
            <p class="text-gray-500 text-lg">没有符合条件的记录</p>
            <p class="text-gray-400 text-sm mt-2">请调整筛选条件后重试</p>
            <button
              onclick={clearFilters}
              class="mt-3 px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
            >
              清除筛选条件
            </button>
          </div>
        {:else}
          <!-- 单元格自定义渲染片段 -->
          {#snippet dateRangeCell(record)}
            <div class="text-sm text-gray-600">
              <div>开始: {formatDateTime(record.startTime)}</div>
              <div>结束: {formatDateTime(record.endTime)}</div>
            </div>
          {/snippet}

          {#snippet durationCell(record)}
            <span class="text-blue-600 font-medium">{formatDuration(record.duration)}</span>
          {/snippet}

          {#snippet reasonCell(record)}
            <p class="text-gray-600 text-sm truncate" title={record.reason}>{record.reason}</p>
          {/snippet}

          {#snippet submitTimeCell(record)}
            {formatDateTime(record.submitTime)}
          {/snippet}

          {#snippet statusCell(record)}
            <span class="px-3 py-1 rounded-full text-xs font-medium border {getStatusStyle(record.status)}">
              {getStatusText(record.status)}
            </span>
          {/snippet}

          {@const columns: ColumnDef[] = [
            { key: 'applicantName', title: '申请人', class: 'font-medium text-gray-800' },
            { key: 'startTime', title: '加班日期时间', cell: dateRangeCell },
            { key: 'duration', title: '加班时长', class: 'text-blue-600 font-medium', cell: durationCell },
            { key: 'reason', title: '加班事由', class: 'max-w-xs', cell: reasonCell },
            { key: 'submitTime', title: '提交时间', class: 'text-sm text-gray-500', cell: submitTimeCell },
            { key: 'status', title: '状态', cell: statusCell }
          ]}
          <DynamicTable
            rows={filteredRecords}
            {columns}
            rowKey={(record) => record.id}
            onRowClick={(record) => goto(`/record/${record.id}`)}
            {rowActions}
            emptyText="没有符合条件的记录"
            pagination={{ enabled: true, pageSize: 10, showInfo: true }}
          />
        {/if}
      </div>
    {:else}
      <!-- 统计报表组件 -->
      <Statistics records={data.records} />
    {/if}
  </div>
</div>

<!-- 删除确认弹窗 -->
{#if deleteId}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
      <div class="text-center">
        <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-gray-800 mb-2">确认删除</h3>
        <p class="text-gray-500 mb-6">确定要删除这条申请记录吗？此操作无法撤销。</p>
        <div class="flex gap-3">
          <button
            onclick={() => deleteId = null}
            class="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
          >
            取消
          </button>
          <form method="POST" action="?/delete" use:enhance={() => {
            return async ({ update }) => {
              await update();
              deleteId = null;
            };
          }} class="flex-1">
            <input type="hidden" name="id" value={deleteId} />
            <button
              type="submit"
              class="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              确认删除
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
{/if}
