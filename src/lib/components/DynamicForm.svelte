<!-- 新增编辑页 -->
<script lang="ts">
  import type { FormField, FormData } from '$lib/storage';
  import { calculateDuration, formatDuration } from '$lib/storage';

interface Props {
  /** 字段配置列表（服务端可注入） */
  fields: FormField[];
  /** 初始数据（编辑时传入） */
  initialData?: FormData;
  /** 是否只读 */
  readOnly?: boolean;
  /** 取消回调 */
  onCancel?: () => void;
  /** 提交按钮文字 */
  submitLabel?: string;
  /** 暴露给外部的校验 API（通过 bind:formApi 使用） */
  formApi?: { validate: () => boolean };
  /** 双向绑定的表单数据（父组件通过 bind:data 传入） */
  data?: FormData;
}

let {
  fields,
  initialData = {},
  readOnly = false,
  onCancel,
  submitLabel = '提交',
  formApi = $bindable(),
  data = $bindable()
}: Props = $props();

  // 表单数据：bind:data 时直接使用父组件传入的响应式对象，
  // 未传时退化到本地 $state（用 initialData 初始化）。
  let formData = $state<FormData>({ ...initialData });
  if (data) {
    formData = data;
  }

  // 父组件 bind:data 时，外部 data 引用变化（如父组件从 sessionStorage 恢复草稿）
  // 需要把 formData 重新指向最新的 data proxy（保持双向绑定）。
  $effect(() => {
    if (data && data !== formData) {
      formData = data;
    }
  });

  let errors = $state<Record<string, string>>({});

  // ---- datetime 字段：通过 .has-value 控制 placeholder 显示 ----
  let datetimeRefs = $state<Record<string, HTMLInputElement | null>>({});
  function updateDatetimeHasValue(name: string) {
    const el = datetimeRefs[name];
    if (!el) return;
    if (el.value) el.classList.add('has-value');
    else el.classList.remove('has-value');
  }

  // 初始时同步一次（编辑模式下 initialData 已含值）。
  // 推迟到微任务执行，确保 bind:value 的 render effect 先完成（el.value 已写入），
  // 否则会读到空值导致 .has-value class 不加，placeholder 不消失。
  $effect(() => {
    queueMicrotask(() => {
      for (const f of fields) {
        if (f.type === 'datetime') updateDatetimeHasValue(f.name);
      }
    });
  });
  // ---- 计算加班时长 ----
  let duration = $derived.by(() => {
    const s = formData.startTime;
    const e = formData.endTime;
    if (s && e) {
      const start = new Date(s);
      const end = new Date(e);
      if (end > start) return calculateDuration(s, e);
    }
    return 0;
  });

  let now = $derived(new Date().toISOString().slice(0, 16));

  // ---- 字段级校验 ----
  function validateField(name: string): boolean {
    const field = fields.find(f => f.name === name);
    if (!field) return true;

    errors = { ...errors, [name]: undefined };
    const value = (formData[name] ?? '').toString().trim();

    if (field.required && !value) {
      errors = { ...errors, [name]: `请填写${field.label}` };
      return false;
    }

    if (name === 'reason' && value.length > 0 && value.length < 5) {
      errors = { ...errors, [name]: '加班事由至少需要5个字符' };
      return false;
    }

    return true;
  }

  // ---- 完整校验 ----
  function validateAll(): boolean {
    let valid = true;
    const newErrors: Record<string, string> = {};

    for (const field of fields) {
      const value = (formData[field.name] ?? '').toString().trim();
      if (field.required && !value) {
        newErrors[field.name] = `请填写${field.label}`;
        valid = false;
      }
      if (field.name === 'reason' && value.length > 0 && value.length < 5) {
        newErrors[field.name] = '加班事由至少需要5个字符';
        valid = false;
      }
    }

    // 跨字段：结束时间 > 开始时间
    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
        newErrors.endTime = '结束时间必须大于开始时间';
        valid = false;
      }
    }

    errors = newErrors;

    // 校验失败时滚动到第一个错误字段
    if (!valid) {
      const firstErrorField = Object.keys(newErrors)[0];
      if (firstErrorField) {
        const el = document.getElementById(firstErrorField);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)?.focus?.();
        }
      }
    }

    return valid;
  }

  // 将校验方法暴露给父组件
  $effect(() => {
    if (formApi) {
      formApi.validate = () => validateAll();
    }
  });

  // ---- 提交（由外部原生 form 触发，此处仅做校验） ----
  function handleSubmit() {
    if (readOnly) return;
    validateAll();
  }

  // ---- 将 half 字段分组渲染（每组最多两个并排） ----
  // 先过滤出非 half 的独立字段，half 字段按 group 合并
  let independentFields = $derived(fields.filter(f => !f.half));
  let halfFieldGroups = $derived.by(() => {
    const groups: FormField[][] = [];
    const halfFields = fields.filter(f => f.half);
    let current: FormField[] = [];

    for (const f of halfFields) {
      if (!current.length) {
        current.push(f);
      } else if (current[0].group === f.group && current.length < 2) {
        current.push(f);
      } else {
        groups.push(current);
        current = [f];
      }
    }
    if (current.length) groups.push(current);
    return groups;
  });
</script>

<div class="space-y-5">
  <!-- 独立字段（非 half，逐行渲染） -->
  {#each independentFields as field (field.name)}
    <div>
      <label for={field.name} class="block text-sm font-medium text-gray-700 mb-1">
        {field.label}{#if field.required}<span class="text-red-500">*</span>{/if}
      </label>

      {#if field.type === 'text'}
        <input
          id={field.name}
          type="text"
          bind:value={formData[field.name]}
          onblur={() => validateField(field.name)}
          placeholder={field.placeholder}
          disabled={readOnly}
          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
            {errors[field.name] ? 'border-red-500 bg-red-50' : 'border-gray-300'}
            {readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}"
        />
      {:else if field.type === 'textarea'}
        <textarea
          id={field.name}
          bind:value={formData[field.name]}
          onblur={() => validateField(field.name)}
          rows={field.rows ?? 3}
          maxlength={field.maxLength}
          placeholder={field.placeholder}
          disabled={readOnly}
          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none
            {errors[field.name] ? 'border-red-500 bg-red-50' : 'border-gray-300'}
            {readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}"
        ></textarea>
        <div class="flex justify-between mt-1">
          {#if errors[field.name]}
            <p class="text-sm text-red-600">{errors[field.name]}</p>
          {:else}
            <span></span>
          {/if}
          {#if field.maxLength}
            <p class="text-sm text-gray-400">{formData[field.name]?.length ?? 0} / {field.maxLength}</p>
          {/if}
        </div>
      {:else if field.type === 'select'}
        <select
          id={field.name}
          bind:value={formData[field.name]}
          onblur={() => validateField(field.name)}
          disabled={readOnly}
          class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm
            {errors[field.name] ? 'border-red-500 bg-red-50' : 'border-gray-300'}
            {readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}"
        >
          <option value="">{field.placeholder ?? '请选择'}</option>
          {#each field.options ?? [] as option}
            <option value={option}>{option}</option>
          {/each}
        </select>
      {:else if field.type === 'datetime'}
        <div class="relative">
          <input
            id={field.name}
            type="datetime-local"
            bind:value={formData[field.name]}
            bind:this={datetimeRefs[field.name]}
            onkeydown={(e) => {
              // 阻止键盘输入：保留方向键/Tab/Enter 让焦点导航可用，
              // 其他字符键 preventDefault——避免用户通过键盘修改值
              const allow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Escape', 'Backspace', 'Delete'];
              if (!allow.includes(e.key)) e.preventDefault();
            }}
            oninput={() => updateDatetimeHasValue(field.name)}
            onchange={() => updateDatetimeHasValue(field.name)}
            onblur={() => { updateDatetimeHasValue(field.name); validateField(field.name); }}
            placeholder={field.placeholder}
            min={now}
            disabled={readOnly}
            class="datetime-input w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm
              {errors[field.name] ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-blue-400'}
              {readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}"
          />
          {#if !readOnly}
            <span
              data-placeholder-for={field.name}
              class="datetime-placeholder pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none"
            >
              {field.placeholder ?? '请选择'}
            </span>
          {/if}
          {#if !readOnly}
            <span
              aria-hidden="true"
              class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
          {/if}
        </div>
      {/if}

      {#if errors[field.name] && field.type !== 'textarea'}
        <p class="mt-1 text-sm text-red-600">{errors[field.name]}</p>
      {/if}
    </div>
  {/each}

  <!-- 半宽字段组（每组最多两个并排） -->
  {#each halfFieldGroups as group}
    <div class="grid gap-4" style="grid-template-columns: repeat({group.length}, 1fr);">
      {#each group as field (field.name)}
        <div>
          <label for={field.name} class="block text-sm font-medium text-gray-700 mb-1">
            {field.label}{#if field.required}<span class="text-red-500">*</span>{/if}
          </label>

          {#if field.type === 'select'}
            <select
              id={field.name}
              bind:value={formData[field.name]}
              onblur={() => validateField(field.name)}
              disabled={readOnly}
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm
                {errors[field.name] ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                {readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}"
            >
              <option value="">{field.placeholder ?? '请选择'}</option>
              {#each field.options ?? [] as option}
                <option value={option}>{option}</option>
              {/each}
            </select>
          {:else if field.type === 'datetime'}
            <div class="relative">
              <input
                id={field.name}
                type="datetime-local"
                bind:value={formData[field.name]}
                bind:this={datetimeRefs[field.name]}
                onkeydown={(e) => {
                  // 阻止键盘输入：保留方向键/Tab/Enter 让焦点导航可用，
                  // 其他字符键 preventDefault
                  const allow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Escape', 'Backspace', 'Delete'];
                  if (!allow.includes(e.key)) e.preventDefault();
                }}
                oninput={() => updateDatetimeHasValue(field.name)}
                onblur={() => { updateDatetimeHasValue(field.name); validateField(field.name); }}
                placeholder={field.placeholder}
                min={field.name === 'endTime' ? (formData.startTime || now) : now}
                disabled={readOnly}
                class="datetime-input w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm
                  {errors[field.name] ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-blue-400'}
                  {readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}"
              />
              {#if !readOnly && !formData[field.name]}
                <span
                  class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none"
                >
                  {field.placeholder ?? '请选择'}
                </span>
              {/if}
              {#if !readOnly}
                <span
                  aria-hidden="true"
                  class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
              {/if}
            </div>
          {/if}

          {#if errors[field.name]}
            <p class="mt-1 text-sm text-red-600">{errors[field.name]}</p>
          {/if}
        </div>
      {/each}
    </div>
  {/each}

  <!-- 计算加班时长提示 -->
  {#if duration > 0}
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <p class="text-blue-800 text-sm">
        <span class="font-medium">加班时长：</span>{formatDuration(duration)}
      </p>
      {#if duration > 8}
        <p class="text-amber-600 text-xs mt-1 flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          加班时长超过8小时，请确认是否必要
        </p>
      {/if}
    </div>
  {/if}

  <!-- 操作按钮（外部可通过 onCancel/onSubmit 触发） -->
  {#if onCancel || !readOnly}
    <div class="flex gap-3 pt-2">
      {#if onCancel}
        <button
          type="button"
          onclick={onCancel}
          class="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
        >
          取消
        </button>
      {/if}
      <!-- {#if !readOnly}
        <button
          type="submit"
          onclick={handleSubmit}
          class="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          {submitLabel}
        </button>
      {/if} -->
    </div>
  {/if}
</div>

<style>
  /* 隐藏 datetime-local 浏览器原生的 "yyyy/mm/dd hh:mm" 占位文字。
     datetime-local 是替换元素，::placeholder 选择器对它无效，
     但 ::-webkit-datetime-edit-* 系列可以控制内部 segment 文字。
     空值时把所有 segment 文字色设为 transparent，让原生占位消失。 */
  :global(.datetime-input:not(.has-value))::-webkit-datetime-edit,
  :global(.datetime-input:not(.has-value))::-webkit-datetime-edit-fields-wrapper,
  :global(.datetime-input:not(.has-value))::-webkit-datetime-edit-text,
  :global(.datetime-input:not(.has-value))::-webkit-datetime-edit-month-field,
  :global(.datetime-input:not(.has-value))::-webkit-datetime-edit-day-field,
  :global(.datetime-input:not(.has-value))::-webkit-datetime-edit-year-field,
  :global(.datetime-input:not(.has-value))::-webkit-datetime-edit-hour-field,
  :global(.datetime-input:not(.has-value))::-webkit-datetime-edit-minute-field,
  :global(.datetime-input:not(.has-value))::-webkit-datetime-edit-ampm-field {
    color: transparent;
  }
  /* 隐藏浏览器原生的下拉箭头（保留点击区域，只是不显示图标）。
     position: absolute; inset: 0 让 indicator 覆盖整个 input，
     配合 background: transparent / color: transparent 让原生图标完全不可见。 */
  :global(.datetime-input)::-webkit-calendar-picker-indicator {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: auto;
    height: auto;
    color: transparent;
    background: transparent;
    cursor: pointer;
    opacity: 0;
  }
  /* 隐藏 segment 编辑时的 caret，避免视觉上"选中"的感受 */
  :global(.datetime-input) {
    caret-color: transparent;
  }
  /* input 有值时，隐藏自定义 placeholder span */
  :global(.datetime-input.has-value) ~ .datetime-placeholder {
    display: none;
  }
</style>
