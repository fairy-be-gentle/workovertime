# 加班申请系统

基于 SvelteKit + TypeScript + TailwindCSS + Vitest + ECharts 的加班申请单页面应用。

## 技术栈

- **SvelteKit** - 应用框架
- **TypeScript** - 类型安全
- **TailwindCSS v4** - 原子化 CSS
- **Vitest** - 单元测试
- **ECharts** - 数据可视化

## 功能特性

### 加班申请流程
1. **提交申请** - 填写加班申请表单
   - 申请人
   - 加班开始/结束时间
   - 加班事由

2. **实时验证**
   - 结束时间必须大于开始时间
   - 加班事由至少5个字符
   - 所有必填字段验证

3. **申请列表**
   - 查看所有提交的申请
   - 字段：申请人、加班日期时间、加班时长、加班事由、提交时间、状态
   - 支持查看详情

4. **申请详情**
   - 弹窗展示完整申请信息
   - 显示申请单号、状态、时长等

5. **统计报表**
   - 总申请数统计
   - 待审批/已通过/已驳回数量
   - 总加班时长和平均时长
   - 月度加班柱状图
   - 申请状态饼图

6. **数据持久化**
   - 所有数据存储在 localStorage
   - 页面刷新后数据保持

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
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
│   ├── types.ts                 # 类型定义
│   ├── storage.ts               # 本地存储工具
│   └── components/
│       ├── OvertimeForm.svelte  # 加班申请表单
│       ├── ApplicationList.svelte # 申请列表
│       ├── ApplicationDetail.svelte # 申请详情弹窗
│       └── Statistics.svelte    # 统计报表
├── routes/
│   ├── +layout.svelte           # 布局组件
│   └── +page.svelte             # 主页面
├── test/
│   ├── setup.ts                 # 测试配置
│   └── OvertimeApplication.test.ts # 加班申请测试
├── app.css                      # 全局样式
├── app.html                     # HTML 模板
└── app.d.ts                     # 类型声明
```

## 加班申请流程需求
流程：员工填写加班申请表单 → 提交生成审批工单 → 进入对应审批节点逐级审批 → 审批通过/驳回 → 流程闭环
提交表单字段：申请人，加班日期时间，加班时长，加班事由
查看申请列表页字段：申请人，加班日期时间，加班时长，加班事由，提交时间，状态
需求：填写完信息之后可以预览填写信息是否有问题，有问题可以跳转到对应的表单修改（我这条处理为填写时就校验，这里仅校验开始时间不能大于结束时间，且不能包括正常的工作时间）
查看申请列表 + 各个申请详情，流程提交成功后，工单自动进入审批人待办列表，状态更新为「待审批」，目前只做提交流程，提交后全是待审批状态
流程与状态处理
要有统计报表看申请的情况
该组件页面可以用vitest测试