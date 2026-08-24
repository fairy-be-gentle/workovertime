import { describe, it, expect } from 'vitest';

// 复制测试所需的工具函数
function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}小时`;
  return `${h}小时${m}分钟`;
}

type ApplicationStatus = 'pending' | 'approved' | 'rejected';

function getStatusText(status: ApplicationStatus): string {
  const statusMap: Record<ApplicationStatus, string> = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已驳回'
  };
  return statusMap[status];
}

function getStatusStyle(status: ApplicationStatus): string {
  const styleMap: Record<ApplicationStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200'
  };
  return styleMap[status];
}

describe('工具函数测试', () => {
  describe('calculateDuration', () => {
    it('正确计算加班时长', () => {
      const duration = calculateDuration(
        '2026-08-25T18:00:00.000Z',
        '2026-08-25T22:00:00.000Z'
      );
      expect(duration).toBe(4);
    });

    it('处理半小时加班', () => {
      const duration = calculateDuration(
        '2026-08-25T18:00:00.000Z',
        '2026-08-25T18:30:00.000Z'
      );
      expect(duration).toBe(0.5);
    });

    it('处理跨天加班', () => {
      const duration = calculateDuration(
        '2026-08-25T22:00:00.000Z',
        '2026-08-26T02:00:00.000Z'
      );
      expect(duration).toBe(4);
    });
  });

  describe('formatDuration', () => {
    it('格式化整小时', () => {
      expect(formatDuration(4)).toBe('4小时');
    });

    it('格式化小时和分钟', () => {
      expect(formatDuration(2.5)).toBe('2小时30分钟');
    });

    it('处理边界情况', () => {
      expect(formatDuration(0)).toBe('0小时');
      expect(formatDuration(0.5)).toBe('0小时30分钟');
    });
  });

  describe('getStatusText', () => {
    it('返回正确的状态文本', () => {
      expect(getStatusText('pending')).toBe('待审批');
      expect(getStatusText('approved')).toBe('已通过');
      expect(getStatusText('rejected')).toBe('已驳回');
    });
  });

  describe('getStatusStyle', () => {
    it('返回正确的状态样式', () => {
      expect(getStatusStyle('pending')).toContain('yellow');
      expect(getStatusStyle('approved')).toContain('green');
      expect(getStatusStyle('rejected')).toContain('red');
    });
  });
});

describe('OvertimeRecord 类型验证', () => {
  const mockRecord = {
    id: 'test-123',
    applicantName: '张三',
    department: '技术部',
    position: '高级工程师',
    startTime: '2026-08-25T18:00:00.000Z',
    endTime: '2026-08-25T22:00:00.000Z',
    duration: 4,
    reason: '项目紧急上线需要加班处理',
    submitTime: '2026-08-24T10:00:00.000Z',
    status: 'pending' as const
  };

  it('记录包含所有必需字段', () => {
    expect(mockRecord).toHaveProperty('id');
    expect(mockRecord).toHaveProperty('applicantName');
    expect(mockRecord).toHaveProperty('department');
    expect(mockRecord).toHaveProperty('position');
    expect(mockRecord).toHaveProperty('startTime');
    expect(mockRecord).toHaveProperty('endTime');
    expect(mockRecord).toHaveProperty('duration');
    expect(mockRecord).toHaveProperty('reason');
    expect(mockRecord).toHaveProperty('submitTime');
    expect(mockRecord).toHaveProperty('status');
  });

  it('状态值有效', () => {
    const validStatuses = ['pending', 'approved', 'rejected'];
    expect(validStatuses).toContain(mockRecord.status);
  });

  it('时长计算正确', () => {
    const duration = calculateDuration(mockRecord.startTime, mockRecord.endTime);
    expect(duration).toBe(mockRecord.duration);
  });
});

describe('ApplicationStatus 类型', () => {
  it('应该只有三种状态', () => {
    const statuses: ('pending' | 'approved' | 'rejected')[] = [
      'pending', 
      'approved', 
      'rejected'
    ];
    expect(statuses).toHaveLength(3);
  });

  it('每种状态都有对应的文本和样式', () => {
    const allStatuses: ('pending' | 'approved' | 'rejected')[] = ['pending', 'approved', 'rejected'];
    allStatuses.forEach(status => {
      expect(getStatusText(status)).toBeTruthy();
      expect(getStatusStyle(status)).toBeTruthy();
    });
  });
});

describe('表单预览功能测试', () => {
  interface OvertimeFormData {
    applicantName: string;
    department: string;
    position: string;
    startTime: string;
    endTime: string;
    reason: string;
  }

  function validateForm(data: OvertimeFormData): Record<string, string> {
    const errors: Record<string, string> = {};
    
    if (!data.applicantName.trim()) {
      errors.applicantName = '请输入申请人姓名';
    }
    if (!data.department) {
      errors.department = '请选择部门';
    }
    if (!data.position) {
      errors.position = '请选择职位';
    }
    if (!data.startTime) {
      errors.startTime = '请选择开始时间';
    }
    if (!data.endTime) {
      errors.endTime = '请选择结束时间';
    }
    if (data.startTime && data.endTime) {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      if (end <= start) {
        errors.endTime = '结束时间必须大于开始时间';
      }
    }
    if (!data.reason.trim()) {
      errors.reason = '请输入加班事由';
    } else if (data.reason.trim().length < 5) {
      errors.reason = '加班事由至少需要5个字符';
    }
    return errors;
  }

  it('验证通过时应无错误', () => {
    const validData: OvertimeFormData = {
      applicantName: '张三',
      department: '技术部',
      position: '工程师',
      startTime: '2026-08-25T18:00',
      endTime: '2026-08-25T22:00',
      reason: '项目紧急上线'
    };
    const errors = validateForm(validData);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('缺少申请人姓名应返回错误', () => {
    const data: OvertimeFormData = {
      applicantName: '',
      department: '技术部',
      position: '工程师',
      startTime: '2026-08-25T18:00',
      endTime: '2026-08-25T22:00',
      reason: '项目紧急上线'
    };
    const errors = validateForm(data);
    expect(errors).toHaveProperty('applicantName');
  });

  it('结束时间早于开始时间应返回错误', () => {
    const data: OvertimeFormData = {
      applicantName: '张三',
      department: '技术部',
      position: '工程师',
      startTime: '2026-08-25T22:00',
      endTime: '2026-08-25T18:00',
      reason: '项目紧急上线'
    };
    const errors = validateForm(data);
    expect(errors).toHaveProperty('endTime');
  });

  it('加班事由过短应返回错误', () => {
    const data: OvertimeFormData = {
      applicantName: '张三',
      department: '技术部',
      position: '工程师',
      startTime: '2026-08-25T18:00',
      endTime: '2026-08-25T22:00',
      reason: '加班'
    };
    const errors = validateForm(data);
    expect(errors).toHaveProperty('reason');
  });
});

describe('表单提交功能测试', () => {
  function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  interface OvertimeFormData {
    applicantName: string;
    department: string;
    position: string;
    startTime: string;
    endTime: string;
    reason: string;
  }

  function createRecord(data: OvertimeFormData) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    const duration = calculateDuration(data.startTime, data.endTime);
    const now = new Date().toISOString();
    
    return {
      id: generateId(),
      applicantName: data.applicantName.trim(),
      department: data.department,
      position: data.position,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      duration,
      reason: data.reason.trim(),
      submitTime: now,
      status: 'pending' as const,
      workflowHistory: [
        {
          id: generateId(),
          type: 'submit' as const,
          status: 'completed' as const,
          operator: data.applicantName.trim(),
          operateTime: now,
          stepName: '提交申请'
        }
      ]
    };
  }

  it('创建记录应生成唯一ID', () => {
    const data: OvertimeFormData = {
      applicantName: '张三',
      department: '技术部',
      position: '工程师',
      startTime: '2026-08-25T18:00',
      endTime: '2026-08-25T22:00',
      reason: '项目紧急上线需要加班处理'
    };
    
    const record1 = createRecord(data);
    const record2 = createRecord(data);
    
    expect(record1.id).not.toBe(record2.id);
  });

  it('创建记录应设置正确的基础信息', () => {
    const data: OvertimeFormData = {
      applicantName: '李四',
      department: '产品部',
      position: '产品经理',
      startTime: '2026-08-25T09:00',
      endTime: '2026-08-25T18:00',
      reason: '产品上线准备'
    };
    
    const record = createRecord(data);
    
    expect(record.applicantName).toBe('李四');
    expect(record.department).toBe('产品部');
    expect(record.position).toBe('产品经理');
    expect(record.reason).toBe('产品上线准备');
    expect(record.status).toBe('pending');
  });

  it('创建记录应包含工作流历史', () => {
    const data: OvertimeFormData = {
      applicantName: '张三',
      department: '技术部',
      position: '工程师',
      startTime: '2026-08-25T18:00',
      endTime: '2026-08-25T22:00',
      reason: '项目紧急上线'
    };
    
    const record = createRecord(data);
    
    expect(record.workflowHistory).toHaveLength(1);
    expect(record.workflowHistory[0].type).toBe('submit');
    expect(record.workflowHistory[0].stepName).toBe('提交申请');
  });
});

describe('表单修改功能测试', () => {
  interface OvertimeRecord {
    id: string;
    applicantName: string;
    department: string;
    position: string;
    startTime: string;
    endTime: string;
    duration: number;
    reason: string;
    submitTime: string;
    status: 'pending' | 'approved' | 'rejected';
    workflowHistory: Array<{
      id: string;
      type: string;
      status: string;
      operator: string;
      operateTime: string;
      stepName: string;
    }>;
  }

  function updateRecord(record: OvertimeRecord, updates: Partial<OvertimeRecord>): OvertimeRecord {
    const updatedRecord = { ...record, ...updates };
    if (updates.startTime || updates.endTime) {
      updatedRecord.duration = calculateDuration(
        updatedRecord.startTime,
        updatedRecord.endTime
      );
    }
    return updatedRecord;
  }

  it('修改申请人姓名', () => {
    const record: OvertimeRecord = {
      id: 'test-1',
      applicantName: '张三',
      department: '技术部',
      position: '工程师',
      startTime: '2026-08-25T18:00:00.000Z',
      endTime: '2026-08-25T22:00:00.000Z',
      duration: 4,
      reason: '项目紧急上线',
      submitTime: '2026-08-24T10:00:00.000Z',
      status: 'pending',
      workflowHistory: []
    };
    
    const updated = updateRecord(record, { applicantName: '王五' });
    
    expect(updated.applicantName).toBe('王五');
    expect(updated.department).toBe('技术部');
  });

  it('修改时间应重新计算时长', () => {
    const record: OvertimeRecord = {
      id: 'test-1',
      applicantName: '张三',
      department: '技术部',
      position: '工程师',
      startTime: '2026-08-25T18:00:00.000Z',
      endTime: '2026-08-25T22:00:00.000Z',
      duration: 4,
      reason: '项目紧急上线',
      submitTime: '2026-08-24T10:00:00.000Z',
      status: 'pending',
      workflowHistory: []
    };
    
    const updated = updateRecord(record, {
      startTime: '2026-08-25T18:00:00.000Z',
      endTime: '2026-08-25T23:00:00.000Z'
    });
    
    expect(updated.duration).toBe(5);
  });

  it('修改加班事由', () => {
    const record: OvertimeRecord = {
      id: 'test-1',
      applicantName: '张三',
      department: '技术部',
      position: '工程师',
      startTime: '2026-08-25T18:00:00.000Z',
      endTime: '2026-08-25T22:00:00.000Z',
      duration: 4,
      reason: '项目紧急上线',
      submitTime: '2026-08-24T10:00:00.000Z',
      status: 'pending',
      workflowHistory: []
    };
    
    const updated = updateRecord(record, { reason: '版本发布需要加班支持' });
    
    expect(updated.reason).toBe('版本发布需要加班支持');
  });
});
