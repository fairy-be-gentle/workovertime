<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import DynamicForm from '$lib/components/DynamicForm.svelte';
  import {
    calculateDuration,
    formatDuration,
    validateAll,
    validateReasonLength,
    validateTimeRange,
  } from '$lib/storage';
  import type { FormData, OvertimeRecord } from '$lib/storage';

  const STORAGE_KEY = 'overtime_form_draft';
  const EDITING_ID_KEY = 'overtime_form_editing_id';

  interface Props {
    data: {
      formFields: typeof import('$lib/storage').OVERTIME_FORM_FIELDS;
      editingRecord: OvertimeRecord | null;
    };
    form?: {
      success?: boolean;
      error?: string;
    };
  }

  let { data, form }: Props = $props();

  // 是否为编辑模式
  let isEditMode = $derived(!!data.editingRecord);

  /**
   * 将服务端记录转换为本地表单数据
   * @param r - 加班记录
   */
  function recordToFormData(r: OvertimeRecord): FormData {
    const toLocal = (iso: string) => {
      if (!iso) return '';
      const date = new Date(iso);
      const offset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    };
    return {
      applicantName: r.applicantName,
      department: r.department || '',
      position: r.position || '',
      startTime: toLocal(r.startTime),
      endTime: toLocal(r.endTime),
      reason: r.reason,
    };
  }

  let currentFormData = $state<FormData>(
    data.editingRecord ? recordToFormData(data.editingRecord) : {},
  );

  // 校验错误信息
  let errors = $state<Record<string, string>>({});
  let initialized = $state(false);

  // 编辑模式同步
  let syncedFromServer = $state(!!data.editingRecord);
  $effect(() => {
    if (!syncedFromServer && data.editingRecord) {
      currentFormData = recordToFormData(data.editingRecord);
      syncedFromServer = true;
    }
  });

  // ---- 加班时长计算 ----
  let duration = $derived.by(() => {
    const s = currentFormData.startTime;
    const e = currentFormData.endTime;
    if (s && e) {
      const start = new Date(s);
      const end = new Date(e);
      if (end > start) return calculateDuration(s, e);
    }
    return 0;
  });

  let durationDisplay = $derived(duration > 0 ? formatDuration(duration) : '');
  // ------------------------

  // ---- 表单校验 ----
  /**
   * 执行完整校验
   * @returns 是否校验通过
   */
  function doValidate(): boolean {
    const result = validateAll(data.formFields, currentFormData, {
      reason: validateReasonLength,
      endTime: validateTimeRange,
    });

    errors = result.errors;

    // 校验失败时滚动到第一个错误字段
    if (!result.valid) {
      const firstField = Object.keys(result.errors)[0];
      if (firstField) {
        const el = document.getElementById(firstField);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)?.focus?.();
        }
      }
    }

    return result.valid;
  }
  // ------------------

  // 字段变化时清除该字段的错误
  function handleFieldChange(name: string, _value: string) {
    if (errors[name]) {
      errors = { ...errors, [name]: undefined };
    }
  }

  onMount(() => {
    // 编辑模式：记录 id 写入 sessionStorage
    if (browser && data.editingRecord) {
      sessionStorage.setItem(EDITING_ID_KEY, data.editingRecord.id);
    }

    // 新增模式：从 sessionStorage 恢复草稿
    if (!data.editingRecord && browser) {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          currentFormData = JSON.parse(saved);
        } catch {
          currentFormData = {};
        }
      }
    }

    initialized = true;

    // 从预览页返回时，滚动到指定字段
    const editField = $page.url.searchParams.get('edit');
    if (editField) {
      requestAnimationFrame(() => {
        const el = document.getElementById(editField);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null)?.focus?.();
        }
      });
    }
  });

  // 数据变化时自动暂存到 sessionStorage
  $effect(() => {
    if (!browser || !initialized || isEditMode) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(currentFormData));
  });

  // 提交成功后清除草稿并跳转
  $effect(() => {
    if (form?.success) {
      if (browser) {
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(EDITING_ID_KEY);
      }
      goto('/');
    }
  });

  function handleCancel() {
    if (browser) {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(EDITING_ID_KEY);
    }
    goto('/');
  }

  function handlePreview() {
    if (!doValidate()) return;
    if (browser) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(currentFormData));
    if (isEditMode && data.editingRecord && browser) {
      sessionStorage.setItem(EDITING_ID_KEY, data.editingRecord.id);
    }
    if (browser) sessionStorage.removeItem('overtime_form_auto_confirm');
    goto('/preview');
  }

  function handlePreviewAndConfirm() {
    if (!doValidate()) return;
    if (browser) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(currentFormData));
    if (isEditMode && data.editingRecord && browser) {
      sessionStorage.setItem(EDITING_ID_KEY, data.editingRecord.id);
    }
    if (browser) sessionStorage.setItem('overtime_form_auto_confirm', '1');
    goto('/preview');
  }

  // 提交拦截
  function handleFormSubmit(event: SubmitEvent) {
    if (!doValidate()) {
      event.preventDefault();
    }
  }
</script>

<svelte:head>
  <title>{isEditMode ? '编辑加班申请' : '新建加班申请'}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- 顶部导航 -->
  <header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
    <div class="max-w-4xl mx-auto px-4 py-4">
      <div class="flex items-center gap-4">
        <button
          onclick={handleCancel}
          class="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 class="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span>{isEditMode ? '✏️' : '📝'}</span>
          {isEditMode ? '编辑加班申请' : '新建加班申请'}
        </h1>
      </div>
    </div>
  </header>

  {#if isEditMode && data.editingRecord?.status === 'rejected'}
    <div class="bg-orange-50 border-b border-orange-200">
      <div class="max-w-4xl mx-auto px-4 py-3">
        <p class="text-orange-700 text-sm flex items-center gap-2">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
            />
          </svg>
          该申请曾被驳回，保存后将重新进入待审批状态
        </p>
      </div>
    </div>
  {/if}

  <!-- 主内容 -->
  <main class="max-w-4xl mx-auto px-4 py-6 pb-32">
    <form
      method="POST"
      action={isEditMode ? '?/update' : '?/create'}
      use:enhance
      onsubmit={handleFormSubmit}
      id="dynamic-form"
      class="space-y-6"
    >
      {#if isEditMode && data.editingRecord}
        <input type="hidden" name="id" value={data.editingRecord.id} />
      {/if}

      <DynamicForm
        fields={data.formFields}
        initialData={currentFormData}
        bind:data={currentFormData}
        {errors}
        onChange={handleFieldChange}
      />

      {#each Object.entries(currentFormData) as [key, value]}
        <input type="hidden" name={key} {value} />
      {/each}
    </form>

    <!-- 加班时长提示 -->
    {#if duration > 0}
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-6">
        <p class="text-blue-800 text-sm">
          <span class="font-medium">加班时长：</span>{durationDisplay}
        </p>
        {#if duration > 8}
          <p class="text-amber-600 text-xs mt-1 flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            加班时长超过8小时，请确认是否必要
          </p>
        {/if}
      </div>
    {/if}

    <!-- 操作按钮 -->
    <div class="flex gap-3 mt-6">
      <button
        type="button"
        onclick={handleCancel}
        class="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors cursor-pointer"
      >
        取消
      </button>
      <button
        type="button"
        onclick={handlePreview}
        class="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
      >
        预览
      </button>
      <button
        type="button"
        onclick={handlePreviewAndConfirm}
        class="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
      >
        {isEditMode ? '保存修改' : '提交申请'}
      </button>
    </div>
  </main>
</div>
