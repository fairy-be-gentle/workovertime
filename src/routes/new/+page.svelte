<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import DynamicForm from '$lib/components/DynamicForm.svelte';
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

  // 是否为编辑模式（通过 ?id=xxx 进入）
  let isEditMode = $derived(!!data.editingRecord);

  // 编辑模式：用服务端加载的记录初始化；新增模式：空对象起步
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
      reason: r.reason
    };
  }

  let currentFormData = $state<FormData>(
    data.editingRecord ? recordToFormData(data.editingRecord) : {}
  );

  let formApi = $state<{ validate: () => boolean }>({ validate: () => false });
  let initialized = $state(false);

  // 编辑模式下：服务端数据到达时，把当前表单同步到 DynamicForm（其内部 formData 是初始化时的一次快照）
  let syncedFromServer = $state(!!data.editingRecord);
  $effect(() => {
    if (!syncedFromServer && data.editingRecord) {
      currentFormData = recordToFormData(data.editingRecord);
      syncedFromServer = true;
    }
  });

  onMount(() => {
    // 编辑模式：把记录 id 写入 sessionStorage，供预览页回带
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

    // 从预览页返回时，根据 ?edit=xxx 滚动到对应字段
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

  // 新增模式下：数据变化时自动暂存到 sessionStorage
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
    if (!formApi.validate()) return;
    if (browser) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(currentFormData));
    if (isEditMode && data.editingRecord && browser) {
      sessionStorage.setItem(EDITING_ID_KEY, data.editingRecord.id);
    }
    // 清除可能残留的"快速通道"标志，让预览页停留供浏览/修改
    if (browser) sessionStorage.removeItem('overtime_form_auto_confirm');
    goto('/preview');
  }

  function handlePreviewAndConfirm() {
    if (!formApi.validate()) return;
    if (browser) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(currentFormData));
    if (isEditMode && data.editingRecord && browser) {
      sessionStorage.setItem(EDITING_ID_KEY, data.editingRecord.id);
    }
    // 标记进入预览后立即走确认提交（预览页识别后会自动触发 handleConfirm）
    if (browser) sessionStorage.setItem('overtime_form_auto_confirm', '1');
    goto('/preview');
  }

  // 提交拦截（校验失败时阻止 form 提交）
  function handleFormSubmit(event: SubmitEvent) {
    if (!formApi.validate()) {
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
        <button onclick={handleCancel} class="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
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
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
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
        bind:formApi
      />

      {#each Object.entries(currentFormData) as [key, value]}
        <input type="hidden" name={key} {value} />
      {/each}
    </form>

    <!-- 操作按钮 -->
    <div class="flex gap-3 mt-6">
      <button
        type="button"
        onclick={handleCancel}
        class="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
      >
        取消
      </button>
      <button
        type="button"
        onclick={handlePreview}
        class="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
      >
        预览
      </button>
      <button
        type="button"
        onclick={handlePreviewAndConfirm}
        class="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
      >
        {isEditMode ? '保存修改' : '提交申请'}
      </button>
    </div>
  </main>
</div>
