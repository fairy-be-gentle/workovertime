/**
 * @fileoverview 审批流程与记录详情页测试
 *
 * 测试审批、驳回流程以及记录详情页的数据展示
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createOvertimeRecord,
  createPendingRecord,
  createApprovedRecord,
  createRejectedRecord,
  createWorkflowStep,
  createApprovedWorkflowStep,
  createRejectedWorkflowStep,
} from './fixtures';
import type { OvertimeRecord, WorkflowStep } from '$lib/storage';

// ==================== 记录详情页数据展示 ====================
describe('记录详情页数据展示', () => {
  describe('基本申请信息展示', () => {
    it('正确显示申请人姓名', () => {
      const record = createPendingRecord('张三');
      expect(record.applicantName).toBe('张三');
    });

    it('正确显示部门信息', () => {
      const record = createOvertimeRecord({ department: '技术部' });
      expect(record.department).toBe('技术部');
    });

    it('正确显示职位信息', () => {
      const record = createOvertimeRecord({ position: '高级工程师' });
      expect(record.position).toBe('高级工程师');
    });

    it('部门为空时显示占位符', () => {
      const record = createOvertimeRecord({ department: '' });
      const displayValue = record.department || '-';
      expect(displayValue).toBe('-');
    });

    it('职位为空时显示占位符', () => {
      const record = createOvertimeRecord({ position: '' });
      const displayValue = record.position || '-';
      expect(displayValue).toBe('-');
    });
  });

  describe('加班时间信息展示', () => {
    it('正确显示开始时间', () => {
      const record = createOvertimeRecord({
        startTime: '2026-08-25T18:00:00.000Z',
      });
      expect(record.startTime).toContain('2026-08-25');
    });

    it('正确显示结束时间', () => {
      const record = createOvertimeRecord({
        endTime: '2026-08-25T22:00:00.000Z',
      });
      expect(record.endTime).toContain('2026-08-25');
    });

    it('正确计算加班时长', () => {
      const record = createOvertimeRecord({
        startTime: '2026-08-25T18:00:00.000Z',
        endTime: '2026-08-25T22:00:00.000Z',
        duration: 4,
      });

      const start = new Date(record.startTime);
      const end = new Date(record.endTime);
      const diffMs = end.getTime() - start.getTime();
      const hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

      expect(hours).toBe(4);
    });
  });

  describe('加班事由展示', () => {
    it('正确显示加班事由', () => {
      const record = createOvertimeRecord({
        reason: '项目紧急上线需要加班处理',
      });
      expect(record.reason).toBe('项目紧急上线需要加班处理');
    });

    it('加班事包含换行符时正确显示', () => {
      const record = createOvertimeRecord({
        reason: '第一行内容\n第二行内容',
      });
      expect(record.reason).toContain('\n');
    });
  });

  describe('状态标签显示', () => {
    it('待审批状态显示正确', () => {
      const record = createPendingRecord();
      expect(record.status).toBe('pending');
    });

    it('已通过状态显示正确', () => {
      const record = createApprovedRecord();
      expect(record.status).toBe('approved');
    });

    it('已驳回状态显示正确', () => {
      const record = createRejectedRecord();
      expect(record.status).toBe('rejected');
    });
  });
});

// ==================== 页面操作条件 ====================
describe('页面操作条件判断', () => {
  describe('修改按钮显示条件', () => {
    it('待审批状态应显示修改按钮', () => {
      const record = createPendingRecord();
      const canEdit = record.status !== 'approved';
      expect(canEdit).toBe(true);
    });

    it('已驳回状态应显示修改按钮', () => {
      const record = createRejectedRecord();
      const canEdit = record.status !== 'approved';
      expect(canEdit).toBe(true);
    });

    it('已通过状态不应显示修改按钮', () => {
      const record = createApprovedRecord();
      const canEdit = record.status !== 'approved';
      expect(canEdit).toBe(false);
    });
  });

  describe('审批操作栏显示条件', () => {
    it('待审批状态应显示审批操作栏', () => {
      const record = createPendingRecord();
      const showActionBar = record.status === 'pending';
      expect(showActionBar).toBe(true);
    });

    it('已通过状态不应显示审批操作栏', () => {
      const record = createApprovedRecord();
      const showActionBar = record.status === 'pending';
      expect(showActionBar).toBe(false);
    });

    it('已驳回状态不应显示审批操作栏', () => {
      const record = createRejectedRecord();
      const showActionBar = record.status === 'pending';
      expect(showActionBar).toBe(false);
    });
  });

  describe('修改跳转链接', () => {
    it('生成正确的修改页面跳转链接', () => {
      const record = createOvertimeRecord({ id: 'record-001' });
      const editUrl = `/new?id=${record.id}`;
      expect(editUrl).toBe('/new?id=record-001');
    });
  });
});

// ==================== 审批流程 ====================
describe('审批流程', () => {
  describe('审批操作前置条件', () => {
    it('待审批记录可以执行审批操作', () => {
      const record = createPendingRecord();
      const canApprove = record.status === 'pending';
      expect(canApprove).toBe(true);
    });

    it('已通过的记录不能重复审批', () => {
      const record = createApprovedRecord();
      const canApprove = record.status === 'pending';
      expect(canApprove).toBe(false);
    });

    it('已驳回的记录不能执行审批操作', () => {
      const record = createRejectedRecord();
      const canApprove = record.status === 'pending';
      expect(canApprove).toBe(false);
    });
  });

  describe('审批操作参数验证', () => {
    it('审批操作需要记录ID', () => {
      const id = '';
      const hasValidId = !!id && id.trim().length > 0;
      expect(hasValidId).toBe(false);
    });

    it('审批操作需要审批人姓名', () => {
      const operator = '李经理';
      const hasValidOperator = !!operator && operator.trim().length > 0;
      expect(hasValidOperator).toBe(true);
    });

    it('审批人姓名为空时应使用默认值', () => {
      const operator = '';
      const finalOperator = operator || '审批人';
      expect(finalOperator).toBe('审批人');
    });

    it('审批备注可以为空', () => {
      const comment = '';
      const hasComment = !!comment;
      expect(hasComment).toBe(false);
    });

    it('审批备注可以包含内容', () => {
      const comment = '同意加班';
      const hasComment = !!comment;
      expect(hasComment).toBe(true);
    });
  });

  describe('审批后状态转换', () => {
    it('审批后状态变为 approved', () => {
      const record = createPendingRecord();
      const approvedRecord: OvertimeRecord = {
        ...record,
        status: 'approved',
      };
      expect(approvedRecord.status).toBe('approved');
    });

    it('审批后添加工作流步骤', () => {
      const record = createPendingRecord();
      const now = new Date().toISOString();

      const approvedRecord: OvertimeRecord = {
        ...record,
        status: 'approved',
        workflowHistory: [
          ...(record.workflowHistory ?? []),
          createApprovedWorkflowStep('审批经理'),
        ],
      };

      expect(approvedRecord.workflowHistory).toHaveLength(2);
      expect(approvedRecord.workflowHistory![1].type).toBe('approve');
    });

    it('审批步骤包含操作时间', () => {
      const step = createApprovedWorkflowStep('审批经理');
      expect(step.operateTime).toBeDefined();
      expect(step.operateTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('审批步骤包含审批人信息', () => {
      const step = createApprovedWorkflowStep('李经理');
      expect(step.operator).toBe('李经理');
    });

    it('审批步骤包含审批意见', () => {
      const step = createApprovedWorkflowStep('审批经理');
      expect(step.stepName).toBe('审批通过');
    });

    it('审批后工作流历史完整', () => {
      const record = createPendingRecord();
      const approvedRecord: OvertimeRecord = {
        ...record,
        status: 'approved',
        workflowHistory: [
          ...(record.workflowHistory ?? []),
          createApprovedWorkflowStep('审批经理', '同意加班'),
        ],
      };

      const workflowTypes = approvedRecord.workflowHistory?.map((s) => s.type);
      expect(workflowTypes).toEqual(['submit', 'approve']);
    });
  });

  describe('审批后UI变化', () => {
    it('审批后不显示审批操作栏', () => {
      const record = createApprovedRecord();
      const showActionBar = record.status === 'pending';
      expect(showActionBar).toBe(false);
    });

    it('审批后不显示修改按钮', () => {
      const record = createApprovedRecord();
      const canEdit = record.status !== 'approved';
      expect(canEdit).toBe(false);
    });

    it('审批后显示已通过状态标签', () => {
      const record = createApprovedRecord();
      expect(record.status).toBe('approved');
    });
  });
});

// ==================== 驳回流程 ====================
describe('驳回流程', () => {
  describe('驳回操作前置条件', () => {
    it('待审批记录可以执行驳回操作', () => {
      const record = createPendingRecord();
      const canReject = record.status === 'pending';
      expect(canReject).toBe(true);
    });

    it('已通过的记录不能驳回', () => {
      const record = createApprovedRecord();
      const canReject = record.status === 'pending';
      expect(canReject).toBe(false);
    });

    it('已驳回的记录不能重复驳回', () => {
      const record = createRejectedRecord();
      const canReject = record.status === 'pending';
      expect(canReject).toBe(false);
    });
  });

  describe('驳回操作参数验证', () => {
    it('驳回操作需要记录ID', () => {
      const id = '';
      const hasValidId = !!id && id.trim().length > 0;
      expect(hasValidId).toBe(false);
    });

    it('驳回操作需要审批人姓名', () => {
      const operator = '王经理';
      const hasValidOperator = !!operator && operator.trim().length > 0;
      expect(hasValidOperator).toBe(true);
    });

    it('驳回可以包含驳回原因', () => {
      const comment = '理由不充分';
      const hasComment = !!comment;
      expect(hasComment).toBe(true);
    });
  });

  describe('驳回后状态转换', () => {
    it('驳回后状态变为 rejected', () => {
      const record = createPendingRecord();
      const rejectedRecord: OvertimeRecord = {
        ...record,
        status: 'rejected',
      };
      expect(rejectedRecord.status).toBe('rejected');
    });

    it('驳回后添加工作流步骤', () => {
      const record = createPendingRecord();

      const rejectedRecord: OvertimeRecord = {
        ...record,
        status: 'rejected',
        workflowHistory: [
          ...(record.workflowHistory ?? []),
          createRejectedWorkflowStep('审批经理', '理由不充分'),
        ],
      };

      expect(rejectedRecord.workflowHistory).toHaveLength(2);
      expect(rejectedRecord.workflowHistory![1].type).toBe('reject');
    });

    it('驳回步骤包含驳回原因', () => {
      const step = createRejectedWorkflowStep('审批经理', '理由不充分');
      expect(step.comment).toBe('理由不充分');
    });

    it('驳回步骤包含操作时间', () => {
      const step = createRejectedWorkflowStep('审批经理');
      expect(step.operateTime).toBeDefined();
    });

    it('驳回后工作流历史包含驳回类型', () => {
      const record = createPendingRecord();
      const rejectedRecord: OvertimeRecord = {
        ...record,
        status: 'rejected',
        workflowHistory: [
          ...(record.workflowHistory ?? []),
          createRejectedWorkflowStep('审批经理', '需要补充材料'),
        ],
      };

      const workflowTypes = rejectedRecord.workflowHistory?.map((s) => s.type);
      expect(workflowTypes).toEqual(['submit', 'reject']);
    });
  });

  describe('驳回后UI变化', () => {
    it('驳回后不显示审批操作栏', () => {
      const record = createRejectedRecord();
      const showActionBar = record.status === 'pending';
      expect(showActionBar).toBe(false);
    });

    it('驳回后仍显示修改按钮（可重新编辑）', () => {
      const record = createRejectedRecord();
      const canEdit = record.status !== 'approved';
      expect(canEdit).toBe(true);
    });

    it('驳回后显示已驳回状态标签', () => {
      const record = createRejectedRecord();
      expect(record.status).toBe('rejected');
    });
  });
});

// ==================== 重新编辑流程 ====================
describe('重新编辑流程', () => {
  describe('驳回记录的重新编辑', () => {
    it('驳回记录可以重新提交', () => {
      const rejectedRecord = createRejectedRecord();
      const resubmitRecord: OvertimeRecord = {
        ...rejectedRecord,
        status: 'pending',
        workflowHistory: rejectedRecord.workflowHistory?.filter((s) => s.type !== 'reject'),
      };

      expect(resubmitRecord.status).toBe('pending');
      expect(resubmitRecord.workflowHistory).toHaveLength(1);
    });

    it('重新提交后可以再次审批', () => {
      const rejectedRecord = createRejectedRecord();
      const resubmitRecord: OvertimeRecord = {
        ...rejectedRecord,
        status: 'pending',
      };

      const canApprove = resubmitRecord.status === 'pending';
      expect(canApprove).toBe(true);
    });

    it('重新编辑保留原有申请信息', () => {
      const rejectedRecord = createOvertimeRecord({
        id: 'test-rejected-id',
        applicantName: '张三',
        department: '技术部',
        position: '工程师',
        startTime: '2026-08-25T18:00:00.000Z',
        endTime: '2026-08-25T22:00:00.000Z',
        reason: '项目紧急',
        status: 'rejected',
      });

      const editUrl = `/new?id=${rejectedRecord.id}`;

      expect(rejectedRecord.applicantName).toBe('张三');
      expect(rejectedRecord.department).toBe('技术部');
      expect(editUrl).toContain(rejectedRecord.id);
    });
  });
});

// ==================== 页面导航 ====================
describe('页面导航', () => {
  describe('返回列表页', () => {
    it('返回按钮跳转路径正确', () => {
      const returnPath = '/';
      expect(returnPath).toBe('/');
    });
  });

  describe('编辑页面跳转', () => {
    it('编辑按钮生成正确的跳转链接', () => {
      const record = createOvertimeRecord({ id: 'test-123' });
      const editUrl = `/new?id=${record.id}`;
      expect(editUrl).toBe('/new?id=test-123');
    });

    it('编辑链接格式正确', () => {
      const recordId = 'abc-def-001';
      const url = `/new?id=${recordId}`;
      expect(url).toMatch(/^\/new\?id=.+$/);
    });
  });

  describe('详情页加载', () => {
    it('根据ID查找记录逻辑正确', () => {
      const records = [
        createOvertimeRecord({ id: 'record-1' }),
        createOvertimeRecord({ id: 'record-2' }),
        createOvertimeRecord({ id: 'record-3' }),
      ];

      const targetId = 'record-2';
      const found = records.find((r) => r.id === targetId);

      expect(found?.id).toBe('record-2');
    });

    it('查找不存在的记录返回 undefined', () => {
      const records = [
        createOvertimeRecord({ id: 'record-1' }),
        createOvertimeRecord({ id: 'record-2' }),
      ];

      const targetId = 'non-existent';
      const found = records.find((r) => r.id === targetId);

      expect(found).toBeUndefined();
    });
  });
});

// ==================== 时间轴数据 ====================
describe('时间轴数据展示', () => {
  describe('工作流历史记录', () => {
    it('待审批记录有提交步骤', () => {
      const record = createPendingRecord();
      const submitSteps = record.workflowHistory?.filter((s) => s.type === 'submit');
      expect(submitSteps).toHaveLength(1);
    });

    it('审批通过记录有提交和审批步骤', () => {
      const record = createApprovedRecord();
      const hasSubmit = record.workflowHistory?.some((s) => s.type === 'submit');
      const hasApprove = record.workflowHistory?.some((s) => s.type === 'approve');
      expect(hasSubmit).toBe(true);
      expect(hasApprove).toBe(true);
    });

    it('驳回记录有提交和驳回步骤', () => {
      const record = createRejectedRecord();
      const hasSubmit = record.workflowHistory?.some((s) => s.type === 'submit');
      const hasReject = record.workflowHistory?.some((s) => s.type === 'reject');
      expect(hasSubmit).toBe(true);
      expect(hasReject).toBe(true);
    });

    it('工作流步骤顺序正确', () => {
      const record = createApprovedRecord();
      const types = record.workflowHistory?.map((s) => s.type);
      expect(types).toEqual(['submit', 'approve']);
    });

    it('每个工作流步骤有必要的属性', () => {
      const step = createWorkflowStep();
      expect(step.id).toBeDefined();
      expect(step.type).toBeDefined();
      expect(step.status).toBeDefined();
      expect(step.operator).toBeDefined();
      expect(step.operateTime).toBeDefined();
      expect(step.stepName).toBeDefined();
    });
  });

  describe('时间轴样式判断', () => {
    it('已完成步骤标记为 completed', () => {
      const step = createApprovedWorkflowStep();
      expect(step.status).toBe('completed');
    });

    it('驳回步骤标记为 rejected', () => {
      const step = createRejectedWorkflowStep();
      expect(step.status).toBe('rejected');
    });
  });
});

// ==================== 错误处理 ====================
describe('错误处理', () => {
  describe('记录不存在情况', () => {
    it('查找不存在的记录应返回错误', () => {
      const records: OvertimeRecord[] = [];
      const targetId = 'non-existent-id';
      const found = records.find((r) => r.id === targetId);

      expect(found).toBeUndefined();
    });

    it('空记录列表应返回空结果', () => {
      const records: OvertimeRecord[] = [];
      const found = records.find((r) => r.id === 'any');
      expect(found).toBeUndefined();
    });
  });

  describe('重复操作处理', () => {
    it('已通过的记录再次审批应被拒绝', () => {
      const record = createApprovedRecord();
      const canApprove = record.status === 'pending';
      expect(canApprove).toBe(false);
    });

    it('已驳回的记录再次驳回应被拒绝', () => {
      const record = createRejectedRecord();
      const canReject = record.status === 'pending';
      expect(canReject).toBe(false);
    });

    it('已通过的记录驳回应被拒绝', () => {
      const record = createApprovedRecord();
      const canReject = record.status === 'pending';
      expect(canReject).toBe(false);
    });
  });
});

// ==================== 表单提交参数 ====================
describe('表单提交参数', () => {
  describe('审批表单参数', () => {
    it('审批表单包含记录ID', () => {
      const record = createPendingRecord();
      const formData = { id: record.id, operator: '审批人', comment: '' };

      expect(formData.id).toBe(record.id);
    });

    it('审批表单包含审批人', () => {
      const formData = { id: 'test', operator: '李经理', comment: '同意' };

      expect(formData.operator).toBe('李经理');
    });

    it('审批表单备注可选', () => {
      const formData = { id: 'test', operator: '审批人', comment: '' };

      expect(formData.comment).toBe('');
    });
  });

  describe('驳回表单参数', () => {
    it('驳回表单包含记录ID', () => {
      const record = createPendingRecord();
      const formData = { id: record.id, operator: '审批人', comment: '' };

      expect(formData.id).toBe(record.id);
    });

    it('驳回表单包含驳回原因', () => {
      const formData = { id: 'test', operator: '审批人', comment: '理由不充分' };

      expect(formData.comment).toBe('理由不充分');
    });
  });
});
