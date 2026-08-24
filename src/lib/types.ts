// 加班申请单状态
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

// 工作流状态
export type WorkflowStepStatus = 'pending' | 'processing' | 'completed' | 'rejected';

// 工作流步骤类型
export type WorkflowStepType = 'submit' | 'approve' | 'reject' | 'resubmit';

// 工作流步骤记录
export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  status: WorkflowStepStatus;
  operator: string;
  operateTime: string;
  comment?: string;
  stepName: string;
}

// 加班申请记录
export interface OvertimeRecord {
  id: string;                    // 唯一标识
  applicantName: string;          // 申请人
  department: string;             // 部门
  position: string;               // 职位
  startTime: string;              // 加班开始时间 (ISO 格式)
  endTime: string;                // 加班结束时间 (ISO 格式)
  duration: number;               // 加班时长（小时）
  reason: string;                 // 加班事由
  submitTime: string;             // 提交时间 (ISO 格式)
  status: ApplicationStatus;      // 状态
  workflowHistory?: WorkflowStep[]; // 工作流历史
}

// 表单数据（提交前）
export interface OvertimeFormData {
  applicantName: string;
  department: string;
  position: string;
  startTime: string;
  endTime: string;
  reason: string;
}

// 表单验证错误
export interface FormErrors {
  applicantName?: string;
  department?: string;
  position?: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

// 统计数据类型
export interface StatisticsData {
  total: number;           // 总申请数
  pending: number;         // 待审批
  approved: number;        // 已通过
  rejected: number;        // 已驳回
  totalHours: number;      // 总加班时长
  avgHours: number;        // 平均加班时长
  byMonth: {               // 按月份统计
    month: string;
    count: number;
    hours: number;
  }[];
  byStatus: {              // 按状态分布
    status: ApplicationStatus;
    count: number;
    percentage: number;
  }[];
}
