# 加班申请系统

基于 SvelteKit + TypeScript + TailwindCSS 的加班申请单页面应用。

## 技术栈

- **SvelteKit** — 应用框架（SSR + SPA）
- **TypeScript** — 类型安全
- **TailwindCSS v4** — 原子化 CSS
- **Vitest** — 单元测试
- **ECharts** — 数据可视化
- **ESLint + Prettier** — 代码规范

## 功能特性

### 申请流程

1. **新建申请** — 填写加班表单（申请人、部门、职位、开始/结束时间、加班事由）
2. **实时校验** — 结束时间必须晚于开始时间；加班事由至少 5 个字符；所有必填字段验证
3. **预览确认** — 提交前预览填写信息，可返回修改
4. **提交审批** — 提交后自动进入待审批状态

### 申请列表

- 查看所有已提交的申请
- 字段：申请人、部门、职位、加班时间、加班时长、加班事由、提交时间、状态
- 支持关键字搜索（按申请人）
- 支持状态筛选（全部 / 待审批 / 已通过 / 已驳回）
- 支持时间范围筛选（今天 / 最近一周 / 最近一个月 / 最近三个月 / 最近一年 / 自定义）
- 点击行或操作按钮查看详情
- 分页展示，每页 10 条

### 申请详情

- 完整展示申请信息及工作流历史
- 显示审批节点（提交 → 审批 → 完成/驳回）
- 仅待审批状态可执行审批/驳回操作

### 统计报表

- 总申请数、待审批/已通过/已驳回数量
- 总加班时长、平均加班时长
- 月度加班柱状图（ECharts）
- 申请状态分布饼图（ECharts）

### 数据持久化

- 服务端文件存储，数据存储在 `data/applications.json`

## 表单字段

| 字段     | 类型     | 必填 | 说明                       |
| -------- | -------- | ---- | -------------------------- |
| 申请人   | 文本     | 是   |                            |
| 部门     | 下拉     | 是   |                            |
| 职位     | 下拉     | 是   |                            |
| 开始时间 | 日期时间 | 是   |                            |
| 结束时间 | 日期时间 | 是   | 必须晚于开始时间           |
| 加班事由 | 多行文本 | 是   | 最少 5 字符，最多 200 字符 |

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 访问
# http://localhost:5173
```

## 构建与发布

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 测试

```bash
# 运行测试
npm test

# 监听模式
npm run test:watch

# 运行一次
npm run test:run
```

## 代码检查

```bash
# 类型检查
npm run check

# 监听模式
npm run check:watch

# 代码格式检查
npm run lint

# 自动格式化
npm run format
```

## 项目结构

```
src/
├── lib/
│   ├── types.ts                      # 类型定义（OvertimeRecord, ApplicationStatus, WorkflowStep 等）
│   ├── storage.ts                    # 客户端工具函数（格式化、验证等）
│   ├── store.ts                      # Svelte 状态管理
│   ├── form-schema.ts                # 表单字段定义与验证器
│   ├── server/
│   │   └── storage.ts                # 服务端存储（文件 IO）
│   └── components/
│       ├── DynamicTable.svelte        # 通用动态表格组件
│       ├── dynamic-table-types.ts     # 表格类型定义
│       ├── DynamicForm.svelte         # 动态表单组件
│       ├── Statistics.svelte          # 统计报表组件（ECharts 图表）
│       └── Timeline.svelte            # 工作流时间线组件
├── routes/
│   ├── +layout.svelte                # 布局组件
│   ├── +page.svelte                  # 主页面（列表 + 统计切换）
│   ├── +page.server.ts               # 主页面服务端加载
│   ├── new/
│   │   ├── +page.svelte              # 新建/编辑申请页
│   │   └── +page.server.ts           # 新建/编辑操作处理
│   ├── preview/
│   │   └── +page.svelte              # 预览申请页
│   └── record/
│       └── [id]/
│           ├── +page.svelte           # 申请详情页（审批/驳回）
│           └── +page.server.ts        # 详情数据加载
├── test/
│   ├── setup.ts                      # Vitest 测试配置
│   ├── fixtures.ts                   # 测试数据工厂
│   ├── validation.test.ts            # 表单验证测试
│   ├── storage.test.ts               # 存储工具测试
│   ├── business.test.ts              # 业务逻辑测试
│   ├── components.test.ts           # 组件测试
│   ├── page-flow.test.ts            # 页面流程测试
│   └── approval-flow.test.ts         # 审批流程测试
├── app.css                           # 全局样式
├── app.html                          # HTML 模板
└── app.d.ts                          # 类型声明
```
