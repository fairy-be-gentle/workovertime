/**
 * @fileoverview 表单验证测试
 *
 * 测试原则：
 * 1. 每个 describe 块对应一个验证场景
 * 2. 清晰的测试描述说明正在测试什么
 * 3. 使用唯一的测试数据便于调试
 * 4. 测试 happy path 和 sad path
 * 5. 避免过度 mock - 直接测试验证函数
 */

import { describe, it, expect } from 'vitest';
import {
  validateAll,
  validateReasonLength,
  validateTimeRange,
  OVERTIME_FORM_FIELDS,
} from '$lib/storage';
import type { FormData } from '$lib/storage';

// 加班表单默认的额外校验规则
const extraRules = {
  reason: validateReasonLength,
  endTime: validateTimeRange,
};

describe('表单验证', () => {
  // ==================== 必填字段验证 ====================
  describe('必填字段验证', () => {
    it('填写所有必填字段时验证通过', () => {
      const formData: FormData = {
        applicantName: '张三',
        department: '技术部',
        position: '高级工程师',
        startTime: '2026-08-25T18:00',
        endTime: '2026-08-25T22:00',
        reason: '项目紧急上线需要加班处理',
      };

      const result = validateAll(OVERTIME_FORM_FIELDS, formData, extraRules);

      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('缺少申请人姓名时返回错误', () => {
      const formData: FormData = {
        applicantName: '',
        department: '技术部',
        position: '高级工程师',
        startTime: '2026-08-25T18:00',
        endTime: '2026-08-25T22:00',
        reason: '项目紧急上线需要加班处理',
      };

      const result = validateAll(OVERTIME_FORM_FIELDS, formData, extraRules);

      expect(result.errors).toHaveProperty('applicantName');
      expect(result.errors.applicantName).toContain('申请人');
    });

    it('缺少部门选择时返回错误', () => {
      const formData: FormData = {
        applicantName: '张三',
        department: '',
        position: '高级工程师',
        startTime: '2026-08-25T18:00',
        endTime: '2026-08-25T22:00',
        reason: '项目紧急上线需要加班处理',
      };

      const result = validateAll(OVERTIME_FORM_FIELDS, formData, extraRules);

      expect(result.errors).toHaveProperty('department');
      expect(result.errors.department).toContain('部门');
    });

    it('缺少职位选择时返回错误', () => {
      const formData: FormData = {
        applicantName: '张三',
        department: '技术部',
        position: '',
        startTime: '2026-08-25T18:00',
        endTime: '2026-08-25T22:00',
        reason: '项目紧急上线需要加班处理',
      };

      const result = validateAll(OVERTIME_FORM_FIELDS, formData, extraRules);

      expect(result.errors).toHaveProperty('position');
    });

    it('缺少开始时间时返回错误', () => {
      const formData: FormData = {
        applicantName: '张三',
        department: '技术部',
        position: '高级工程师',
        startTime: '',
        endTime: '2026-08-25T22:00',
        reason: '项目紧急上线需要加班处理',
      };

      const result = validateAll(OVERTIME_FORM_FIELDS, formData, extraRules);

      expect(result.errors).toHaveProperty('startTime');
      expect(result.errors.startTime).toContain('开始时间');
    });

    it('缺少结束时间时返回错误', () => {
      const formData: FormData = {
        applicantName: '张三',
        department: '技术部',
        position: '高级工程师',
        startTime: '2026-08-25T18:00',
        endTime: '',
        reason: '项目紧急上线需要加班处理',
      };

      const result = validateAll(OVERTIME_FORM_FIELDS, formData, extraRules);

      expect(result.errors).toHaveProperty('endTime');
      expect(result.errors.endTime).toContain('结束时间');
    });

    it('缺少加班事由时返回错误', () => {
      const formData: FormData = {
        applicantName: '张三',
        department: '技术部',
        position: '高级工程师',
        startTime: '2026-08-25T18:00',
        endTime: '2026-08-25T22:00',
        reason: '',
      };

      const result = validateAll(OVERTIME_FORM_FIELDS, formData, extraRules);

      expect(result.errors).toHaveProperty('reason');
    });

    it('空白字符串被视为未填写', () => {
      const formData: FormData = {
        applicantName: '   ', // 只有空格
        department: '技术部',
        position: '高级工程师',
        startTime: '2026-08-25T18:00',
        endTime: '2026-08-25T22:00',
        reason: '项目紧急上线需要加班处理',
      };

      const result = validateAll(OVERTIME_FORM_FIELDS, formData, extraRules);

      expect(result.errors).toHaveProperty('applicantName');
    });
  });

  // ==================== 加班事由长度验证 ====================
  describe('加班事由长度验证', () => {
    it('事由过短时返回错误（少于5个字符）', () => {
      const formData: FormData = {
        applicantName: '张三',
        department: '技术部',
        position: '高级工程师',
        startTime: '2026-08-25T18:00',
        endTime: '2026-08-25T22:00',
        reason: '加班', // 只有2个字符
      };

      const result = validateAll(OVERTIME_FORM_FIELDS, formData, extraRules);

      expect(result.errors).toHaveProperty('reason');
      expect(result.errors.reason).toContain('5个字符');
    });

    it('事由刚好5个字符时验证通过', () => {
      const formData: FormData = {
        applicantName: '张三',
        department: '技术部',
        position: '高级工程师',
        startTime: '2026-08-25T18:00',
        endTime: '2026-08-25T22:00',
        reason: '项目紧', // 3个字符
      };

      const result = validateAll(OVERTIME_FORM_FIELDS, formData, extraRules);

      expect(result.errors).toHaveProperty('reason');
    });

    it('事由超过5个字符时验证通过', () => {
      const formData: FormData = {
        applicantName: '张三',
        department: '技术部',
        position: '高级工程师',
        startTime: '2026-08-25T18:00',
        endTime: '2026-08-25T22:00',
        reason: '项目紧急上线需要加班处理', // 超过5个字符
      };

      const result = validateAll(OVERTIME_FORM_FIELDS, formData, extraRules);

      expect(result.errors).not.toHaveProperty('reason');
    });

    it('事由为空白字符时视为未填写而不是长度不足', () => {
      const formData: FormData = {
        applicantName: '张三',
        department: '技术部',
        position: '高级工程师',
        startTime: '2026-08-25T18:00',
        endTime: '2026-08-25T22:00',
        reason: '     ', // 只有空白字符
      };

      const result = validateAll(OVERTIME_FORM_FIELDS, formData, extraRules);

      // 应该是"请填写"而不是"至少5个字符"
      expect(result.errors).toHaveProperty('reason');
    });
  });

  // ==================== 时间验证 ====================
  describe('时间验证', () => {
    it('结束时间早于开始时间时返回错误', () => {
      const formData: FormData = {
        applicantName: '张三',
        department: '技术部',
        position: '高级工程师',
        startTime: '2026-08-25T22:00',
        endTime: '2026-08-25T18:00', // 结束时间早于开始时间
        reason: '项目紧急上线需要加班处理',
      };

      const result = validateAll(OVERTIME_FORM_FIELDS, formData, extraRules);

      expect(result.errors).toHaveProperty('endTime');
      expect(result.errors.endTime).toContain('大于');
    });

    it('结束时间等于开始时间时返回错误', () => {
      const formData: FormData = {
        applicantName: '张三',
        department: '技术部',
        position: '高级工程师',
        startTime: '2026-08-25T18:00',
        endTime: '2026-08-25T18:00', // 结束时间等于开始时间
        reason: '项目紧急上线需要加班处理',
      };

      const result = validateAll(OVERTIME_FORM_FIELDS, formData, extraRules);

      expect(result.errors).toHaveProperty('endTime');
    });

    it('开始时间和结束时间都为空时不触发时间比较错误', () => {
      const formData: FormData = {
        applicantName: '张三',
        department: '技术部',
        position: '高级工程师',
        startTime: '',
        endTime: '',
        reason: '项目紧急上线需要加班处理',
      };

      const result = validateAll(OVERTIME_FORM_FIELDS, formData, extraRules);

      // 应该只报告必填字段错误，不应该报告时间比较错误
      expect(result.errors).toHaveProperty('startTime');
      expect(result.errors).toHaveProperty('endTime');
      expect(result.errors.endTime).not.toContain('大于');
    });

    it('只有开始时间时验证通过（无 endTime 错误）', () => {
      const formData: FormData = {
        applicantName: '张三',
        department: '技术部',
        position: '高级工程师',
        startTime: '2026-08-25T18:00',
        endTime: '', // 只有开始时间
        reason: '项目紧急上线需要加班处理',
      };

      const result = validateAll(OVERTIME_FORM_FIELDS, formData, extraRules);

      expect(result.errors).toHaveProperty('endTime');
      // 不应该是因为"大于开始时间"而报错
    });
  });

  // ==================== 错误聚合测试 ====================
  describe('多字段错误聚合', () => {
    it('多个字段错误时返回所有错误', () => {
      const formData: FormData = {
        applicantName: '',
        department: '',
        position: '',
        startTime: '',
        endTime: '',
        reason: '', // 全部为空
      };

      const result = validateAll(OVERTIME_FORM_FIELDS, formData, extraRules);

      expect(Object.keys(result.errors)).toHaveLength(6);
      expect(result.errors).toHaveProperty('applicantName');
      expect(result.errors).toHaveProperty('department');
      expect(result.errors).toHaveProperty('position');
      expect(result.errors).toHaveProperty('startTime');
      expect(result.errors).toHaveProperty('endTime');
      expect(result.errors).toHaveProperty('reason');
    });

    it('部分字段有错误时只返回错误字段', () => {
      const formData: FormData = {
        applicantName: '张三',
        department: '技术部',
        position: '高级工程师',
        startTime: '2026-08-25T18:00',
        endTime: '2026-08-25T22:00',
        reason: '', // 只有 reason 为空
      };

      const result = validateAll(OVERTIME_FORM_FIELDS, formData, extraRules);

      expect(Object.keys(result.errors)).toHaveLength(1);
      expect(result.errors).toHaveProperty('reason');
    });
  });

  // ==================== 自定义字段配置测试 ====================
  describe('自定义字段配置', () => {
    it('使用自定义字段配置时验证相应字段', () => {
      const customFields = [
        { name: 'email', label: '邮箱', type: 'text' as const, required: true },
      ];
      const formData: FormData = {
        email: '',
      };

      const result = validateAll(customFields, formData);

      expect(result.errors).toHaveProperty('email');
    });

    it('字段不设为必填时不强制验证', () => {
      const customFields = [
        { name: 'nickname', label: '昵称', type: 'text' as const, required: false },
      ];
      const formData: FormData = {
        nickname: '',
      };

      const result = validateAll(customFields, formData);

      expect(Object.keys(result.errors)).toHaveLength(0);
    });
  });

  // ==================== 额外验证规则测试 ====================
  describe('额外验证规则', () => {
    it('额外规则验证失败时添加到错误中', () => {
      const formData: FormData = {
        applicantName: '张三',
        department: '技术部',
        position: '高级工程师',
        startTime: '2026-08-25T18:00',
        endTime: '2026-08-25T22:00',
        reason: '项目紧急上线需要加班处理',
      };

      const customRules = {
        ...extraRules,
        startTime: () => '开始时间不能在周末',
      };

      const result = validateAll(OVERTIME_FORM_FIELDS, formData, customRules);

      expect(result.errors).toHaveProperty('startTime');
      expect(result.errors.startTime).toContain('周末');
    });

    it('额外规则验证通过时不添加错误', () => {
      const formData: FormData = {
        applicantName: '张三',
        department: '技术部',
        position: '高级工程师',
        startTime: '2026-08-25T18:00',
        endTime: '2026-08-25T22:00',
        reason: '项目紧急上线需要加班处理',
      };

      // 传递 extraRules，全部验证通过
      const result = validateAll(OVERTIME_FORM_FIELDS, formData, extraRules);

      expect(Object.keys(result.errors)).toHaveLength(0);
    });
  });
});
