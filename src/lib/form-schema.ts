/**
 * 动态表单 Schema 定义
 * - 通过声明式字段配置渲染表单，便于扩展与维护
 */
import type { OvertimeFormData } from './types';

// 支持的字段类型
export type FieldType = 'text' | 'textarea' | 'select' | 'datetime';

// 通用字段定义
export interface FormFieldDefinition<T = string> {
  /** 字段名，对应 OvertimeFormData 的 key */
  name: keyof OvertimeFormData;
  /** 显示标签 */
  label: string;
  /** 字段类型 */
  type: FieldType;
  /** 占位提示 */
  placeholder?: string;
  /** 是否必填 */
  required?: boolean;
  /** 额外提示文案 */
  helperText?: string;
  /** select 类型专属：可选项 */
  options?: readonly T[];
  /** textarea 专属：最大字符数 */
  maxLength?: number;
  /** textarea 专属：行数 */
  rows?: number;
  /** 当前字段宽度（1 = 全宽；2 = 半宽，与其他 half 字段并排） */
  width?: 'full' | 'half';
  /** 仅在新增模式显示 */
  createOnly?: boolean;
  /** 仅在编辑模式显示 */
  editOnly?: boolean;
  /** 是否为只读（已审批或已驳回时强制只读） */
  readOnlyWhenApproved?: boolean;
  /** 该字段在选择区域内的分组 key，相同 group 的字段并排显示 */
  group?: string;
}

/**
 * 新增/编辑加班申请表单的 schema
 * 增加字段只需在此追加，无需修改表单渲染代码
 */
export const OVERTIME_FORM_SCHEMA: FormFieldDefinition[] = [
  {
    name: 'applicantName',
    label: '申请人',
    type: 'text',
    placeholder: '请输入申请人姓名',
    required: true,
    width: 'full',
  },
  {
    name: 'department',
    label: '部门',
    type: 'select',
    placeholder: '请选择部门',
    required: true,
    width: 'half',
    group: 'job',
  },
  {
    name: 'position',
    label: '职位',
    type: 'select',
    placeholder: '请选择职位',
    required: true,
    width: 'half',
    group: 'job',
  },
  {
    name: 'startTime',
    label: '开始时间',
    type: 'datetime',
    required: true,
    placeholder: '请选择开始时间',
    width: 'half',
    group: 'time',
  },
  {
    name: 'endTime',
    label: '结束时间',
    type: 'datetime',
    required: true,
    placeholder: '请选择结束时间',
    width: 'half',
    group: 'time',
  },
  {
    name: 'reason',
    label: '加班事由',
    type: 'textarea',
    placeholder: '请详细描述加班原因（至少5个字符）',
    required: true,
    maxLength: 200,
    rows: 4,
    width: 'full',
  },
];

/**
 * 默认值兜底（用于空表单或字段缺失初始值）
 */
export function getEmptyFormData(): OvertimeFormData {
  return {
    applicantName: '',
    department: '',
    position: '',
    startTime: '',
    endTime: '',
    reason: '',
  };
}

/**
 * 根据 schema 过滤出当前模式下应展示的字段
 */
export function getVisibleFields(
  schema: FormFieldDefinition[],
  mode: 'create' | 'edit',
): FormFieldDefinition[] {
  return schema.filter((field) => {
    if (mode === 'create' && field.editOnly) return false;
    if (mode === 'edit' && field.createOnly) return false;
    return true;
  });
}

/**
 * 通用字段验证器
 * 返回字段级错误信息
 */
export function validateFormData(
  data: Partial<OvertimeFormData>,
  schema: FormFieldDefinition[] = OVERTIME_FORM_SCHEMA,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of schema) {
    const value = (data[field.name] ?? '').toString().trim();

    if (field.required && !value) {
      errors[field.name] = `请填写${field.label}`;
      continue;
    }

    if (field.name === 'reason' && value && value.length < 5) {
      errors[field.name] = '加班事由至少需要5个字符';
      continue;
    }
  }

  // 跨字段校验：结束时间必须晚于开始时间
  if (data.startTime && data.endTime) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
      errors.endTime = '结束时间必须大于开始时间';
    }
  }

  return errors;
}
