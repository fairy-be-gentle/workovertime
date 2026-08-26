/**
 * @fileoverview 加班申请系统核心类型定义
 *
 * 定义了申请记录、工作流、统计等核心数据结构
 */

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export type WorkflowStepStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export type WorkflowStepType = 'submit' | 'approve' | 'reject' | 'resubmit';

/** 工作流步骤记录 */
export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  status: WorkflowStepStatus;
  operator: string;
  operateTime: string;
  comment?: string;
  stepName: string;
}

/** 加班申请记录 */
export interface OvertimeRecord {
  id: string;
  applicantName: string;
  department: string;
  position: string;
  /** ISO 8601 格式 */
  startTime: string;
  /** ISO 8601 格式 */
  endTime: string;
  /** 加班时长（小时） */
  duration: number;
  reason: string;
  /** ISO 8601 格式 */
  submitTime: string;
  status: ApplicationStatus;
  workflowHistory?: WorkflowStep[];
}

/** 表单提交数据结构 */
export interface OvertimeFormData {
  applicantName: string;
  department: string;
  position: string;
  startTime: string;
  endTime: string;
  reason: string;
}

/** 表单验证错误 */
export interface FormErrors {
  applicantName?: string;
  department?: string;
  position?: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

/** 按月份统计的数据结构 */
interface MonthStat {
  month: string;
  count: number;
  hours: number;
}

/** 按状态分布的数据结构 */
interface StatusStat {
  status: ApplicationStatus;
  count: number;
  percentage: number;
}

/** 统计数据 */
export interface StatisticsData {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalHours: number;
  avgHours: number;
  byMonth: MonthStat[];
  byStatus: StatusStat[];
}
