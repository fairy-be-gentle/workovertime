<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { formatDateTime, formatDuration, getStatusText, getStatusStyle } from '$lib/storage';
  import type { OvertimeRecord } from '$lib/storage';
  import Timeline from '$lib/components/Timeline.svelte';

  interface Props {
    data: {
      record: OvertimeRecord;
    };
    form?: {
      success?: boolean;
      action?: string;
      error?: string;
    };
  }

  let { data, form }: Props = $props();

  // 使用 $derived 来响应 data 变化
  let record = $derived(data.record);

  // 审批/驳回弹窗
  let showActionDialog = $state(false);
  let actionType = $state<'approve' | 'reject' | null>(null);
  let actionComment = $state('');
  let operatorName = $state('');
  let actionErrors = $state<Record<string, string>>({});

  // 计算时长
  let calculatedDuration = $derived.by(() => {
    if (record.startTime && record.endTime) {
      const start = new Date(record.startTime);
      const end = new Date(record.endTime);
      if (end > start) {
        const diffMs = end.getTime() - start.getTime();
        return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
      }
    }
    return 0;
  });

  // 返回列表
  function goBack() {
    history.back();
  }

  // 打开审批对话框
  function openApproveDialog() {
    actionType = 'approve';
    actionComment = '';
    operatorName = '';
    actionErrors = {};
    showActionDialog = true;
  }

  // 打开驳回对话框
  function openRejectDialog() {
    actionType = 'reject';
    actionComment = '';
    operatorName = '';
    actionErrors = {};
    showActionDialog = true;
  }

  // 验证操作
  function validateAction(): boolean {
    actionErrors = {};
    let valid = true;

    if (!operatorName.trim()) {
      actionErrors.operatorName = '请输入审批人姓名';
      valid = false;
    }

    if (valid) {
      showActionDialog = false;
    }
    return valid;
  }

  // 监听表单结果
  $effect(() => {
    if (form?.success) {
      invalidateAll();
    }
  });
</script>

<svelte:head>
  <title>申请详情 - {record.applicantName}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- 顶部导航 -->
  <header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
    <div class="max-w-6xl mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button
            onclick={goBack}
            class="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              class="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 class="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>📄</span>
            申请详情
          </h1>
        </div>

        <!-- 状态标签 -->
        <span class="px-3 py-1 rounded-full text-sm font-medium {getStatusStyle(record.status)}">
          {getStatusText(record.status)}
        </span>
      </div>
    </div>
  </header>

  <!-- 主内容 -->
  <main class="max-w-6xl mx-auto px-4 py-6">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧：申请信息 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 基本信息卡片 -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>👤</span> 申请人信息
          </h2>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-500 mb-1">申请人</label>
              <p class="text-gray-800 font-medium">{record.applicantName}</p>
            </div>
            <div>
              <label class="block text-sm text-gray-500 mb-1">部门</label>
              <p class="text-gray-800 font-medium">{record.department || '-'}</p>
            </div>
            <div>
              <label class="block text-sm text-gray-500 mb-1">职位</label>
              <p class="text-gray-800 font-medium">{record.position || '-'}</p>
            </div>
            <div>
              <label class="block text-sm text-gray-500 mb-1">提交时间</label>
              <p class="text-gray-800 font-medium">{formatDateTime(record.submitTime)}</p>
            </div>
          </div>
        </div>

        <!-- 加班信息卡片 -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <span>⏰</span> 加班信息
          </h2>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-500 mb-1">开始时间</label>
              <p class="text-gray-800 font-medium">{formatDateTime(record.startTime)}</p>
            </div>
            <div>
              <label class="block text-sm text-gray-500 mb-1">结束时间</label>
              <p class="text-gray-800 font-medium">{formatDateTime(record.endTime)}</p>
            </div>
            <div>
              <label class="block text-sm text-gray-500 mb-1">加班时长</label>
              <p class="text-gray-800 font-medium text-blue-600">
                {formatDuration(calculatedDuration)}
              </p>
            </div>
          </div>
        </div>

        <!-- 加班事由卡片 -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>📝</span> 加班事由
          </h2>

          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-gray-700 whitespace-pre-wrap">{record.reason}</p>
          </div>
        </div>
      </div>

      <!-- 右侧：时间轴 -->
      <div class="space-y-6">
        <Timeline steps={record.workflowHistory || []} currentStatus={record.status} />
      </div>
    </div>
  </main>

  <!-- 底部悬浮审批操作栏（仅待审批状态显示） -->
  {#if record.status === 'pending'}
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-20">
      <div class="max-w-6xl mx-auto flex gap-3">
        <form
          method="POST"
          action="?/approve"
          use:enhance={() => {
            return async ({ result, update }) => {
              if (result.type === 'success') {
                await update({ reset: false });
                await invalidateAll();
              } else {
                await update();
              }
            };
          }}
          class="flex-1"
        >
          <input type="hidden" name="id" value={record.id} />
          <input type="hidden" name="operator" value="审批人" />
          <button
            type="submit"
            class="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>✅</span> 批准
          </button>
        </form>

        <form
          method="POST"
          action="?/reject"
          use:enhance={() => {
            return async ({ result, update }) => {
              if (result.type === 'success') {
                await update({ reset: false });
                await invalidateAll();
              } else {
                await update();
              }
            };
          }}
          class="flex-1"
        >
          <input type="hidden" name="id" value={record.id} />
          <input type="hidden" name="operator" value="审批人" />
          <button
            type="submit"
            class="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>❌</span> 驳回
          </button>
        </form>
      </div>
    </div>
  {/if}
</div>
