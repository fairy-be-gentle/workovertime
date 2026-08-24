<!-- 时间轴 -->
<script lang="ts">
  import type { WorkflowStep, WorkflowStepStatus } from "$lib/types";

  interface Props {
    steps: WorkflowStep[];
    currentStatus: "pending" | "approved" | "rejected";
  }

  let { steps, currentStatus }: Props = $props();

  // 格式化时间
  function formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // 获取步骤图标
  function getStepIcon(type: string, status: WorkflowStepStatus): string {
    if (status === "completed") {
      if (type === "submit") return "📤";
      if (type === "approve") return "✅";
      if (type === "reject") return "❌";
    }
    if (status === "rejected") return "❌";
    if (status === "processing") return "⏳";
    return "⭕";
  }

  // 获取步骤颜色
  function getStepColor(status: WorkflowStepStatus, type: string): string {
    if (status === "completed") {
      return type === "approve" ? "text-green-600" : "text-green-600";
    }
    if (status === "rejected") return "text-red-600";
    if (status === "processing") return "text-blue-600";
    return "text-gray-400";
  }

  // 获取连接线颜色
  function getLineColor(
    prevStep: WorkflowStep | null,
    nextStep: WorkflowStep | null,
  ): string {
    if (!nextStep) return "bg-gray-200";
    if (nextStep.status === "completed") return "bg-green-500";
    if (nextStep.status === "rejected") return "bg-red-500";
    return "bg-gray-200";
  }
</script>

<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
  <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
    <span class="text-xl">📋</span>
    审批流程
  </h3>

  {#if steps.length === 0}
    <div class="text-center py-8 text-gray-400">
      <p class="text-4xl mb-2">📭</p>
      <p>暂无审批记录</p>
    </div>
  {:else}
    <div class="relative">
      <!-- 时间轴线 -->
      <div
        class="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 to-gray-200"
      ></div>

      <!-- 步骤列表 -->
      <div class="space-y-6 relative">
        {#each steps as step, index}
          <div class="relative flex items-start gap-4">
            <!-- 图标圆圈 -->
            <div
              class="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 {getStepColor(
                step.status,
                step.type,
              )} {step.status === 'completed'
                ? 'border-green-500 bg-green-50'
                : step.status === 'rejected'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300'} flex items-center justify-center text-lg"
            >
              {getStepIcon(step.type, step.status)}
            </div>

            <!-- 内容 -->
            <div class="flex-1 min-w-0 pb-2">
              <div class="flex items-center justify-between mb-1">
                <h4 class="font-medium text-gray-800">{step.stepName}</h4>
                <span class="text-sm text-gray-500"
                  >{formatTime(step.operateTime)}</span
                >
              </div>

              <div class="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <span class="font-medium">{step.operator}</span>
                {#if step.status === "completed"}
                  <span class="text-green-600">已完成</span>
                {:else if step.status === "rejected"}
                  <span class="text-red-600">已驳回</span>
                {:else if step.status === "processing"}
                  <span class="text-blue-600">处理中</span>
                {/if}
              </div>

              {#if step.comment}
                <div
                  class="mt-2 p-2 bg-gray-50 rounded-lg text-sm text-gray-600"
                >
                  <span class="font-medium text-gray-500">备注：</span
                  >{step.comment}
                </div>
              {/if}
            </div>
          </div>
        {/each}

        <!-- 当前状态 -->
        {#if currentStatus === "pending"}
          <div class="relative flex items-start gap-4">
            <div
              class="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-blue-400 bg-blue-50 flex items-center justify-center text-lg animate-pulse"
            >
              ⏳
            </div>
            <div class="flex-1 min-w-0 pb-2">
              <h4 class="font-medium text-blue-600">等待审批</h4>
              <p class="text-sm text-gray-500">审批人处理中...</p>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
</style>
