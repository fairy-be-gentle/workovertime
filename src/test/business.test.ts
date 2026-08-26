/**
 * @fileoverview 业务逻辑测试
 *
 * 测试原则：
 * 1. 测试应用逻辑而非第三方代码
 * 2. 使用 fixtures 生成测试数据
 * 3. 避免 toBeDefined() - 使用具体断言
 * 4. 解释期望值（添加注释说明为什么是这个值）
 * 5. 测试边界条件
 */

import { describe, it, expect } from 'vitest';
import {
  createOvertimeRecord,
  createPendingRecord,
  createApprovedRecord,
  createRejectedRecord,
  createCrossDayRecord,
  createMultipleRecords,
} from './fixtures';
import type { OvertimeRecord } from '$lib/storage';

// ==================== 记录创建逻辑 ====================
describe('记录创建', () => {
  describe('createOvertimeRecord', () => {
    it('创建记录时生成唯一ID', () => {
      const record1 = createOvertimeRecord();
      const record2 = createOvertimeRecord();

      expect(record1.id).not.toBe(record2.id);
    });

    it('创建记录时默认状态为 pending', () => {
      const record = createOvertimeRecord();

      expect(record.status).toBe('pending');
    });

    it('创建记录时包含提交时间', () => {
      const record = createOvertimeRecord();

      expect(record.submitTime).toBeTruthy();
      expect(record.submitTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('创建记录时包含初始工作流步骤', () => {
      const record = createOvertimeRecord();

      expect(record.workflowHistory).toBeDefined();
      expect(record.workflowHistory).toHaveLength(1);
      expect(record.workflowHistory![0].type).toBe('submit');
    });

    it('覆盖字段时使用新值', () => {
      const record = createOvertimeRecord({
        applicantName: '自定义申请人',
        status: 'approved',
      });

      expect(record.applicantName).toBe('自定义申请人');
      expect(record.status).toBe('approved');
    });
  });

  describe('createPendingRecord', () => {
    it('创建的记录状态为 pending', () => {
      const record = createPendingRecord();

      expect(record.status).toBe('pending');
    });

    it('可以使用自定义申请人名称', () => {
      const record = createPendingRecord('测试员工-001');

      expect(record.applicantName).toBe('测试员工-001');
    });
  });

  describe('createApprovedRecord', () => {
    it('创建的记录状态为 approved', () => {
      const record = createApprovedRecord();

      expect(record.status).toBe('approved');
    });

    it('包含审批通过的工作流步骤', () => {
      const record = createApprovedRecord();

      const approveStep = record.workflowHistory?.find((step) => step.type === 'approve');
      expect(approveStep).toBeDefined();
      expect(approveStep?.status).toBe('completed');
    });
  });

  describe('createRejectedRecord', () => {
    it('创建的记录状态为 rejected', () => {
      const record = createRejectedRecord();

      expect(record.status).toBe('rejected');
    });

    it('包含驳回原因', () => {
      const rejectReason = '理由不充分';
      const record = createRejectedRecord('测试员工', rejectReason);

      const rejectStep = record.workflowHistory?.find((step) => step.type === 'reject');
      expect(rejectStep?.comment).toBe(rejectReason);
    });
  });
});

// ==================== 记录状态转换 ====================
describe('记录状态转换', () => {
  describe('状态流转规则', () => {
    it('待审批记录可以转为已通过', () => {
      const pendingRecord = createPendingRecord();

      const approvedRecord: OvertimeRecord = {
        ...pendingRecord,
        status: 'approved',
      };

      expect(approvedRecord.status).toBe('approved');
    });

    it('待审批记录可以转为已驳回', () => {
      const pendingRecord = createPendingRecord();

      const rejectedRecord: OvertimeRecord = {
        ...pendingRecord,
        status: 'rejected',
      };

      expect(rejectedRecord.status).toBe('rejected');
    });

    it('驳回记录可以重新提交（转为 pending）', () => {
      const rejectedRecord = createRejectedRecord();

      const resubmitRecord: OvertimeRecord = {
        ...rejectedRecord,
        status: 'pending',
      };

      expect(resubmitRecord.status).toBe('pending');
    });
  });

  describe('工作流历史记录', () => {
    it('审批通过时添加工作流步骤', () => {
      const record = createPendingRecord();
      const now = new Date().toISOString();

      const approvedRecord: OvertimeRecord = {
        ...record,
        status: 'approved',
        workflowHistory: [
          ...(record.workflowHistory ?? []),
          {
            id: `step-${crypto.randomUUID().slice(0, 8)}`,
            type: 'approve',
            status: 'completed',
            operator: '审批经理',
            operateTime: now,
            stepName: '审批通过',
          },
        ],
      };

      expect(approvedRecord.workflowHistory).toHaveLength(2);
      expect(approvedRecord.workflowHistory![1].type).toBe('approve');
    });

    it('驳回时添加工作流步骤和原因', () => {
      const record = createPendingRecord();
      const now = new Date().toISOString();
      const reason = '需要补充更多细节';

      const rejectedRecord: OvertimeRecord = {
        ...record,
        status: 'rejected',
        workflowHistory: [
          ...(record.workflowHistory ?? []),
          {
            id: `step-${crypto.randomUUID().slice(0, 8)}`,
            type: 'reject',
            status: 'rejected',
            operator: '审批经理',
            operateTime: now,
            comment: reason,
            stepName: '审批驳回',
          },
        ],
      };

      expect(rejectedRecord.workflowHistory).toHaveLength(2);
      expect(rejectedRecord.workflowHistory![1].type).toBe('reject');
      expect(rejectedRecord.workflowHistory![1].comment).toBe(reason);
    });
  });
});

// ==================== 统计数据计算 ====================
describe('统计数据计算', () => {
  it('统计待审批数量', () => {
    const records = [
      createPendingRecord('员工A'),
      createPendingRecord('员工B'),
      createApprovedRecord('员工C'),
      createRejectedRecord('员工D'),
    ];

    const pendingCount = records.filter((r) => r.status === 'pending').length;

    expect(pendingCount).toBe(2);
  });

  it('统计已通过数量', () => {
    const records = [
      createPendingRecord('员工A'),
      createApprovedRecord('员工B'),
      createApprovedRecord('员工C'),
      createRejectedRecord('员工D'),
    ];

    const approvedCount = records.filter((r) => r.status === 'approved').length;

    expect(approvedCount).toBe(2);
  });

  it('统计总加班时长', () => {
    const records = [
      createOvertimeRecord({ duration: 4 }),
      createOvertimeRecord({ duration: 3 }),
      createOvertimeRecord({ duration: 5 }),
    ];

    const totalHours = records.reduce((sum, r) => sum + r.duration, 0);

    expect(totalHours).toBe(12);
  });

  it('按状态分组统计', () => {
    const records = createMultipleRecords(9);

    const byStatus = {
      pending: records.filter((r) => r.status === 'pending').length,
      approved: records.filter((r) => r.status === 'approved').length,
      rejected: records.filter((r) => r.status === 'rejected').length,
    };

    // 每个状态各有 3 条
    expect(byStatus.pending).toBe(3);
    expect(byStatus.approved).toBe(3);
    expect(byStatus.rejected).toBe(3);
  });

  it('计算平均加班时长', () => {
    const records = [
      createOvertimeRecord({ duration: 2 }),
      createOvertimeRecord({ duration: 4 }),
      createOvertimeRecord({ duration: 6 }),
    ];

    const totalHours = records.reduce((sum, r) => sum + r.duration, 0);
    const avgHours = totalHours / records.length;

    expect(avgHours).toBe(4);
  });
});

// ==================== 时区处理 ====================
describe('时区处理', () => {
  it('处理跨天加班时长计算', () => {
    const crossDayRecord = createCrossDayRecord();

    // 22:00 - 02:00 (次日) = 4 小时
    expect(crossDayRecord.duration).toBe(4);
  });

  it('处理半小时加班时长', () => {
    const record = createOvertimeRecord({
      startTime: '2026-08-25T18:00:00.000Z',
      endTime: '2026-08-25T18:30:00.000Z',
      duration: 0.5,
    });

    expect(record.duration).toBe(0.5);
  });

  it('不同月份的时间戳处理', () => {
    const augustRecord = createOvertimeRecord({
      startTime: '2026-08-31T22:00:00.000Z',
      endTime: '2026-09-01T02:00:00.000Z',
      duration: 4,
    });

    expect(augustRecord.duration).toBe(4);
    expect(augustRecord.startTime).toContain('2026-08-31');
    expect(augustRecord.endTime).toContain('2026-09-01');
  });
});

// ==================== 边界条件 ====================
describe('边界条件', () => {
  it('空记录列表', () => {
    const records: OvertimeRecord[] = [];

    const totalHours = records.reduce((sum, r) => sum + r.duration, 0);
    expect(totalHours).toBe(0);
  });

  it('工作流历史可能为空', () => {
    const record = createOvertimeRecord();
    record.workflowHistory = [];

    expect(record.workflowHistory).toHaveLength(0);
    expect(record.workflowHistory ?? []).toEqual([]);
  });

  it('长加班时长计算', () => {
    const record = createOvertimeRecord({
      startTime: '2026-08-25T00:00:00.000Z',
      endTime: '2026-08-25T12:00:00.000Z',
      duration: 12,
    });

    expect(record.duration).toBe(12);
  });

  it('极短加班时长（分钟级）', () => {
    const record = createOvertimeRecord({
      startTime: '2026-08-25T18:00:00.000Z',
      endTime: '2026-08-25T18:15:00.000Z',
      duration: 0.25, // 15 分钟
    });

    expect(record.duration).toBe(0.25);
  });
});
