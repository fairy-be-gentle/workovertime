<script lang="ts">
  import type { FormField, FormData } from '$lib/storage';

  /**
   * DynamicForm - 通用动态表单组件
   *
   * 纯 UI 组件，只负责渲染表单和用户输入，不包含任何业务逻辑。
   * 校验规则由父组件通过 onValidate 回调处理。
   *
   * @example
   * ```svelte
   * <DynamicForm
   *   {fields}
   *   bind:data={formData}
   *   bind:errors
   *   onValidate={handleValidate}
   * />
   * ```
   */
  interface Props {
    /** 字段配置列表 */
    fields: FormField[];
    /** 初始数据（编辑时传入） */
    initialData?: FormData;
    /** 只读模式 */
    readOnly?: boolean;
    /** 取消回调 */
    onCancel?: () => void;
    /** 外部传入的字段错误信息映射 */
    errors?: Record<string, string>;
    /** 双向绑定的表单数据 */
    data?: FormData;
    /** 字段值变化时的回调（用于父组件触发校验） */
    onChange?: (name: string, value: string) => void;
  }

  let {
    fields,
    initialData = {},
    readOnly = false,
    onCancel,
    errors = {},
    data = $bindable(),
    onChange,
  }: Props = $props();

  // 表单数据初始化
  let formData = $state<FormData>({ ...initialData });
  if (data) {
    formData = data;
  }

  // 同步外部 data 变化
  $effect(() => {
    if (data && data !== formData) {
      formData = data;
    }
  });

  // 同步外部 errors 变化
  let currentErrors = $state<Record<string, string>>({ ...errors });
  $effect(() => {
    currentErrors = { ...errors };
  });

  // datetime 字段 DOM 引用
  let datetimeRefs = $state<Record<string, HTMLInputElement | null>>({});

  function updateDatetimeHasValue(name: string) {
    const el = datetimeRefs[name];
    if (!el) return;
    el.value ? el.classList.add('has-value') : el.classList.remove('has-value');
  }

  // 初始化时同步 placeholder
  $effect(() => {
    queueMicrotask(() => {
      for (const f of fields) {
        if (f.type === 'datetime') updateDatetimeHasValue(f.name);
      }
    });
  });

  let now = $derived(new Date().toISOString().slice(0, 16));

  // 字段值变化时通知父组件
  function handleInput(name: string, value: string) {
    formData[name] = value;
    onChange?.(name, value);
  }

  // 半宽字段分组
  let independentFields = $derived(fields.filter((f) => !f.half));
  let halfFieldGroups = $derived.by(() => {
    const groups: FormField[][] = [];
    const halfFields = fields.filter((f) => f.half);
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
  <!-- 独成行的表单走这里 -->
  {#each independentFields as field (field.name)}
    <div>
      <label for={field.name} class="block text-sm font-medium text-gray-700 mb-1">
        {field.label}{#if field.required}<span class="text-red-500">*</span>{/if}
      </label>

      {#if field.type === 'text'}
        <input
          id={field.name}
          type="text"
          value={formData[field.name] ?? ''}
          oninput={(e) => handleInput(field.name, e.currentTarget.value)}
          placeholder={field.placeholder}
          disabled={readOnly}
          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
            {currentErrors[field.name] ? 'border-red-500 bg-red-50' : 'border-gray-300'}
            {readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}"
        />
      {:else if field.type === 'textarea'}
        <textarea
          id={field.name}
          value={formData[field.name] ?? ''}
          oninput={(e) => handleInput(field.name, e.currentTarget.value)}
          rows={field.rows ?? 3}
          maxlength={field.maxLength}
          placeholder={field.placeholder}
          disabled={readOnly}
          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none
            {currentErrors[field.name] ? 'border-red-500 bg-red-50' : 'border-gray-300'}
            {readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}"
        ></textarea>
        <div class="flex justify-between mt-1">
          {#if currentErrors[field.name]}
            <p class="text-sm text-red-600">{currentErrors[field.name]}</p>
          {:else}
            <span></span>
          {/if}
          {#if field.maxLength}
            <p class="text-sm text-gray-400">
              {formData[field.name]?.length ?? 0} / {field.maxLength}
            </p>
          {/if}
        </div>
      {:else if field.type === 'select'}
        <select
          id={field.name}
          value={formData[field.name] ?? ''}
          onchange={(e) => handleInput(field.name, e.currentTarget.value)}
          disabled={readOnly}
          class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm
            {currentErrors[field.name] ? 'border-red-500 bg-red-50' : 'border-gray-300'}
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
            value={formData[field.name] ?? ''}
            bind:this={datetimeRefs[field.name]}
            onkeydown={(e) => {
              const allow = [
                'ArrowUp',
                'ArrowDown',
                'ArrowLeft',
                'ArrowRight',
                'Tab',
                'Enter',
                'Escape',
                'Backspace',
                'Delete',
              ];
              if (!allow.includes(e.key)) e.preventDefault();
            }}
            oninput={(e) => {
              updateDatetimeHasValue(field.name);
              handleInput(field.name, e.currentTarget.value);
            }}
            onchange={(e) => {
              updateDatetimeHasValue(field.name);
              handleInput(field.name, e.currentTarget.value);
            }}
            placeholder={field.placeholder}
            min={now}
            disabled={readOnly}
            class="datetime-input w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm
              {currentErrors[field.name]
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 hover:border-blue-400'}
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </span>
          {/if}
        </div>
      {/if}

      {#if currentErrors[field.name] && field.type !== 'textarea'}
        <p class="mt-1 text-sm text-red-600">{currentErrors[field.name]}</p>
      {/if}
    </div>
  {/each}

  <!-- 因样式需求，需要放在一排的表单可以走这里 -->
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
              value={formData[field.name] ?? ''}
              onchange={(e) => handleInput(field.name, e.currentTarget.value)}
              disabled={readOnly}
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm
                {currentErrors[field.name] ? 'border-red-500 bg-red-50' : 'border-gray-300'}
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
                value={formData[field.name] ?? ''}
                bind:this={datetimeRefs[field.name]}
                onkeydown={(e) => {
                  const allow = [
                    'ArrowUp',
                    'ArrowDown',
                    'ArrowLeft',
                    'ArrowRight',
                    'Tab',
                    'Enter',
                    'Escape',
                    'Backspace',
                    'Delete',
                  ];
                  if (!allow.includes(e.key)) e.preventDefault();
                }}
                oninput={(e) => {
                  updateDatetimeHasValue(field.name);
                  handleInput(field.name, e.currentTarget.value);
                }}
                onchange={(e) => {
                  updateDatetimeHasValue(field.name);
                  handleInput(field.name, e.currentTarget.value);
                }}
                placeholder={field.placeholder}
                min={field.name === 'endTime' ? formData.startTime || now : now}
                disabled={readOnly}
                class="datetime-input w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm
                  {currentErrors[field.name]
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 hover:border-blue-400'}
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </span>
              {/if}
            </div>
          {/if}

          {#if currentErrors[field.name]}
            <p class="mt-1 text-sm text-red-600">{currentErrors[field.name]}</p>
          {/if}
        </div>
      {/each}
    </div>
  {/each}

  <!-- 操作按钮 -->
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
    </div>
  {/if}
</div>

<style>
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

  :global(.datetime-input) {
    caret-color: transparent;
  }

  :global(.datetime-input.has-value) ~ .datetime-placeholder {
    display: none;
  }
</style>
