/**
 * @fileoverview 测试数据工厂函数
 *
 * 提供一致的测试数据生成，支持覆盖特定字段便于测试边界场景
 */

import type { OvertimeRecord, WorkflowStep, FormField, FormData } from '../lib/storage';

// ==================== WorkflowStep Fixtures ====================

/**
 * 创建工作流步骤
 */
export function createWorkflowStep(overrides: Partial<WorkflowStep> = {}): WorkflowStep {
  return {
    id: `workflow-step-${crypto.randomUUID().slice(0, 8)}`,
    type: 'submit',
    status: 'completed',
    operator: '张三',
    operateTime: '2026-08-24T10:00:00.000Z',
    stepName: '提交申请',
    ...overrides,
  };
}

/**
 * 创建审批通过的工作流步骤
 */
export function createApprovedWorkflowStep(operator: string = '李经理'): WorkflowStep {
  return createWorkflowStep({
    type: 'approve',
    status: 'completed',
    operator,
    stepName: '审批通过',
    operateTime: '2026-08-24T14:00:00.000Z',
    comment: '同意加班',
  });
}

/**
 * 创建审批驳回的工作流步骤
 */
export function createRejectedWorkflowStep(
  operator: string = '王经理',
  comment?: string,
): WorkflowStep {
  return createWorkflowStep({
    type: 'reject',
    status: 'rejected',
    operator,
    stepName: '审批驳回',
    operateTime: '2026-08-24T14:00:00.000Z',
    comment,
  });
}

// ==================== OvertimeRecord Fixtures ====================

const DEFAULT_RECORD_DATA = {
  applicantName: '张三',
  department: '技术部',
  position: '高级工程师',
  startTime: '2026-08-25T18:00:00.000Z',
  endTime: '2026-08-25T22:00:00.000Z',
  duration: 4,
  reason: '项目紧急上线需要加班处理',
  submitTime: '2026-08-24T10:00:00.000Z',
};

/**
 * 创建加班记录
 *
 * @param overrides - 部分字段覆盖
 */
export function createOvertimeRecord(overrides: Partial<OvertimeRecord> = {}): OvertimeRecord {
  const id = `record-${crypto.randomUUID().slice(0, 8)}`;
  return {
    ...DEFAULT_RECORD_DATA,
    id,
    status: 'pending',
    workflowHistory: [
      createWorkflowStep({
        operator: overrides.applicantName ?? DEFAULT_RECORD_DATA.applicantName,
      }),
    ],
    ...overrides,
  };
}

/**
 * 创建待审批状态的记录
 */
export function createPendingRecord(applicantName: string = '待审批员工-赵六'): OvertimeRecord {
  return createOvertimeRecord({
    id: `pending-record-${crypto.randomUUID().slice(0, 6)}`,
    applicantName,
    status: 'pending',
    workflowHistory: [createWorkflowStep({ operator: applicantName })],
  });
}

/**
 * 创建已通过的记录
 */
export function createApprovedRecord(applicantName: string = '已通过员工-钱七'): OvertimeRecord {
  return createOvertimeRecord({
    id: `approved-record-${crypto.randomUUID().slice(0, 6)}`,
    applicantName,
    status: 'approved',
    duration: 3,
    workflowHistory: [
      createWorkflowStep({ operator: applicantName }),
      createApprovedWorkflowStep('审批经理-孙八'),
    ],
  });
}

/**
 * 创建已驳回的记录
 */
export function createRejectedRecord(
  applicantName: string = '已驳回员工-孙九',
  rejectReason?: string,
): OvertimeRecord {
  return createOvertimeRecord({
    id: `rejected-record-${crypto.randomUUID().slice(0, 6)}`,
    applicantName,
    status: 'rejected',
    reason: '项目紧急上线',
    workflowHistory: [
      createWorkflowStep({ operator: applicantName }),
      createRejectedWorkflowStep('审批经理-周十', rejectReason),
    ],
  });
}

/**
 * 创建跨天加班记录（用于测试跨天场景）
 */
export function createCrossDayRecord(): OvertimeRecord {
  return createOvertimeRecord({
    id: 'crossday-record-001',
    startTime: '2026-08-25T22:00:00.000Z',
    endTime: '2026-08-26T02:00:00.000Z',
    duration: 4,
  });
}

/**
 * 创建半小时加班记录（用于测试分钟精度）
 */
export function createHalfHourRecord(): OvertimeRecord {
  return createOvertimeRecord({
    id: 'halfhour-record-001',
    startTime: '2026-08-25T18:00:00.000Z',
    endTime: '2026-08-25T18:30:00.000Z',
    duration: 0.5,
  });
}

// ==================== FormData Fixtures ====================

/**
 * 创建有效的表单数据
 */
export function createValidFormData(overrides: Partial<FormData> = {}): FormData {
  return {
    applicantName: '张三',
    department: '技术部',
    position: '高级工程师',
    startTime: '2026-08-25T18:00',
    endTime: '2026-08-25T22:00',
    reason: '项目紧急上线需要加班处理',
    ...overrides,
  };
}

/**
 * 创建空的必填表单数据
 */
export function createEmptyFormData(): FormData {
  return {
    applicantName: '',
    department: '',
    position: '',
    startTime: '',
    endTime: '',
    reason: '',
  };
}

// ==================== FormField Fixtures ====================

/**
 * 创建文本字段配置
 */
export function createTextField(name: string = 'testField', label: string = '测试字段'): FormField {
  return {
    name,
    label,
    type: 'text',
    required: false,
    placeholder: `请输入${label}`,
  };
}

/**
 * 创建下拉字段配置
 */
export function createSelectField(
  name: string = 'testSelect',
  label: string = '测试选择',
  options: string[] = ['选项一', '选项二', '选项三'],
): FormField {
  return {
    name,
    label,
    type: 'select',
    required: true,
    options,
  };
}

// ==================== 批量数据生成 ====================

/**
 * 生成多条测试记录
 *
 * @param count - 生成数量
 * @param statusFilter - 可选的状态过滤
 */
export function createMultipleRecords(
  count: number,
  statusFilter?: OvertimeRecord['status'],
): OvertimeRecord[] {
  const statuses: OvertimeRecord['status'][] = ['pending', 'approved', 'rejected'];
  const applicants = ['张三', '李四', '王五', '赵六', '钱七', '孙八'];

  return Array.from({ length: count }, (_, i) => {
    const status = statusFilter ?? statuses[i % 3];
    const applicant = applicants[i % applicants.length];

    const baseRecord = createOvertimeRecord({
      id: `batch-record-${i.toString().padStart(3, '0')}`,
      applicantName: `${applicant}-${i}`,
      status,
      submitTime: new Date(Date.now() - i * 86400000).toISOString(),
    });

    if (status === 'approved') {
      baseRecord.workflowHistory?.push(createApprovedWorkflowStep(`审批人-${i}`));
    } else if (status === 'rejected') {
      baseRecord.workflowHistory?.push(createRejectedWorkflowStep(`审批人-${i}`, '理由不充分'));
    }

    return baseRecord;
  });
}
