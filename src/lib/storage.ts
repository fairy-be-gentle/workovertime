/**
 * 客户端工具函数（仅纯函数，可在浏览器中安全运行）
 * 服务端文件 IO 请使用 $lib/server/storage
 */

import type { OvertimeRecord as BaseOvertimeRecord } from './types';
export type { WorkflowStep, WorkflowStepType, WorkflowStepStatus } from './types';
export type OvertimeRecord = BaseOvertimeRecord;

// 加班申请单状态
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

/**
 * 动态表单字段类型
 */
export type FormFieldType = 'text' | 'textarea' | 'select' | 'datetime';

export interface FormField {
  name: string;           // 字段名，对应 form data key
  label: string;          // 显示标签
  type: FormFieldType;    // 渲染类型
  required?: boolean;     // 是否必填
  placeholder?: string;   // 占位提示
  options?: string[];     // select 类型的选项列表
  rows?: number;          // textarea 的行数
  maxLength?: number;     // 最大字符数
  half?: boolean;         // 是否半宽（两个 half 字段并排一行）
  group?: string;         // 分组标识，相同 group 的字段会并排显示
}

/**
 * 加班申请表单的字段配置（新增 / 编辑共用）
 * 如需新增字段，只需在此追加，后端可直接覆盖此数组实现动态配置
 */
export const OVERTIME_FORM_FIELDS: FormField[] = [
  {
    name: 'applicantName',
    label: '申请人',
    type: 'text',
    required: true,
    placeholder: '请输入申请人姓名'
  },
  {
    name: 'department',
    label: '部门',
    type: 'select',
    required: true,
    placeholder: '请选择部门',
    half: true,
    group: 'job',
    options: ['技术部', '产品部', '设计部', '运营部', '市场部', '人事部', '财务部', '行政部', '其他']
  },
  {
    name: 'position',
    label: '职位',
    type: 'select',
    required: true,
    placeholder: '请选择职位',
    half: true,
    group: 'job',
    options: ['实习生', '初级工程师', '中级工程师', '高级工程师', '技术专家', '初级经理', '中级经理', '高级经理', '总监', '其他']
  },
  {
    name: 'startTime',
    label: '开始时间',
    type: 'datetime',
    required: true,
    placeholder: '请选择开始时间',
    half: true,
    group: 'time'
  },
  {
    name: 'endTime',
    label: '结束时间',
    type: 'datetime',
    required: true,
    placeholder: '请选择结束时间',
    half: true,
    group: 'time'
  },
  {
    name: 'reason',
    label: '加班事由',
    type: 'textarea',
    required: true,
    placeholder: '请详细描述加班原因（至少5个字符）',
    rows: 4,
    maxLength: 200
  }
];

/**
 * 计算加班时长（小时）
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
}

/**
 * 格式化日期时间为显示格式
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 格式化日期
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * 格式化时长显示
 */
export function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}小时`;
  return `${h}小时${m}分钟`;
}

/**
 * 状态显示文本
 */
export function getStatusText(status: ApplicationStatus): string {
  const statusMap: Record<ApplicationStatus, string> = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已驳回'
  };
  return statusMap[status];
}

/**
 * 状态样式
 */
export function getStatusStyle(status: ApplicationStatus): string {
  const styleMap: Record<ApplicationStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200'
  };
  return styleMap[status];
}

/**
 * 表单数据（运行时结构，可被服务端覆盖）
 */
export interface FormData {
  [key: string]: string;
}

/**
 * 表单字段验证
 * @param data       当前表单数据
 * @param fields     字段配置（默认使用 OVERTIME_FORM_FIELDS）
 * @param extraRules 额外的跨字段校验规则
 * @returns 字段名 -> 错误信息的映射
 */
export function validateFormData(
  data: FormData,
  fields: FormField[] = OVERTIME_FORM_FIELDS,
  extraRules?: Record<string, string>
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const value = (data[field.name] ?? '').toString().trim();

    if (field.required && !value) {
      errors[field.name] = `请填写${field.label}`;
      continue;
    }

    if (field.name === 'reason' && value.length > 0 && value.length < 5) {
      errors[field.name] = '加班事由至少需要5个字符';
    }
  }

  if (data.startTime && data.endTime) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
      errors.endTime = '结束时间必须大于开始时间';
    }
  }

  // 额外规则（跨字段或自定义校验）
  if (extraRules) {
    for (const [field, msg] of Object.entries(extraRules)) {
      if (msg) errors[field] = msg;
    }
  }

  return errors;
}
