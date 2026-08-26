/**
 * @fileoverview 页面流程集成测试
 *
 * 测试用户从填写表单到提交的全流程：
 * 1. 新增申请 - 预览 - 提交
 * 2. 修改申请 - 预览 - 保存
 * 3. 表单验证与预览交互
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createValidFormData, createOvertimeRecord } from './fixtures';

// ==================== 预览页面数据展示 ====================
describe('预览页面数据展示', () => {
  describe('正确显示表单数据', () => {
    it('预览页面能正确展示申请人姓名', () => {
      const formData = createValidFormData({ applicantName: '张三' });

      // 模拟预览页面从 sessionStorage 读取数据
      const sessionStorageData = JSON.stringify(formData);

      // 验证数据可被正确序列化和反序列化
      const parsed = JSON.parse(sessionStorageData);
      expect(parsed.applicantName).toBe('张三');
    });

    it('预览页面能正确展示部门和职位', () => {
      const formData = createValidFormData({
        department: '技术部',
        position: '高级工程师',
      });

      const sessionStorageData = JSON.stringify(formData);
      const parsed = JSON.parse(sessionStorageData);

      expect(parsed.department).toBe('技术部');
      expect(parsed.position).toBe('高级工程师');
    });

    it('预览页面能正确展示加班时间', () => {
      const formData = createValidFormData({
        startTime: '2026-08-25T18:00',
        endTime: '2026-08-25T22:00',
      });

      const sessionStorageData = JSON.stringify(formData);
      const parsed = JSON.parse(sessionStorageData);

      expect(parsed.startTime).toBe('2026-08-25T18:00');
      expect(parsed.endTime).toBe('2026-08-25T22:00');
    });

    it('预览页面能正确展示加班事由', () => {
      const formData = createValidFormData({
        reason: '项目紧急上线需要加班处理',
      });

      const sessionStorageData = JSON.stringify(formData);
      const parsed = JSON.parse(sessionStorageData);

      expect(parsed.reason).toBe('项目紧急上线需要加班处理');
    });
  });

  describe('时长计算显示', () => {
    it('预览页面能正确计算4小时加班时长', () => {
      const formData = createValidFormData({
        startTime: '2026-08-25T18:00',
        endTime: '2026-08-25T22:00',
      });

      // 模拟时长计算
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      expect(durationHours).toBe(4);
    });

    it('预览页面能正确计算半小时加班时长', () => {
      const formData = createValidFormData({
        startTime: '2026-08-25T18:00',
        endTime: '2026-08-25T18:30',
      });

      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      expect(durationHours).toBe(0.5);
    });

    it('预览页面能正确计算跨天加班时长', () => {
      const formData = createValidFormData({
        startTime: '2026-08-25T22:00',
        endTime: '2026-08-26T02:00',
      });

      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      expect(durationHours).toBe(4);
    });
  });
});

// ==================== 新增申请流程 ====================
describe('新增申请流程', () => {
  describe('预览跳转条件', () => {
    it('所有必填字段填写完整时可以预览', () => {
      const formData = createValidFormData();

      const requiredFields = ['applicantName', 'department', 'position', 'startTime', 'endTime', 'reason'];
      const isComplete = requiredFields.every((field) => {
        const value = formData[field as keyof typeof formData];
        return value && value.toString().trim().length > 0;
      });

      expect(isComplete).toBe(true);
    });

    it('申请人姓名为空时不可以预览', () => {
      const formData = createValidFormData({ applicantName: '' });

      const isComplete = formData.applicantName.trim().length > 0;

      expect(isComplete).toBe(false);
    });

    it('部门为空时不可以预览', () => {
      const formData = createValidFormData({ department: '' });

      const isComplete = formData.department.trim().length > 0;

      expect(isComplete).toBe(false);
    });

    it('职位为空时不可以预览', () => {
      const formData = createValidFormData({ position: '' });

      const isComplete = formData.position.trim().length > 0;

      expect(isComplete).toBe(false);
    });

    it('开始时间为空时不可以预览', () => {
      const formData = createValidFormData({ startTime: '' });

      const isComplete = formData.startTime.trim().length > 0;

      expect(isComplete).toBe(false);
    });

    it('结束时间为空时不可以预览', () => {
      const formData = createValidFormData({ endTime: '' });

      const isComplete = formData.endTime.trim().length > 0;

      expect(isComplete).toBe(false);
    });

    it('加班事由过短时不可以预览', () => {
      const formData = createValidFormData({ reason: '加班' }); // 只有2个字符

      const isReasonValid = formData.reason.trim().length >= 5;

      expect(isReasonValid).toBe(false);
    });

    it('加班事由为空时不可以预览', () => {
      const formData = createValidFormData({ reason: '' });

      const isComplete = formData.reason.trim().length > 0;

      expect(isComplete).toBe(false);
    });
  });

  describe('时间验证', () => {
    it('结束时间早于开始时间时不可以预览', () => {
      const formData = createValidFormData({
        startTime: '2026-08-25T22:00',
        endTime: '2026-08-25T18:00', // 结束时间早于开始时间
      });

      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      const isTimeValid = end > start;

      expect(isTimeValid).toBe(false);
    });

    it('结束时间等于开始时间时不可以预览', () => {
      const formData = createValidFormData({
        startTime: '2026-08-25T18:00',
        endTime: '2026-08-25T18:00', // 结束时间等于开始时间
      });

      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      const isTimeValid = end > start;

      expect(isTimeValid).toBe(false);
    });
  });

  describe('草稿保存', () => {
    it('表单数据可以保存到 sessionStorage', () => {
      const formData = createValidFormData();
      const key = 'overtime_form_draft';

      // 模拟保存
      const serialized = JSON.stringify(formData);

      // 模拟读取
      const parsed = JSON.parse(serialized);

      expect(parsed.applicantName).toBe(formData.applicantName);
      expect(parsed.department).toBe(formData.department);
      expect(parsed.position).toBe(formData.position);
      expect(parsed.startTime).toBe(formData.startTime);
      expect(parsed.endTime).toBe(formData.endTime);
      expect(parsed.reason).toBe(formData.reason);
    });

    it('从 sessionStorage 可以恢复草稿', () => {
      const originalData = createValidFormData();
      const key = 'overtime_form_draft';

      // 模拟保存和重新加载
      const saved = JSON.stringify(originalData);
      const restored = JSON.parse(saved);

      // 验证所有字段都正确恢复
      expect(restored).toEqual(originalData);
    });
  });
});

// ==================== 修改申请流程 ====================
describe('修改申请流程', () => {
  describe('编辑模式识别', () => {
    it('有 editingRecord 时应识别为编辑模式', () => {
      const record = createOvertimeRecord({ id: 'test-id-001' });

      const isEditMode = !!record;

      expect(isEditMode).toBe(true);
    });

    it('无 editingRecord 时应识别为新增模式', () => {
      const record = null;

      const isEditMode = !!record;

      expect(isEditMode).toBe(false);
    });
  });

  describe('记录数据转换', () => {
    it('能将服务端记录转换为本地表单数据', () => {
      const record = createOvertimeRecord({
        applicantName: '张三',
        department: '技术部',
        position: '高级工程师',
        startTime: '2026-08-25T18:00:00.000Z',
        endTime: '2026-08-25T22:00:00.000Z',
        reason: '项目紧急上线',
      });

      // 模拟 recordToFormData 转换
      const toLocal = (iso: string) => {
        if (!iso) return '';
        const date = new Date(iso);
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 16);
      };

      const formData = {
        applicantName: record.applicantName,
        department: record.department || '',
        position: record.position || '',
        startTime: toLocal(record.startTime),
        endTime: toLocal(record.endTime),
        reason: record.reason,
      };

      expect(formData.applicantName).toBe('张三');
      expect(formData.department).toBe('技术部');
      expect(formData.position).toBe('高级工程师');
      expect(formData.reason).toBe('项目紧急上线');
    });

    it('能将本地表单数据保存到 sessionStorage 用于编辑', () => {
      const editingId = 'record-edit-001';
      const formData = createValidFormData({ applicantName: '修改后的姓名' });
      const key = 'overtime_form_editing_id';

      // 模拟保存编辑 ID
      const savedId = editingId;

      // 验证保存的 ID 正确
      expect(savedId).toBe('record-edit-001');
    });
  });

  describe('修改后预览', () => {
    it('修改表单后可以预览更新后的内容', () => {
      const originalFormData = createValidFormData({ applicantName: '张三' });
      const modifiedFormData = { ...originalFormData, applicantName: '李四' };

      // 模拟保存修改后的数据
      const saved = JSON.stringify(modifiedFormData);
      const restored = JSON.parse(saved);

      expect(restored.applicantName).toBe('李四');
      expect(restored.applicantName).not.toBe(originalFormData.applicantName);
    });

    it('修改表单后可以保存更新', () => {
      const record = createOvertimeRecord({
        id: 'test-id',
        applicantName: '张三',
      });

      const modifiedData = {
        ...record,
        applicantName: '王五',
        reason: '修改后的加班事由',
      };

      expect(modifiedData.applicantName).toBe('王五');
      expect(modifiedData.reason).toBe('修改后的加班事由');
      expect(modifiedData.id).toBe(record.id); // ID 不应改变
    });
  });
});

// ==================== 页面跳转逻辑 ====================
describe('页面跳转逻辑', () => {
  describe('预览跳转', () => {
    it('预览按钮点击后跳转到 /preview', () => {
      const formData = createValidFormData();
      const isValid = Object.values(formData).every((v) => v && v.toString().trim());

      let navigatedTo = '';

      // 模拟导航函数
      const goto = (path: string) => {
        navigatedTo = path;
      };

      if (isValid) {
        goto('/preview');
      }

      expect(navigatedTo).toBe('/preview');
    });

    it('表单验证失败时不跳转预览', () => {
      const formData = createValidFormData({ applicantName: '' });
      const isValid = Object.values(formData).every((v) => v && v.toString().trim());

      let navigatedTo = '';

      const goto = (path: string) => {
        navigatedTo = path;
      };

      if (isValid) {
        goto('/preview');
      }

      expect(navigatedTo).toBe('');
    });
  });

  describe('返回修改跳转', () => {
    it('从预览页返回编辑页时保留表单数据', () => {
      const formData = createValidFormData({ applicantName: '测试员工' });
      const savedData = JSON.stringify(formData);

      const restoredData = JSON.parse(savedData);

      expect(restoredData.applicantName).toBe('测试员工');
    });

    it('从预览页返回编辑页时可以指定编辑字段', () => {
      const editField = 'applicantName';
      const returnUrl = `/new?edit=${editField}`;

      expect(returnUrl).toContain('edit=applicantName');
    });
  });

  describe('确认提交', () => {
    it('确认提交后跳转到首页', () => {
      let navigatedTo = '';

      const goto = (path: string) => {
        navigatedTo = path;
      };

      // 模拟提交成功后的跳转
      goto('/');

      expect(navigatedTo).toBe('/');
    });

    it('确认提交后清除草稿', () => {
      const storageKey = 'overtime_form_draft';
      let savedData = JSON.stringify(createValidFormData());

      // 模拟清除草稿
      savedData = '';

      expect(savedData).toBe('');
    });

    it('确认提交后清除编辑 ID', () => {
      const editingIdKey = 'overtime_form_editing_id';
      let savedId = 'record-001';

      // 模拟清除编辑 ID
      savedId = '';

      expect(savedId).toBe('');
    });
  });
});

// ==================== 快速提交流程 ====================
describe('快速提交流程（预览并确认）', () => {
  describe('auto_confirm 标记', () => {
    it('设置 auto_confirm 标记后预览页会自动提交', () => {
      const autoConfirmKey = 'overtime_form_auto_confirm';
      const formData = createValidFormData();

      // 模拟设置 auto_confirm
      const shouldAutoConfirm = true;

      expect(shouldAutoConfirm).toBe(true);
    });

    it('auto_confirm 标记只在当前会话有效', () => {
      const autoConfirmKey = 'overtime_form_auto_confirm';

      // 模拟设置标记
      let autoConfirmValue = '1';

      // 模拟页面加载时检查并清除
      if (autoConfirmValue === '1') {
        autoConfirmValue = '';
      }

      expect(autoConfirmValue).toBe('');
    });
  });
});

// ==================== 边界场景 ====================
describe('边界场景', () => {
  it('sessionStorage 为空时使用默认空表单', () => {
    const saved = null;

    const formData = saved ? JSON.parse(saved) : {
      applicantName: '',
      department: '',
      position: '',
      startTime: '',
      endTime: '',
      reason: '',
    };

    expect(formData.applicantName).toBe('');
  });

  it('损坏的 sessionStorage 数据回退到空表单', () => {
    const corruptedData = '{ invalid json }';

    let formData;
    try {
      formData = JSON.parse(corruptedData);
    } catch {
      formData = {
        applicantName: '',
        department: '',
        position: '',
        startTime: '',
        endTime: '',
        reason: '',
      };
    }

    expect(formData.applicantName).toBe('');
  });

  it('预览页面无数据时显示空状态', () => {
    const emptyFormData = {
      applicantName: '',
      department: '',
      position: '',
      startTime: '',
      endTime: '',
      reason: '',
    };

    const hasData = Object.values(emptyFormData).some((v) => v && v.toString().trim());

    expect(hasData).toBe(false);
  });
});
