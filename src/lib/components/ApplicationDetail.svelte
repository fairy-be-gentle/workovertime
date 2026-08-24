<!-- 详情页 -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import type { OvertimeRecord } from "$lib/types";
  import {
    formatDateTime,
    formatDuration,
    getStatusText,
    getStatusStyle,
  } from "$lib/storage";

  interface Props {
    record: OvertimeRecord;
    onClose: () => void;
  }

  let { record, onClose }: Props = $props();

  // 流程步骤
  const steps = [
    { id: "submit", label: "提交申请" },
    { id: "review", label: "审批中" },
    { id: "complete", label: "完成" },
  ];

  // 根据状态计算当前步骤
  let currentStep = $derived.by(() => {
    switch (record.status) {
      case "pending":
        return 1; // 审批中
      case "approved":
        return 2; // 完成
      case "rejected":
        return 2; // 被驳回也算完成（但有特殊样式）
      default:
        return 0;
    }
  });

  // 判断是否被驳回
  let isRejected = $derived(record.status === "rejected");
</script>

<div
  class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
  onclick={onClose}
>
  <div
    class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
    onclick={(e) => e.stopPropagation()}
    role="dialog"
    aria-modal="true"
  >
    <!-- Header -->
    <div
      class="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl"
    >
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold flex items-center gap-2">申请详情</h2>
        <button
          onclick={onClose}
          class="p-2 hover:bg-white/20 rounded-full transition-colors"
          aria-label="关闭"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6 space-y-6">
      <!-- 流程图 -->
      <div
        class="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200"
      >
        <h3
          class="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2"
        >
          申请进度
        </h3>

        <!-- 流程图主体 -->
        <div class="flex items-center justify-between relative">
          <!-- 连接线 -->
          <div class="absolute top-6 left-0 right-0 h-1 bg-gray-200 -z-0"></div>

          {#each steps as step, index}
            {@const stepNum = index + 1}
            {@const isCompleted = stepNum < currentStep}
            {@const isCurrent = stepNum === currentStep}
            {@const isRejectedStep = isRejected && stepNum === 2}

            <div class="flex flex-col items-center relative z-10">
              <!-- 步骤圆圈 -->
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-300
                  {isCompleted ? 'bg-green-500 text-white' : ''}
                  {isCurrent && !isRejectedStep
                  ? 'bg-blue-500 text-white ring-4 ring-blue-200'
                  : ''}
                  {isRejectedStep
                  ? 'bg-red-500 text-white ring-4 ring-red-200'
                  : ''}
                  {!isCompleted && !isCurrent
                  ? 'bg-gray-300 text-gray-500'
                  : ''}"
              >
                {#if isCompleted && !isRejectedStep}
                  <svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                {:else if isRejectedStep}
                  <svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                {:else}
                  <span>{step.icon}</span>
                {/if}
              </div>

              <!-- 步骤标签 -->
              <p
                class="mt-2 text-xs font-medium text-center
                {isCompleted || isCurrent ? 'text-gray-700' : 'text-gray-400'}
                {isRejectedStep ? 'text-red-600 font-semibold' : ''}"
              >
                {step.label}
                {#if isRejectedStep}
                  <span class="block text-xs">(已驳回)</span>
                {/if}
              </p>

              <!-- 时间戳 -->
              {#if stepNum === 1}
                <p class="mt-1 text-xs text-gray-400">
                  {formatDateTime(record.submitTime)}
                </p>
              {/if}
            </div>
          {/each}
        </div>

        <!-- 驳回原因提示 -->
        {#if isRejected}
          <div class="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <div class="flex items-start gap-2">
              <span class="text-red-500 text-lg">⚠️</span>
              <div>
                <p class="text-sm font-medium text-red-700">申请已被驳回</p>
                <p class="text-xs text-red-500 mt-1">如有疑问，请联系审批人</p>
              </div>
            </div>
          </div>
        {/if}

        <!-- 审批状态说明 -->
        {#if record.status === "pending"}
          <div class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div class="flex items-start gap-2">
              <span class="text-blue-500 text-lg">💬</span>
              <div>
                <p class="text-sm font-medium text-blue-700">等待审批中</p>
                <p class="text-xs text-blue-500 mt-1">
                  您的申请正在等待审批，请耐心等待
                </p>
              </div>
            </div>
          </div>
        {:else if record.status === "approved"}
          <div class="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <div class="flex items-start gap-2">
              <span class="text-green-500 text-lg">🎉</span>
              <div>
                <p class="text-sm font-medium text-green-700">申请已通过</p>
                <p class="text-xs text-green-500 mt-1">
                  恭喜！您的加班申请已审批通过
                </p>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- 状态 -->
      <div class="flex justify-between items-center">
        <span class="text-gray-500">当前状态</span>
        <span
          class="px-4 py-1.5 rounded-full text-sm font-medium border {getStatusStyle(
            record.status,
          )}"
        >
          {getStatusText(record.status)}
        </span>
      </div>

      <!-- 申请人信息 -->
      <div class="bg-gray-50 rounded-xl p-4">
        <h3 class="text-sm text-gray-500 mb-2 flex items-center gap-2">
          申请人信息
        </h3>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <p class="text-xs text-gray-400 mb-1">姓名</p>
            <p class="font-medium text-gray-800">{record.applicantName}</p>
          </div>
          <div>
            <p class="text-xs text-gray-400 mb-1">部门</p>
            <p class="font-medium text-gray-800">{record.department || "-"}</p>
          </div>
          <div>
            <p class="text-xs text-gray-400 mb-1">职位</p>
            <p class="font-medium text-gray-800">{record.position || "-"}</p>
          </div>
        </div>
      </div>

      <!-- 加班时间 -->
      <div class="bg-gray-50 rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm text-gray-500 flex items-center gap-2">
            加班时间
          </h3>
          <!-- 仅待审批或被驳回时可修改（与 form schema 的 readonlyWhenApproved 一致） -->
          {#if record.status !== 'approved'}
            <button
              onclick={() => goto(`/new?id=${record.id}`)}
              class="px-2.5 py-1 text-xs text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-600 rounded transition-colors flex items-center gap-1"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              修改
            </button>
          {/if}
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-gray-400 mb-1">开始时间</p>
            <p class="font-medium text-gray-800">
              {formatDateTime(record.startTime)}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-400 mb-1">结束时间</p>
            <p class="font-medium text-gray-800">
              {formatDateTime(record.endTime)}
            </p>
          </div>
        </div>
      </div>

      <!-- 加班时长 -->
      <div class="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <h3 class="text-sm text-blue-600 mb-1 flex items-center gap-2">
          加班时长
        </h3>
        <p class="text-2xl font-bold text-blue-700">
          {formatDuration(record.duration)}
        </p>
      </div>

      <!-- 加班事由 -->
      <div class="bg-gray-50 rounded-xl p-4">
        <h3 class="text-sm text-gray-500 mb-2 flex items-center gap-2">
          加班事由
        </h3>
        <p class="text-gray-800 leading-relaxed whitespace-pre-wrap">
          {record.reason}
        </p>
      </div>

      <!-- 提交时间 -->
      <div class="bg-gray-50 rounded-xl p-4">
        <h3 class="text-sm text-gray-500 mb-1 flex items-center gap-2">
          提交时间
        </h3>
        <p class="text-gray-800">{formatDateTime(record.submitTime)}</p>
      </div>

      <!-- 申请单号 -->
      <div class="bg-gray-50 rounded-xl p-4">
        <h3 class="text-sm text-gray-500 mb-1 flex items-center gap-2">
          申请单号
        </h3>
        <p class="text-gray-600 font-mono text-sm">{record.id}</p>
      </div>
    </div>

    <!-- Footer -->
    <div class="sticky bottom-0 bg-gray-50 p-4 rounded-b-2xl border-t">
      <button
        onclick={onClose}
        class="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
      >
        关闭
      </button>
    </div>
  </div>
</div>
