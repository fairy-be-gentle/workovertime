# 高级前端工程师面试题 - 加班申请系统

> 本面试题基于 SvelteKit + TypeScript + TailwindCSS 技术栈设计，考察候选人对 Svelte 5 Runes、SvelteKit SSR、TypeScript 类型系统、组件架构、性能优化等核心概念的深度理解。

## 目录

1. [Svelte 5 与 Runes 语法](#一-svelte-5-与-runes-语法)
2. [SvelteKit 框架与 SSR](#二-sveltekit-框架与-ssr)
3. [TypeScript 类型系统](#三-typescript-类型系统)
4. [组件架构设计](#四-组件架构设计)
5. [表单验证](#五-表单验证)
6. [状态管理](#六-状态管理)
7. [数据可视化](#七-数据可视化)
8. [性能优化](#八-性能优化)
9. [测试](#九-测试)
10. [实际编码题](#十-实际编码题)

---

## 一、Svelte 5 与 Runes 语法

### Q1. Svelte 5 Runes 核心概念

**题目：** 分析 `DynamicForm.svelte` 中的 `$props()` 和 `$bindable()` 使用方式。

**参考答案：**

#### `$props()` vs `export let` 的改进

```typescript
// Svelte 4 写法
export let name: string;
export let age: number = 0; // 带默认值

// Svelte 5 写法
let { name, age = 0 } = $props();
```

| 特性     | Svelte 4     | Svelte 5             |
| -------- | ------------ | -------------------- |
| 声明方式 | `export let` | `let { } = $props()` |
| 默认值   | 原生支持     | 原地解构赋值         |
| 响应式   | 隐式追踪     | 显式控制             |
| 类型推断 | 需额外配置   | 自动推断             |
| 导出控制 | 有限制       | 更灵活               |

#### `$bindable()` 的使用场景

```typescript
// 父组件
let formRef = $state();
// 通过 bind:formRef 双向绑定

// 子组件
let { value = $bindable() } = $props();
```

**适用场景：**

- 表单组件需要双向绑定值
- 组件需要向父组件回传复杂数据
- 需要遵循 React-style 的 `value + onChange` 模式

#### `DynamicForm.svelte` 中的设计考量

```typescript
((formApi = $bindable()), // 暴露验证方法给父组件
  (data = $bindable())); // 双向绑定表单数据
```

**设计考量：**

1. **解耦验证逻辑**：将 `validateAll()` 方法暴露给父组件，避免组件内部直接操作表单提交
2. **数据同步**：通过 bindable 实现父子组件数据实时同步
3. **灵活性**：父组件可以控制何时触发验证，而不是在表单内部自动触发
4. **可测试性**：父组件可以直接调用 `formApi.validate()` 进行单元测试

---

### Q2. 响应式状态管理

**题目：** 解释 `$state`、`$derived`、`$effect` 的区别及适用场景。

**参考答案：**

#### `$state` vs `$derived` 的区别

```typescript
// $state - 可变的响应式状态
let count = $state(0);
count++; // 可以直接修改

// $derived - 派生的只读状态
let doubled = $derived(count * 2);
// doubled 会自动根据 count 变化而变化，不能直接赋值
```

| 特性     | `$state`           | `$derived`                 |
| -------- | ------------------ | -------------------------- |
| 可变性   | 可读写             | 只读                       |
| 更新方式 | 直接赋值           | 自动计算                   |
| 缓存     | 无                 | 有（依赖不变时不重新计算） |
| 适用场景 | 原始数据、用户输入 | 计算属性、聚合数据         |

#### `$effect` 同步外部 data 的原因

```typescript
// DynamicForm.svelte 中的实现
$effect(() => {
  if (data && data !== formData) {
    formData = data;
  }
});
```

**问题分析：**

1. **外部引用可能变化**：父组件可能从 sessionStorage 恢复草稿或从 API 获取新数据
2. **保持引用一致性**：避免父组件的 `data` 和子组件的 `formData` 指向不同对象
3. **避免 `data !== formData` 的情况**：
   - 父组件首次传递 `data` 时：`data` 是 undefined，`formData` 使用初始值
   - 父组件异步加载完成后传递：`data` 变成有值的对象

**去掉 `$effect` 可能导致的问题：**

- 父子组件数据不同步
- 编辑模式下无法加载已有数据
- 表单草稿恢复功能失效

---

### Q3. 派生状态与计算

**题目：** 对比 `$derived` 和 `$derived.by` 的区别及使用场景。

**参考答案：**

```typescript
// $derived - 适用于单表达式
let doubled = $derived(count * 2);

// $derived.by - 适用于多语句逻辑
let formatted = $derived.by(() => {
  const hours = Math.floor(count);
  const minutes = Math.round((count - hours) * 60);
  if (minutes === 0) return `${hours}小时`;
  return `${hours}小时${minutes}分钟`;
});
```

| 场景                         | 推荐使用             |
| ---------------------------- | -------------------- |
| 简单计算                     | `$derived`           |
| 复杂逻辑（多语句、条件判断） | `$derived.by`        |
| 需要调试中间值               | `$derived.by`        |
| 单一表达式                   | `$derived`（更简洁） |

**项目中的对比：**

| 组件                  | 使用方式      | 原因                       |
| --------------------- | ------------- | -------------------------- |
| `DynamicTable.svelte` | `$derived`    | 逻辑简单（直接计算 slice） |
| `DynamicForm.svelte`  | `$derived.by` | 需要条件判断和业务逻辑     |

---

## 二、SvelteKit 框架与 SSR

### Q4. 服务端与客户端分离

**题目：** 解释 `$lib/server` 目录的隔离机制及职责分离设计。

**参考答案：**

#### `$lib/server` 隔离机制

```
src/
├── lib/
│   ├── storage.ts           # 客户端工具（可被客户端打包）
│   ├── server/
│   │   └── storage.ts       # 服务端专用（禁止打包到客户端）
```

**实现原理：**

1. **Vite 插件处理**：`@sveltejs/kit/vite` 插件在打包时会扫描导入
2. **静态分析**：检测到 `$lib/server` 路径时，阻止其被打包
3. **服务端标记**：`server-only` 包的变体实现方式

**为什么需要隔离：**

```typescript
// ❌ 客户端代码不应包含这些
import { readFileSync, writeFileSync } from 'node:fs'; // Node.js 特有
import database from './database'; // 包含敏感信息

// ✅ 客户端代码应该是
import { browser } from '$app/environment';
import { localStorage } from '$lib/storage';
```

#### 职责分离设计

| 文件                | 职责                             | 运行环境      |
| ------------------- | -------------------------------- | ------------- |
| `storage.ts`        | 纯函数工具（计算、格式化、验证） | 客户端/服务端 |
| `server/storage.ts` | 文件读写、敏感操作               | 仅服务端      |

---

### Q5. SSR 与 Form Actions

**题目：** 解释 SSR 关闭场景、Form Actions 的 `enhance` 机制。

**参考答案：**

#### 何时关闭 SSR

```typescript
// src/routes/+page.ts
export const ssr = false;
```

**适用场景：**

1. **纯 SPA 应用**：不需要 SEO，不需要首屏 SEO 渲染
2. **需要 DOM/BOM**：大量使用 `window`、`document`、浏览器 API
3. **认证相关**：用户特定的内容在服务端无法提前渲染
4. **第三方 SDK**：某些 SDK 不支持 SSR

**关闭 SSR 的影响：**

| 影响     | 说明                                  |
| -------- | ------------------------------------- |
| 首屏渲染 | 空白 HTML → JS 加载 → 水合 → 显示内容 |
| SEO      | 无法被搜索引擎爬取                    |
| FCP      | 首次内容绘制延迟                      |
| 可访问性 | 依赖 JS 执行                          |

#### `load` 函数的生命周期

```typescript
export const load: PageServerLoad = async ({ fetch, params, url }) => {
  // 1. 服务端：首次访问时执行
  // 2. 客户端：导航时执行（CSR）
  // 3. 依赖项变化时可能重新执行
};
```

**执行时机：**

| 场景       | 执行环境        | 说明                        |
| ---------- | --------------- | --------------------------- |
| 首次访问   | 服务端 + 客户端 | 服务端获取数据 → 客户端水合 |
| 客户端导航 | 客户端          | CSR 模式，JSON 传输         |
| 重新验证   | 服务端          | `invalidate()` 后触发       |

#### Form Actions 的 `enhance` 机制

```svelte
<form method="POST" use:enhance>
  <!-- 自动处理： -->
  <!-- 1. 防止默认提交（页面跳转） -->
  <!-- 2. 显示 loading 状态 -->
  <!-- 3. 处理错误并显示 -->
  <!-- 4. 更新表单数据 -->
</form>
```

**工作流程：**

```
用户提交 → 拦截默认行为 → 发送 fetch 请求
    ↓
显示 loading 状态
    ↓
等待服务端响应
    ↓
更新 UI / 显示错误
```

---

## 三、TypeScript 类型系统

### Q6. 泛型与约束

**题目：** 解释 `<script lang="ts" generics="T extends Record<string, any> = Record<string, any>">` 的含义。

**参考答案：**

#### 声明解析

| 部分                          | 含义                           |
| ----------------------------- | ------------------------------ |
| `T`                           | 泛型参数名                     |
| `extends Record<string, any>` | 约束：必须是可索引对象         |
| `= Record<string, any>`       | 默认值：若不指定则使用默认类型 |

#### 更严格的约束设计

```typescript
// ❌ 宽松的约束
T extends Record<string, any>

// ✅ 更严格的约束 - 定义最小字段接口
interface BaseRow {
  id: string;
}

// 使用时
<script lang="ts" generics="T extends BaseRow">
  rows: T[];
  rowKey: (row: T) => string; // 保证每行有唯一标识
</script>

// ✅ 另一种方式 - 索引签名更精确
type ObjectWithStringKeys<T> = {
  [K in keyof T as string extends K ? never : K]: T[K];
};
```

#### `ColumnDef<T>` 类型设计

```typescript
export interface ColumnDef<T> {
  key: keyof T; // 键必须存在于 T 中
  title: string; // 列标题
  cell?: (row: T) => Snippet; // 自定义渲染
  align?: 'left' | 'center' | 'right';
  width?: string;
  class?: string;
  thClass?: string;
}
```

**设计亮点：**

- `key: keyof T` 确保列键存在于行类型中
- `cell` 返回 `Snippet`（Svelte 5 的渲染函数类型）
- 可选配置使组件更灵活

---

### Q7. 联合类型与类型守卫

**题目：** 设计一个类型安全的函数，确保只有有效的状态转换才被允许。

**参考答案：**

#### 状态转换的类型安全设计

```typescript
// 定义状态和有效转换
type ApplicationStatus = 'pending' | 'approved' | 'rejected';

type StatusTransition = {
  pending: 'approved' | 'rejected';
  approved: 'pending'; // 可以重新打开
  rejected: 'pending'; // 可以重新提交
};

function transition(current: ApplicationStatus, next: ApplicationStatus): ApplicationStatus | null {
  const validTransitions: StatusTransition = {
    pending: ['approved', 'rejected'],
    approved: ['pending'],
    rejected: ['pending'],
  };

  if (validTransitions[current].includes(next)) {
    return next;
  }
  return null; // 无效转换
}
```

#### `Record<ApplicationStatus, string>` 的优势

```typescript
// ✅ 使用 Record - 类型安全、自动补全
const statusMap: Record<ApplicationStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
};

// ❌ 不用 Record - 易出错
const statusMap = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
};
```

**优势：**

1. **类型检查**：必须为每个状态提供值
2. **IDE 补全**：自动提示所有状态
3. **重构安全**：添加新状态时 TS 会报错

---

## 四、组件架构设计

### Q8. 通用组件设计

**题目：** 分析 `DynamicTable` 和 `ApplicationList` 组件的关系，是否有职责重叠？

**参考答案：**

#### 关系分析

```typescript
// ApplicationList.svelte 使用了 DynamicTable
<DynamicTable
  rows={filteredRecords}
  columns={columns}
  rowKey={(row) => row.id}
  {onRowClick}
  {rowActions}
  {pagination}
/>
```

**问题分析：**

- `ApplicationList` 本质上只是 `DynamicTable` 的一个配置包装器
- 存在职责重叠：数据过滤、格式化逻辑分散在两处

#### 重构建议

```typescript
// ✅ 方案1：移除 ApplicationList，页面直接使用 DynamicTable
// +page.svelte
<DynamicTable
  rows={filteredRecords}
  columns={columns}
  rowKey={(row) => row.id}
  onRowClick={handleRowClick}
  {rowActions}
  {pagination}
/>

// ✅ 方案2：将 ApplicationList 改名为 TableWrapper，只负责布局
// 只保留：搜索框、筛选器、统计摘要 + DynamicTable
```

#### 通用组件设计原则

| 原则         | 说明                   | DynamicTable 实现情况 |
| ------------ | ---------------------- | --------------------- |
| **单一职责** | 只负责表格渲染         | ✅ 做得较好           |
| **配置化**   | 通过 props 控制行为    | ✅ columns、rowKey 等 |
| **可组合**   | 支持 slot/snippet 扩展 | ✅ cell snippet       |
| **无副作用** | 不直接操作外部数据     | ✅ 需注意             |
| **类型安全** | 完整的 TypeScript 支持 | ✅ generics           |

---

### Q9. 动态表单设计

**题目：** 分析声明式字段配置的设计优势，以及如何支持动态字段。

**参考答案：**

#### 声明式配置的优势

```typescript
// ✅ 当前设计
export const OVERTIME_FORM_FIELDS: FormField[] = [
  { name: 'applicantName', type: 'text', required: true, ... },
  { name: 'department', type: 'select', options: [...], ... },
];

// 添加新字段只需追加配置，无需修改渲染代码
{
  name: 'urgencyLevel',
  label: '紧急程度',
  type: 'select',
  options: ['普通', '紧急', '加急'],
  required: true
}
```

**优势：**

1. **扩展性强**：新增字段零改动
2. **可配置化**：服务端可返回字段配置
3. **类型安全**：完整的类型推断
4. **易于测试**：只需测试配置渲染

#### 动态字段的架构调整

```typescript
// 1. 服务端返回动态配置
// +page.server.ts
export const load = async () => {
  const fields = await fetchFormFields(); // 从数据库/API 获取
  return { fields };
};

// 2. 客户端接收配置
// +page.svelte
let { data } = $props();
<DynamicForm fields={data.fields} />

// 3. 扩展 FormField 类型
interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'datetime' | 'file';
  options?: string[];
  maxFiles?: number;  // 文件上传相关
  validation?: ValidationRule[];  // 自定义验证规则
}
```

#### `half` 和 `group` 的布局实现

```typescript
// 实现原理
let halfFieldGroups = $derived.by(() => {
  const halfFields = fields.filter((f) => f.half);
  let current: FormField[] = [];

  for (const f of halfFields) {
    if (current.length === 0) {
      current.push(f);
    } else if (current[0].group === f.group && current.length < 2) {
      current.push(f); // 同一 group 的字段并排
    } else {
      groups.push(current);
      current = [f];
    }
  }
  return groups;
});
```

```svelte
<!-- 渲染 -->
{#each halfFieldGroups as group}
  <div class="grid gap-4" style="grid-template-columns: repeat({group.length}, 1fr);">
    <!-- 字段1 和 字段2 并排 -->
  </div>
{/each}
```

**局限性：**

- 最多只能两个字段并排
- group 只能是简单字符串比较
- 无法实现更复杂的网格布局

---

## 五、表单验证

### Q10. 验证逻辑分层

**题目：** 解释客户端验证和服务端验证的关系，以及跨字段验证的实现。

**参考答案：**

#### 客户端 vs 服务端验证

```typescript
// 客户端验证 - 即时反馈、用户体验
// DynamicForm.svelte
function validateField(name: string): boolean {
  const value = formData[name]?.toString().trim();
  if (field.required && !value) {
    errors[name] = `请填写${field.label}`;
    return false;
  }
  return true;
}

// 服务端验证 - 数据安全、最终防线
// +page.server.ts
export const actions = {
  create: async ({ request }) => {
    const formData = await request.formData();
    const { values, errors } = parseApplicationForm(formData);

    if (Object.keys(errors).length > 0) {
      return fail(400, { errors });
    }
    // 即使客户端被绕过，服务端仍会拒绝
  },
};
```

| 层级   | 目的               | 是否可绕过         |
| ------ | ------------------ | ------------------ |
| 客户端 | 即时反馈、减少请求 | 是（可修改 JS）    |
| 服务端 | 数据安全、最终验证 | 否（唯一真相来源） |

**不能只依赖客户端验证的原因：**

1. 用户可禁用 JS
2. 恶意用户可直接 POST 请求
3. API 可能被第三方调用

#### 跨字段验证的潜在问题

```typescript
// ❌ 当前实现
if (data.startTime && data.endTime) {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  if (end <= start) {
    errors.endTime = '结束时间必须大于开始时间';
  }
}

// 问题：Date 构造可能返回 Invalid Date
// getTime() 返回 NaN，NaN <= NaN 是 false，不会触发验证
```

**改进方案：**

```typescript
// ✅ 改进实现
if (data.startTime && data.endTime) {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);

  // 显式检查有效性
  if (Number.isNaN(start.getTime())) {
    errors.startTime = '开始时间格式无效';
  }
  if (Number.isNaN(end.getTime())) {
    errors.endTime = '结束时间格式无效';
  }

  // 确保有效后再比较
  if (!errors.startTime && !errors.endTime && end <= start) {
    errors.endTime = '结束时间必须大于开始时间';
  }
}
```

#### 异步验证架构

```typescript
// 定义异步验证器类型
type AsyncValidator = (
  value: string,
  formData: FormData
) => Promise<string | null>;  // 返回 null 表示通过

interface ValidationRule {
  validate: AsyncValidator;
  message: string;
}

interface FormField {
  // ... 现有字段
  asyncValidators?: ValidationRule[];
}

// 使用示例
{
  name: 'applicantName',
  label: '申请人',
  asyncValidators: [
    {
      validate: async (value) => {
        const exists = await checkUserExists(value);
        return exists ? '用户名已存在' : null;
      },
      message: '用户名已存在'
    }
  ]
}
```

---

## 六、状态管理

### Q11. Store 设计

**题目：** 对比 Svelte 5 Runes 与传统 Store 的选择，以及 Store 中的性能优化。

**参考答案：**

#### Svelte 5 Runes vs 传统 Store 选择

```typescript
// ✅ 方案1：使用 Svelte 5 Runes（推荐）
// +page.svelte
let records = $state<OvertimeRecord[]>([]);
let loading = $state(false);

// 派生状态
let pendingCount = $derived(records.filter((r) => r.status === 'pending').length);

// ✅ 方案2：使用传统 Store（仍可用）
// store.ts
export const appStore = writable<AppState>(initialState);
```

| 场景         | 推荐                 | 原因              |
| ------------ | -------------------- | ----------------- |
| 单组件内状态 | `$state`             | 简单直接          |
| 跨组件共享   | `$state` + Context   | Svelte 5 推荐模式 |
| 复杂状态逻辑 | Store                | 方法封装更清晰    |
| 需要订阅     | `$state` + `$effect` | 可替代 subscribe  |
| 遗留代码迁移 | Store                | 渐进迁移          |

#### Store 嵌套更新的性能问题

```typescript
// ❌ 当前实现
approveRecord(id: string, operator: string, comment?: string) {
  update(state => ({
    ...state,
    records: state.records.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: 'approved',
          workflowHistory: [...(r.workflowHistory || []), step]
        };
      }
      return r;
    }),
    selectedRecord: state.selectedRecord?.id === id ? {
      ...state.selectedRecord,
      status: 'approved',
      workflowHistory: [...]
    } : state.selectedRecord
  }));
}
```

**问题分析：**

1. **每次都创建新 state 对象**：即使记录未变
2. **两次遍历**：性能 O(n)
3. **不必要的 selectedRecord 更新**：除非刚好是同一条

**改进方案：**

```typescript
// ✅ 改进实现
approveRecord(id: string, operator: string, comment?: string) {
  const now = new Date().toISOString();
  const step: WorkflowStep = { ... };

  update(state => {
    let updatedRecord: OvertimeRecord | null = null;

    const records = state.records.map(r => {
      if (r.id === id) {
        updatedRecord = {
          ...r,
          status: 'approved' as ApplicationStatus,
          workflowHistory: [...(r.workflowHistory || []), step]
        };
        return updatedRecord;
      }
      return r;
    });

    return {
      ...state,
      records,
      selectedRecord: state.selectedRecord?.id === id && updatedRecord
        ? updatedRecord
        : state.selectedRecord
    };
  });
}
```

---

## 七、数据可视化

### Q12. ECharts 集成

**题目：** 分析 ECharts 在 SSR 环境下的处理方式及大数据量优化方案。

**参考答案：**

#### `typeof window === 'undefined'` 检查

```typescript
// ❌ 问题场景
onMount(() => {
  barChart = echarts.init(barChartContainer);
  // 如果 SSR 时执行到这里，barChartContainer 可能不存在
});

// ✅ 正确做法
onMount(() => {
  if (typeof window === 'undefined') return;
  barChart = echarts.init(barChartContainer);
});

// 或使用 $app/environment
import { browser } from '$app/environment';

$effect(() => {
  if (!browser) return;
  initCharts();
});
```

**SSR 环境问题：**

- Node.js 没有 `window` 对象
- ECharts 的 DOM 操作需要浏览器环境
- 服务端渲染时组件可能执行初始化代码

#### 响应式处理

```typescript
// ✅ 正确的 resize 监听
onMount(() => {
  initCharts();

  const handleResize = () => {
    barChart?.resize();
    pieChart?.resize();
  };

  window.addEventListener('resize', handleResize);

  // 清理
  return () => {
    window.removeEventListener('resize', handleResize);
    barChart?.dispose();
    pieChart?.dispose();
  };
});

// ❌ 常见错误：不清除监听器
onMount(() => {
  window.addEventListener('resize', () => chart.resize());
  // 组件销毁时未移除，导致内存泄漏
});
```

#### 大数据量优化

```typescript
// 问题：10000+ 条数据直接渲染会卡顿

// ✅ 方案1：数据采样
function sampleData(data: OvertimeRecord[], maxPoints: number = 100): OvertimeRecord[] {
  if (data.length <= maxPoints) return data;

  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
}

// ✅ 方案2：使用 ECharts 的 dataZoom
const option = {
  dataZoom: [
    { type: 'inside', start: 0, end: 100 },
    { type: 'slider', start: 0, end: 100 },
  ],
};

// ✅ 方案3：异步加载
async function loadChartData() {
  const data = await fetchChartData(); // 只获取图表需要的聚合数据
  chart.setOption({ series: [{ data }] });
}
```

---

## 八、性能优化

### Q13. 分页与虚拟滚动

**题目：** 分析当前分页实现的性能瓶颈及改进方案。

**参考答案：**

#### 当前分页的性能瓶颈

```typescript
// ❌ 当前实现
let paginatedRows = $derived(rows.slice((currentPage - 1) * pageSize, currentPage * pageSize));

// 问题：
// 1. 每次 render 都执行 slice，O(n) 复杂度
// 2. rows 作为大数组，整个引用变化时会触发重新计算
// 3. 无法处理超大数据集（内存占用）
```

**改进方案：**

```typescript
// ✅ 方案1：Memoization 缓存
let paginatedRows = $derived.by(() => {
  const cacheKey = `${currentPage}-${pageSize}-${rows.length}`;
  // 使用 LRU 缓存或其他缓存策略
  return rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
});

// ✅ 方案2：虚拟滚动（大数据集）
// 使用 svelte-virtual-list 或自定义实现
import VirtualList from 'svelte-virtual-list';

<VirtualList items={rows} let:item>
  <TableRow data={item} />
</VirtualList>
```

#### 虚拟滚动原理

```
┌─────────────────────────────┐
│        视口 (viewport)       │
│  ┌───────────────────────┐   │
│  │    渲染的可见行        │   │ ← 只渲染可见区域的 ~20 行
│  │    (rendered items)   │   │
│  └───────────────────────┘   │
│                             │
│  ↑ scrollTop               │
│  │                         │
│  ├─────────────────────────┤
│  │   padding-top          │ ← 根据滚动位置动态计算
│  ├─────────────────────────┤
│  │                         │
│  │   (其他行不渲染)        │
│  │                         │
│  ├─────────────────────────┤
│  │   padding-bottom       │
│  └─────────────────────────┘
│                             │
│  总高度 = items.length * rowHeight
└─────────────────────────────┘
```

#### 服务端分页实现

```typescript
// +page.server.ts
export const load: PageServerLoad = async ({ url }) => {
  const page = parseInt(url.searchParams.get('page') ?? '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') ?? '10');
  const keyword = url.searchParams.get('keyword') ?? '';

  const { records, total } = await fetchRecords({
    page,
    pageSize,
    keyword,
    offset: (page - 1) * pageSize,
  });

  return {
    records,
    pagination: { page, pageSize, total },
  };
};
```

---

### Q14. 依赖注入与代码分割

**题目：** 分析字段可见性控制的改进方案及 SvelteKit 代码分割机制。

**参考答案：**

#### 字段可见性控制的改进

```typescript
// ❌ 当前实现
function getVisibleFields(schema, mode) {
  return schema.filter(field => {
    if (mode === 'create' && field.editOnly) return false;
    if (mode === 'edit' && field.createOnly) return false;
    return true;
  });
}

// ✅ 改进：使用更表达式的类型
type FieldVisibility = {
  showInCreate: boolean;
  showInEdit: boolean;
  showInView: boolean;
};

interface FormFieldDefinition {
  // ...
  visibility?: FieldVisibility;
  conditions?: ConditionalRule[];  // 条件显示
}

// 使用
{
  name: 'resubmitReason',
  label: '重新提交原因',
  visibility: { showInCreate: false, showInEdit: true, showInView: false }
}

// 条件显示
{
  name: 'urgentNote',
  label: '加急说明',
  conditions: [
    { field: 'urgencyLevel', operator: 'equals', value: 'urgent' }
  ]
}
```

#### SvelteKit 代码分割

```typescript
// 1. 路由级自动分割
// 访问 /new 时才加载 new 路由的代码
// src/routes/new/+page.svelte → 自动打包

// 2. 动态导入
const HeavyChart = await import('$lib/components/HeavyChart.svelte');

// 3. 条件加载
{#if showChart}
  {#await import('$lib/components/Statistics.svelte')}
    <Loading />
  {:then component}
    <svelte:component this={component.default} {records} />
  {/await}
{/if}

// 4. 禁用预加载（按需加载）
export const prerender = false;
export const csr = true;  // 只在客户端渲染
```

---

## 九、测试

### Q15. 单元测试策略

**题目：** 如何提升测试覆盖率，以及 E2E vs 单元测试的选择标准。

**参考答案：**

#### 提升测试覆盖率

```typescript
// ✅ 1. 测试工具函数（已有）
describe('工具函数测试', () => {
  it('calculateDuration', () => { ... });
  it('formatDuration', () => { ... });
});

// ✅ 2. 测试业务逻辑（可添加）
describe('业务逻辑测试', () => {
  it('统计数据计算正确', () => {
    const stats = calculateStatistics(mockRecords);
    expect(stats.pending).toBe(2);
    expect(stats.totalHours).toBe(16);
  });

  it('状态转换有效', () => {
    const result = transitionStatus('pending', 'approved');
    expect(result).toBe('approved');
  });
});

// ✅ 3. 测试边界条件
describe('边界条件', () => {
  it('空数组', () => { ... });
  it('超长文本', () => { ... });
  it('特殊字符', () => { ... });
  it('时区边界', () => { ... });
});
```

#### 测试 Svelte 组件交互

```typescript
// ✅ 使用 @testing-library/svelte
import { render, screen, fireEvent } from '@testing-library/svelte';
import DynamicForm from './DynamicForm.svelte';

describe('DynamicForm', () => {
  it('显示必填字段错误', async () => {
    render(DynamicForm, {
      props: {
        fields: OVERTIME_FORM_FIELDS,
        onSubmit: vi.fn(),
      },
    });

    // 触发提交
    const submitButton = screen.getByRole('button', { name: '提交' });
    await fireEvent.click(submitButton);

    // 验证错误显示
    expect(screen.getByText('请填写申请人')).toBeInTheDocument();
  });
});
```

#### E2E vs 单元测试选择

| 测试类型 | 覆盖范围  | 执行速度 | 维护成本 | 适用场景           |
| -------- | --------- | -------- | -------- | ------------------ |
| 单元测试 | 函数/工具 | 快       | 低       | 计算逻辑、边界条件 |
| 组件测试 | 组件行为  | 中       | 中       | UI 交互、状态变化  |
| E2E 测试 | 完整流程  | 慢       | 高       | 用户旅程、关键路径 |

---

## 十、实际编码题

### Q16. 扩展字段：紧急程度 + 附件上传

**题目：**  
假设需要为加班申请添加「紧急程度」字段（普通/紧急/加急），同时需要支持上传附件（最多3个）。

**参考答案：**

#### 1. 类型定义修改

```typescript
// types.ts

// 新增紧急程度枚举
export type UrgencyLevel = 'normal' | 'urgent' | 'critical';

// 新增附件类型
export interface Attachment {
  id: string;
  name: string;
  size: number;
  url: string;
  uploadedAt: string;
}

// 修改申请记录类型
export interface OvertimeRecord {
  // ... 现有字段
  urgencyLevel: UrgencyLevel; // 新增
  attachments?: Attachment[]; // 新增
}

// 修改表单数据类型
export interface OvertimeFormData {
  // ... 现有字段
  urgencyLevel: UrgencyLevel;
  attachments: File[]; // 上传时使用 File 对象
}

// 新增验证错误类型
export interface FormErrors {
  // ... 现有错误
  urgencyLevel?: string;
  attachments?: string;
}
```

#### 2. 表单组件改造

```typescript
// storage.ts - 新增字段配置
export const OVERTIME_FORM_FIELDS: FormField[] = [
  // ... 现有字段
  {
    name: 'urgencyLevel',
    label: '紧急程度',
    type: 'select',
    required: true,
    half: true,
    group: 'meta',
    options: [
      { value: 'normal', label: '普通', color: 'gray' },
      { value: 'urgent', label: '紧急', color: 'orange' },
      { value: 'critical', label: '加急', color: 'red' }
    ]
  },
  {
    name: 'attachments',
    label: '附件',
    type: 'file',  // 新类型
    required: false,
    half: true,
    group: 'meta',
    maxFiles: 3,
    accept: '.pdf,.doc,.docx,.jpg,.png'
  }
];

// DynamicForm.svelte - 新增 file 类型渲染
{#if field.type === 'file'}
  <input
    type="file"
    multiple
    accept={field.accept}
    onchange={(e) => handleFileUpload(e, field.name)}
    disabled={readOnly}
  />
  <p class="text-sm text-gray-500">
    已上传 {uploadedFiles.length} / {field.maxFiles} 个文件
  </p>
{/if}
```

#### 3. 服务端存储同步

```typescript
// server/storage.ts
export function saveApplicationsToFile(records: OvertimeRecord[]): void {
  writeFileSync(DATA_FILE, JSON.stringify(records, null, 2));
}

// +page.server.ts - 处理文件上传
export const actions = {
  create: async ({ request }) => {
    const formData = await request.formData();

    // 处理文件上传
    const files = formData.getAll('attachments') as File[];
    const attachments = await Promise.all(files.map(uploadFile));

    // 构建记录
    const newRecord = {
      id: generateId(),
      // ... 现有字段
      urgencyLevel: formData.get('urgencyLevel'),
      attachments,
    };

    // 保存
    const records = loadApplicationsFromFile();
    records.unshift(newRecord);
    saveApplicationsToFile(records);

    return { success: true };
  },
};
```

#### 4. 向后兼容性

```typescript
// 类型兼容处理
interface LegacyRecord {
  // 旧版本没有这些字段
  urgencyLevel?: UrgencyLevel;
  attachments?: Attachment[];
}

// 读取时提供默认值
function loadApplicationsFromFile(): OvertimeRecord[] {
  const data = readFileSync(DATA_FILE, 'utf-8');
  const records = JSON.parse(data) as OvertimeRecord[];

  // 迁移旧数据
  return records.map((record) => ({
    ...record,
    urgencyLevel: record.urgencyLevel ?? 'normal', // 默认值
    attachments: record.attachments ?? [],
  }));
}
```

---

### Q17. 代码审查

**题目：** 阅读 `+page.server.ts` 中的 `update` action，指出潜在 bug 并提出改进方案。

**参考答案：**

#### 潜在 Bug 分析

**Bug 1：并发更新问题**

```typescript
// ❌ 问题代码
const records = loadApplicationsFromFile();  // 1. 读取
const index = records.findIndex(r => r.id === id);
records[index] = { ... };                     // 2. 修改
saveApplicationsToFile(records);              // 3. 保存

// 问题：两个用户同时编辑同一记录，后提交的会覆盖前者的修改
// 场景：
// 用户A 读取记录 (status: pending)
// 用户B 读取记录 (status: pending)
// 用户A 修改 status → approved，保存
// 用户B 修改 reason → "新原因"，保存 → 覆盖了 A 的修改！
```

**Bug 2：状态转换逻辑不完整**

```typescript
// ❌ 当前代码
status: previousStatus === 'rejected' ? 'pending' : existing.status,

// 问题：
// 1. 只处理了 rejected → pending
// 2. 没有处理 approved 状态下的重新编辑
// 3. 没有防止编辑已完成（approved）的记录
```

#### 并发安全改进

```typescript
// ✅ 方案1：使用乐观锁（版本号）
interface OvertimeRecord {
  id: string;
  version: number; // 每次修改递增
  // ...
}

// update action
update: async ({ request }) => {
  const formData = await request.formData();
  const id = formData.get('id')?.toString();
  const clientVersion = parseInt(formData.get('version')?.toString() ?? '0');

  const records = loadApplicationsFromFile();
  const index = records.findIndex((r) => r.id === id);
  const existing = records[index];

  // 乐观锁检查
  if (existing.version !== clientVersion) {
    return fail(409, {
      error: '记录已被其他人修改，请刷新后重试',
      currentVersion: existing.version,
    });
  }

  // 更新时递增版本
  records[index] = {
    ...existing,
    ...updates,
    version: existing.version + 1,
  };

  saveApplicationsToFile(records);
  return { success: true };
};

// ✅ 方案2：使用文件锁（Node.js 环境）
import { lock } from 'proper-lockfile';

async function updateWithLock(id: string, updates: Partial<OvertimeRecord>) {
  const lockPath = `${DATA_FILE}.lock`;

  await lock(DATA_FILE, { lockPath });
  try {
    const records = loadApplicationsFromFile();
    // 更新逻辑
    saveApplicationsToFile(records);
  } finally {
    await unlock(DATA_FILE);
  }
}
```

#### 完整改进代码

```typescript
// ✅ 改进后的 update action
update: async ({ request }) => {
  const formData = await request.formData();
  const id = formData.get('id')?.toString() ?? '';
  const clientVersion = parseInt(formData.get('version')?.toString() ?? '0');

  if (!id) {
    return fail(400, { error: '缺少记录ID' });
  }

  const { values, errors } = parseApplicationForm(formData);
  if (Object.keys(errors).length > 0) {
    const fieldOrder = [
      'applicantName',
      'department',
      'position',
      'startTime',
      'endTime',
      'reason',
    ];
    for (const field of fieldOrder) {
      if (errors[field]) {
        return fail(400, { error: errors[field], field });
      }
    }
  }

  const records = loadApplicationsFromFile();
  const index = records.findIndex((r) => r.id === id);

  if (index === -1) {
    return fail(404, { error: '记录不存在' });
  }

  const existing = records[index];

  // ✅ 检查是否可以编辑
  if (existing.status === 'approved') {
    return fail(400, { error: '已通过的申请无法编辑' });
  }

  // ✅ 乐观锁检查
  if (clientVersion > 0 && existing.version !== clientVersion) {
    return fail(409, {
      error: '记录已被修改，请刷新后重试',
      currentVersion: existing.version,
    });
  }

  const now = new Date().toISOString();
  const previousStatus = existing.status;

  // 构建工作流历史
  let workflowHistory = existing.workflowHistory ?? [];

  if (previousStatus === 'rejected') {
    workflowHistory.push({
      id: generateId(),
      type: 'resubmit',
      status: 'completed',
      operator: values.applicantName,
      operateTime: now,
      stepName: '重新提交申请',
    });
  } else if (previousStatus === 'pending') {
    workflowHistory.push({
      id: generateId(),
      type: 'resubmit',
      status: 'completed',
      operator: values.applicantName,
      operateTime: now,
      stepName: '修改申请',
    });
  }

  // ✅ 更新记录
  records[index] = {
    ...existing,
    applicantName: values.applicantName,
    department: values.department,
    position: values.position,
    startTime: values.startTime,
    endTime: values.endTime,
    duration: calculateDuration(values.startTime, values.endTime),
    reason: values.reason,
    status: previousStatus === 'rejected' ? 'pending' : existing.status,
    workflowHistory,
    version: (existing.version ?? 0) + 1,
    updatedAt: now,
  };

  saveApplicationsToFile(records);

  return { success: true, action: 'update', version: records[index].version };
};
```

---

## 面试评估标准

| 等级          | 表现              | 预期回答                       |
| ------------- | ----------------- | ------------------------------ |
| **P6 初中级** | Q1-5, Q10-11 答好 | 理解基本概念，能解释代码       |
| **P7 高级**   | Q6-9, Q12-14 答好 | 深入原理，能给出改进方案       |
| **P8 专家**   | Q15-17 答好       | 架构设计能力强，能处理复杂场景 |

---

## 相关代码文件

| 文件                                     | 说明                        |
| ---------------------------------------- | --------------------------- |
| `src/lib/components/DynamicForm.svelte`  | 动态表单组件（Runes 语法）  |
| `src/lib/components/DynamicTable.svelte` | 通用表格组件（泛型应用）    |
| `src/lib/components/Statistics.svelte`   | ECharts 可视化组件          |
| `src/lib/storage.ts`                     | 客户端工具函数              |
| `src/lib/server/storage.ts`              | 服务端存储模块              |
| `src/lib/store.ts`                       | Svelte Store 状态管理       |
| `src/lib/types.ts`                       | TypeScript 类型定义         |
| `src/routes/+page.server.ts`             | SSR 数据加载与 Form Actions |
| `src/test/OvertimeApplication.test.ts`   | 单元测试示例                |
