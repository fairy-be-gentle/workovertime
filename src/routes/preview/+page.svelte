<script lang="ts">
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { formatDateTime, formatDuration, calculateDuration } from '$lib/storage';
  import type { OvertimeFormData } from '$lib/types';

  const STORAGE_KEY = 'overtime_form_draft';
  const EDITING_ID_KEY = 'overtime_form_editing_id';
  const AUTO_CONFIRM_KEY = 'overtime_form_auto_confirm';

  let formData = $state<OvertimeFormData>({
    applicantName: '',
    department: '',
    position: '',
    startTime: '',
    endTime: '',
    reason: ''
  });

  let duration = $derived(calculateDuration(formData.startTime, formData.endTime));

  // 从 sessionStorage 恢复数据
  onMount(() => {
    if (browser) {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          formData = JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved form data');
        }
      }

      // 若来自"提交申请/保存修改"的快速通道，跳过预览直接提交
      if (sessionStorage.getItem(AUTO_CONFIRM_KEY) === '1') {
        sessionStorage.removeItem(AUTO_CONFIRM_KEY);
        // 留一帧让 formData 渲染稳定
        requestAnimationFrame(() => handleConfirm());
      }
    }
  });

  function goBack() {
    const editingId = browser ? sessionStorage.getItem(EDITING_ID_KEY) : null;
    goto(editingId ? `/new?id=${editingId}` : '/new');
  }

  function scrollToField(field: string) {
    // 保存当前数据到 sessionStorage
    if (browser) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      // 编辑模式下回退要把记录的 id 一并带上，便于 /new 页加载并回填该记录的数据
      const editingId = sessionStorage.getItem(EDITING_ID_KEY);
      if (editingId) {
        goto(`/new?id=${editingId}&edit=${field}`);
        return;
      }
    }
    goto(`/new?edit=${field}`);
  }

  function handleConfirm() {
    const editingId = browser ? sessionStorage.getItem(EDITING_ID_KEY) : null;
    const action = editingId ? '/new?/update' : '/new?/create';

    // 提交前先把草稿清除：服务端会 redirect 到首页，无需保留
    if (browser) {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(EDITING_ID_KEY);
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = action;

    if (editingId) {
      const idInput = document.createElement('input');
      idInput.type = 'hidden';
      idInput.name = 'id';
      idInput.value = editingId;
      form.appendChild(idInput);
    }

    const fields: (keyof OvertimeFormData)[] = ['applicantName', 'department', 'position', 'startTime', 'endTime', 'reason'];
    fields.forEach(key => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = formData[key];
      form.appendChild(input);
    });

    document.body.appendChild(form);
    // 服务端 action 返回 redirect(303, '/')，浏览器会跟随到首页
    form.submit();
  }
</script>

<svelte:head>
  <title>预览申请</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-green-50 to-teal-50">
  <!-- 顶部导航 -->
  <header class="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-10">
    <div class="max-w-2xl mx-auto px-4 py-4">
      <div class="flex items-center gap-4">
        <button onclick={goBack} class="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span>👁️</span>
          预览申请
        </h1>
      </div>
    </div>
  </header>

  <!-- 提示横幅 -->
  <div class="bg-amber-50 border-b border-amber-200">
    <div class="max-w-2xl mx-auto px-4 py-3">
      <p class="text-amber-700 text-sm flex items-center gap-2">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        请确认以下信息，点击字段可返回修改
      </p>
    </div>
  </div>

  <!-- 主内容 -->
  <main class="max-w-2xl mx-auto px-4 py-6 space-y-4">
    <!-- 申请人 -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <h3 class="text-sm text-gray-500 mb-1 flex items-center gap-2">
        申请人
      </h3>
      <p class="text-xl font-semibold text-gray-800">{formData.applicantName}</p>
      <button 
        onclick={() => scrollToField('applicantName')}
        class="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        修改
      </button>
    </div>

    <!-- 部门和职位 -->
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
        <h3 class="text-sm text-gray-500 mb-1 flex items-center gap-2">
          部门
        </h3>
        <p class="font-medium text-gray-800">{formData.department || '未填写'}</p>
        <button 
          onclick={() => scrollToField('department')}
          class="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          修改
        </button>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
        <h3 class="text-sm text-gray-500 mb-1 flex items-center gap-2">
          职位
        </h3>
        <p class="font-medium text-gray-800">{formData.position || '未填写'}</p>
        <button 
          onclick={() => scrollToField('position')}
          class="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          修改
        </button>
      </div>
    </div>

    <!-- 加班时间 -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <h3 class="text-sm text-gray-500 mb-3 flex items-center gap-2">
        加班时间
      </h3>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="text-xs text-gray-400 mb-1">开始时间</p>
          <p class="font-medium text-gray-800">{formatDateTime(formData.startTime)}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400 mb-1">结束时间</p>
          <p class="font-medium text-gray-800">{formatDateTime(formData.endTime)}</p>
        </div>
      </div>
      <button 
        onclick={() => scrollToField('startTime')}
        class="mt-4 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        修改时间
      </button>
    </div>

    <!-- 加班时长 -->
    {#if duration > 0}
      <div class="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6 border border-green-100">
        <h3 class="text-sm text-green-600 mb-2 flex items-center gap-2 font-medium">
          加班时长
        </h3>
        <p class="text-3xl font-bold text-green-700">{formatDuration(duration)}</p>
      </div>
    {/if}

    <!-- 加班事由 -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <h3 class="text-sm text-gray-500 mb-2 flex items-center gap-2">
        加班事由
      </h3>
      <p class="text-gray-800 leading-relaxed whitespace-pre-wrap">{formData.reason}</p>
      <button 
        onclick={() => scrollToField('reason')}
        class="mt-4 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        修改事由
      </button>
    </div>
  </main>

  <!-- 底部操作栏 -->
  <div class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-4">
    <div class="max-w-2xl mx-auto flex gap-3">
      <button
        onclick={goBack}
        class="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        返回修改
      </button>
      <button
        onclick={handleConfirm}
        class="flex-1 py-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        确认提交
      </button>
    </div>
  </div>
</div>
