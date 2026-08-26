/**
 * @fileoverview 客户端工具函数库
 *
 * 提供加班时长计算、日期格式化、表单验证等纯函数工具。
 * 仅包含可在浏览器中安全运行的代码，服务端 IO 请使用 $lib/server/storage
 */

import type { OvertimeRecord as BaseOvertimeRecord } from './types';

export type { WorkflowStep, WorkflowStepType, WorkflowStepStatus } from './types';
export type OvertimeRecord = BaseOvertimeRecord;

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export type FormFieldType = 'text' | 'textarea' | 'select' | 'datetime';

/**
 * 动态表单字段配置
 *
 * @example
 * ```ts
 * const fields: FormField[] = [
 *   { name: 'username', label: '用户名', type: 'text', required: true },
 *   { name: 'gender', label: '性别', type: 'select', options: ['男', '女'] },
 *   { name: 'bio', label: '简介', type: 'textarea', rows: 4, maxLength: 200 },
 *   // 半宽字段并排：firstName 和 lastName 会显示在同一行
 *   { name: 'firstName', label: '名', type: 'text', half: true, group: 'name' },
 *   { name: 'lastName', label: '姓', type: 'text', half: true, group: 'name' },
 * ];
 * ```
 */
export interface FormField {
  /** 字段唯一标识，对应 FormData 中的 key */
  name: string;
  /** 表单元素旁边的标签文字 */
  label: string;
  /** 渲染类型：text | textarea | select | datetime-local */
  type: FormFieldType;
  /** 提交时是否必填，设为 true 后空值会触发校验错误 */
  required?: boolean;
  /** 输入框为空时显示的占位提示文字 */
  placeholder?: string;
  /** select 下拉框的候选项列表（如不设置则显示"请选择"占位） */
  options?: string[];
  /** textarea 可见行数，type=textarea 时生效 */
  rows?: number;
  /** 允许输入的最大字符数，超出时无法继续输入 */
  maxLength?: number;
  /** 是否占用半宽（两个 half 字段并排显示在同一行） */
  half?: boolean;
  /** 并排分组标识：相同 group 的字段会相邻排列（需配合 half 使用） */
  group?: string;
}

/**
 * 加班申请表单的字段配置（新增 / 编辑共用）
 *
 * 如需新增字段，只需在此追加，后端可直接覆盖此数组实现动态配置
 */
export const OVERTIME_FORM_FIELDS: FormField[] = [
  {
    name: 'applicantName',
    label: '申请人',
    type: 'text',
    required: true,
    placeholder: '请输入申请人姓名',
  },
  {
    name: 'department',
    label: '部门',
    type: 'select',
    required: true,
    placeholder: '请选择部门',
    half: true,
    group: 'job',
    options: [
      '技术部',
      '产品部',
      '设计部',
      '运营部',
      '市场部',
      '人事部',
      '财务部',
      '行政部',
      '其他',
    ],
  },
  {
    name: 'position',
    label: '职位',
    type: 'select',
    required: true,
    placeholder: '请选择职位',
    half: true,
    group: 'job',
    options: [
      '实习生',
      '初级工程师',
      '中级工程师',
      '高级工程师',
      '技术专家',
      '初级经理',
      '中级经理',
      '高级经理',
      '总监',
      '其他',
    ],
  },
  {
    name: 'startTime',
    label: '开始时间',
    type: 'datetime',
    required: true,
    placeholder: '请选择开始时间',
    half: true,
    group: 'time',
  },
  {
    name: 'endTime',
    label: '结束时间',
    type: 'datetime',
    required: true,
    placeholder: '请选择结束时间',
    half: true,
    group: 'time',
  },
  {
    name: 'reason',
    label: '加班事由',
    type: 'textarea',
    required: true,
    placeholder: '请详细描述加班原因（至少5个字符）',
    rows: 4,
    maxLength: 200,
  },
];

/**
 * 计算加班时长
 *
 * @param startTime - 开始时间（ISO 8601 格式）
 * @param endTime - 结束时间（ISO 8601 格式）
 * @returns 加班时长（小时），保留两位小数
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
}

/**
 * 格式化日期时间为本地显示格式
 *
 * @param isoString - ISO 8601 格式的时间字符串
 * @returns 格式化的日期时间字符串（如 "2026/08/25 14:30"）
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 格式化日期为本地显示格式
 *
 * @param isoString - ISO 8601 格式的时间字符串
 * @returns 格式化的日期字符串（如 "2026/08/25"）
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 格式化时长为中文显示
 *
 * @param hours - 小时数（可为小数）
 * @returns 格式化的时长字符串（如 "2小时30分钟"）
 */
export function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) {
    return `${h}小时`;
  }
  return `${h}小时${m}分钟`;
}

/**
 * 获取状态对应的中文显示文本
 *
 * @param status - 申请状态
 * @returns 中文显示文本
 */
export function getStatusText(status: ApplicationStatus): string {
  const statusMap: Record<ApplicationStatus, string> = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已驳回',
  };
  return statusMap[status];
}

/**
 * 获取状态对应的 Tailwind CSS 样式类
 *
 * @param status - 申请状态
 * @returns Tailwind CSS 样式类名字符串
 */
export function getStatusStyle(status: ApplicationStatus): string {
  const styleMap: Record<ApplicationStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
  };
  return styleMap[status];
}

/**
 * 表单数据（键值对形式）
 *
 * 用于 DynamicForm 组件的双向绑定
 * @example
 * ```ts
 * const formData: FormData = {
 *   username: '张三',
 *   gender: '男',
 *   startTime: '2026-08-25T09:00',
 * };
 * ```
 */
export interface FormData {
  [key: string]: string;
}

/**
 * 表单校验结果
 */
export interface ValidationResult {
  /** 是否全部通过 */
  valid: boolean;
  /** 字段名到错误信息的映射 */
  errors: Record<string, string>;
}

/**
 * 校验单个字段（通用规则：必填检查）
 *
 * @param field - 字段配置
 * @param value - 字段值
 */
export function validateField(field: FormField, value: string): string | undefined {
  if (field.required && !value) {
    return `请填写${field.label}`;
  }
  return undefined;
}

/**
 * 执行表单校验（通用规则）
 *
 * 特定业务规则（如 reason 长度、跨字段校验等）由 extraRules 扩展
 *
 * @param fields - 字段配置列表
 * @param data - 表单数据
 * @param extraRules - 额外的校验规则，key 为字段名，value 为校验函数
 */
export function validateAll(
  fields: FormField[],
  data: FormData,
  extraRules?: Record<string, (data: FormData) => string | undefined>,
): ValidationResult {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const value = (data[field.name] ?? '').toString().trim();
    const error = validateField(field, value);
    if (error) errors[field.name] = error;
  }

  // 执行额外规则
  if (extraRules) {
    for (const [name, rule] of Object.entries(extraRules)) {
      const error = rule(data);
      if (error) errors[name] = error;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * 校验加班时长：reason 至少 5 个字符
 */
export function validateReasonLength(data: FormData): string | undefined {
  const reason = (data.reason ?? '').trim();
  if (reason.length > 0 && reason.length < 5) {
    return '加班事由至少需要5个字符';
  }
  return undefined;
}

/**
 * 校验时间范围：结束时间必须大于开始时间
 */
export function validateTimeRange(data: FormData): string | undefined {
  if (data.startTime && data.endTime) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
      return '结束时间必须大于开始时间';
    }
  }
  return undefined;
}

/**
 * 验证表单数据（兼容旧 API）
 *
 * @deprecated 请使用 validateAll + extraRules
 */
export function validateFormData(
  data: FormData,
  fields: FormField[] = OVERTIME_FORM_FIELDS,
  extraRules?: Record<string, string>,
): Record<string, string> {
  const result = validateAll(fields, data, {
    reason: (d) => validateReasonLength(d),
    endTime: (d) => validateTimeRange(d),
  });

  // 合并 extraRules（旧的字符串形式）
  if (extraRules) {
    for (const [field, msg] of Object.entries(extraRules)) {
      if (msg) result.errors[field] = msg;
    }
  }

  return result.errors;
}
