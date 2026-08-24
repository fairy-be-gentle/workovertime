<!-- 列表页 -->
<script lang="ts">
  import type { OvertimeRecord } from '$lib/types';
  import { formatDateTime, formatDuration, getStatusText, getStatusStyle } from '$lib/storage';

  interface Props {
    records: OvertimeRecord[];
    onNew: () => void;
    onPreview: (record: OvertimeRecord) => void;
    onEdit: (record: OvertimeRecord) => void;
    onDelete: (id: string) => void;
  }

  let { records, onNew, onPreview, onEdit, onDelete }: Props = $props();

  // 排序：最新的在前面
  let sortedRecords = $derived([...records].sort((a, b) => 
    new Date(b.submitTime).getTime() - new Date(a.submitTime).getTime()
  ));
</script>

<div class="bg-white rounded-xl shadow-lg p-6">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
      <span class="text-xl">📋</span>
      申请列表
      <span class="ml-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
        {records.length} 条记录
      </span>
    </h2>
    <button
      onclick={onNew}
      class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      新建申请
    </button>
  </div>

  {#if records.length === 0}
    <div class="text-center py-12">
      <p class="text-gray-500 text-lg">暂无加班申请记录</p>
      <p class="text-gray-400 text-sm mt-2">点击上方表单提交您的第一条加班申请</p>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-200">
            <th class="text-left py-3 px-4 font-semibold text-gray-600">申请人</th>
            <th class="text-left py-3 px-4 font-semibold text-gray-600">加班日期时间</th>
            <th class="text-left py-3 px-4 font-semibold text-gray-600">加班时长</th>
            <th class="text-left py-3 px-4 font-semibold text-gray-600">加班事由</th>
            <th class="text-left py-3 px-4 font-semibold text-gray-600">提交时间</th>
            <th class="text-left py-3 px-4 font-semibold text-gray-600">状态</th>
            <th class="text-left py-3 px-4 font-semibold text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody>
          {#each sortedRecords as record (record.id)}
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td class="py-3 px-4">
                <span class="font-medium text-gray-800">{record.applicantName}</span>
              </td>
              <td class="py-3 px-4">
                <div class="text-sm text-gray-600">
                  <div>开始: {formatDateTime(record.startTime)}</div>
                  <div>结束: {formatDateTime(record.endTime)}</div>
                </div>
              </td>
              <td class="py-3 px-4">
                <span class="text-blue-600 font-medium">{formatDuration(record.duration)}</span>
              </td>
              <td class="py-3 px-4 max-w-xs">
                <p class="text-gray-600 text-sm truncate" title={record.reason}>
                  {record.reason}
                </p>
              </td>
              <td class="py-3 px-4 text-sm text-gray-500">
                {formatDateTime(record.submitTime)}
              </td>
              <td class="py-3 px-4">
                <span class="px-3 py-1 rounded-full text-xs font-medium border {getStatusStyle(record.status)}">
                  {getStatusText(record.status)}
                </span>
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <button
                    onclick={() => onPreview(record)}
                    class="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="预览"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onclick={() => onEdit(record)}
                    class="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onclick={() => onDelete(record.id)}
                    class="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
