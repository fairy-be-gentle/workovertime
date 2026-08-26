/**
 * @fileoverview 工具函数测试
 *
 * 测试原则（基于 howtotestfrontend.com）：
 * 1. 每个测试函数只测试一个行为（清晰的测试意图）
 * 2. 避免测试实现细节（测试公共 API）
 * 3. 使用有意义的测试数据（唯一的 mock 值）
 * 4. 添加注释解释期望值（便于调试）
 * 5. 避免 toBeDefined() 使用具体的断言
 * 6. 测试 happy path 和 sad path
 */

import { describe, it, expect } from 'vitest';
import {
  calculateDuration,
  formatDuration,
  getStatusText,
  getStatusStyle,
  formatDateTime,
  formatDate,
} from '$lib/storage';

describe('工具函数', () => {
  // ==================== calculateDuration ====================
  describe('calculateDuration', () => {
    it('计算整小时加班时长', () => {
      // 4 小时加班：18:00 - 22:00
      const start = '2026-08-25T18:00:00.000Z';
      const end = '2026-08-25T22:00:00.000Z';

      const result = calculateDuration(start, end);

      expect(result).toBe(4);
    });

    it('计算半小时加班时长', () => {
      // 0.5 小时加班：18:00 - 18:30
      const start = '2026-08-25T18:00:00.000Z';
      const end = '2026-08-25T18:30:00.000Z';

      const result = calculateDuration(start, end);

      expect(result).toBe(0.5);
    });

    it('计算跨天加班时长', () => {
      // 4 小时跨天加班：22:00 - 02:00 (次日)
      const start = '2026-08-25T22:00:00.000Z';
      const end = '2026-08-26T02:00:00.000Z';

      const result = calculateDuration(start, end);

      expect(result).toBe(4);
    });

    it('计算较长加班时长', () => {
      // 8 小时加班（完整工作日）
      const start = '2026-08-25T09:00:00.000Z';
      const end = '2026-08-25T17:00:00.000Z';

      const result = calculateDuration(start, end);

      expect(result).toBe(8);
    });

    it('处理非整点结束的加班时长', () => {
      // 2.5 小时加班：18:00 - 20:30
      const start = '2026-08-25T18:00:00.000Z';
      const end = '2026-08-25T20:30:00.000Z';

      const result = calculateDuration(start, end);

      expect(result).toBe(2.5);
    });

    it('返回负数当结束时间早于开始时间', () => {
      const start = '2026-08-25T22:00:00.000Z';
      const end = '2026-08-25T18:00:00.000Z';

      const result = calculateDuration(start, end);

      // 负数表示时间倒置，调用方应负责验证
      expect(result).toBeLessThan(0);
    });
  });

  // ==================== formatDuration ====================
  describe('formatDuration', () => {
    it('格式化整小时数', () => {
      const hours = 4;

      const result = formatDuration(hours);

      expect(result).toBe('4小时');
    });

    it('格式化包含分钟的小数小时', () => {
      // 2.5 小时 = 2 小时 30 分钟
      const hours = 2.5;

      const result = formatDuration(hours);

      expect(result).toBe('2小时30分钟');
    });

    it('格式化只有分钟没有整小时', () => {
      // 0.5 小时 = 0 小时 30 分钟
      const hours = 0.5;

      const result = formatDuration(hours);

      expect(result).toBe('0小时30分钟');
    });

    it('格式化零小时', () => {
      const hours = 0;

      const result = formatDuration(hours);

      expect(result).toBe('0小时');
    });

    it('格式化整小时无分钟时省略分钟显示', () => {
      // 当分钟为 0 时不应显示 "0分钟"
      const hours = 3;

      const result = formatDuration(hours);

      expect(result).toBe('3小时');
      expect(result).not.toContain('0分钟');
    });

    it('格式化超过一小时且分钟为整点', () => {
      // 1.25 小时 = 1 小时 15 分钟
      const hours = 1.25;

      const result = formatDuration(hours);

      expect(result).toBe('1小时15分钟');
    });
  });

  // ==================== getStatusText ====================
  describe('getStatusText', () => {
    it('返回待审批状态的中文文本', () => {
      const status = 'pending' as const;

      const result = getStatusText(status);

      expect(result).toBe('待审批');
    });

    it('返回已通过状态的中文文本', () => {
      const status = 'approved' as const;

      const result = getStatusText(status);

      expect(result).toBe('已通过');
    });

    it('返回已驳回状态的中文文本', () => {
      const status = 'rejected' as const;

      const result = getStatusText(status);

      expect(result).toBe('已驳回');
    });

    it('所有状态返回值非空', () => {
      const statuses = ['pending', 'approved', 'rejected'] as const;

      statuses.forEach((status) => {
        const result = getStatusText(status);
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  // ==================== getStatusStyle ====================
  describe('getStatusStyle', () => {
    it('待审批状态使用黄色系样式', () => {
      const status = 'pending' as const;

      const result = getStatusStyle(status);

      expect(result).toContain('yellow');
      expect(result).not.toContain('green');
      expect(result).not.toContain('red');
    });

    it('已通过状态使用绿色系样式', () => {
      const status = 'approved' as const;

      const result = getStatusStyle(status);

      expect(result).toContain('green');
      expect(result).not.toContain('yellow');
      expect(result).not.toContain('red');
    });

    it('已驳回状态使用红色系样式', () => {
      const status = 'rejected' as const;

      const result = getStatusStyle(status);

      expect(result).toContain('red');
      expect(result).not.toContain('yellow');
      expect(result).not.toContain('green');
    });

    it('返回的样式包含背景和文字颜色类', () => {
      const status = 'pending' as const;

      const result = getStatusStyle(status);

      // 验证包含 bg- 和 text- 类
      expect(result).toMatch(/bg-/);
      expect(result).toMatch(/text-/);
    });
  });

  // ==================== formatDateTime ====================
  describe('formatDateTime', () => {
    it('格式化标准 ISO 时间字符串', () => {
      const isoString = '2026-08-25T14:30:00.000Z';

      const result = formatDateTime(isoString);

      // 结果应包含年月日和时间
      expect(result).toMatch(/\d{4}/); // 年
      expect(result).toMatch(/\d{2}/); // 月/日/时/分
    });

    it('处理中国时区的上午时间', () => {
      const isoString = '2026-08-25T09:00:00.000Z';

      const result = formatDateTime(isoString);

      // 应该包含上午相关的显示
      expect(result).toContain('2026');
      expect(result).toContain('08');
      expect(result).toContain('25');
    });

    it('处理中国时区的下午时间', () => {
      const isoString = '2026-08-25T18:00:00.000Z';

      const result = formatDateTime(isoString);

      expect(result).toContain('2026');
      expect(result).toContain('08');
    });
  });

  // ==================== formatDate ====================
  describe('formatDate', () => {
    it('格式化日期只显示年月日', () => {
      // 使用 UTC 时间避免时区问题
      const isoString = '2026-08-25T00:00:00.000Z';

      const result = formatDate(isoString);

      expect(result).toContain('2026');
      expect(result).toContain('08');
      expect(result).toContain('25');
    });

    it('不包含时间部分', () => {
      // 使用 UTC 时间避免时区问题
      const isoString = '2026-12-31T00:00:00.000Z';

      const result = formatDate(isoString);

      // 不应该包含冒号（时间格式的特征）
      expect(result).not.toMatch(/\d{2}:\d{2}/);
    });
  });
});
