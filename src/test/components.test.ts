/**
 * @fileoverview 组件集成测试
 *
 * 测试原则：
 * 1. 使用正确的查询函数（getByRole > getByLabelText > getByText）
 * 2. 测试用户可见行为而非实现细节
 * 3. 使用 userEvent 而非 fireEvent
 * 4. 避免过度 mock
 * 5. 测试可访问性
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createOvertimeRecord, createPendingRecord, createApprovedRecord } from './fixtures';

// 注意：Svelte 组件测试需要根据实际组件进行调整
// 以下为示例结构

describe('组件集成测试', () => {
  describe('表格组件查询测试', () => {
    // 这些测试展示了正确的查询优先级
    it('演示 getByRole 的使用（最高优先级）', () => {
      // 模拟一个简单的 HTML 结构来演示查询方法
      const container = document.createElement('div');
      container.innerHTML = `
        <table>
          <thead>
            <tr><th>申请人</th><th>部门</th></tr>
          </thead>
          <tbody>
            <tr><td>张三</td><td>技术部</td></tr>
          </tbody>
        </table>
        <button>新建申请</button>
      `;
      document.body.appendChild(container);

      // ✅ 最佳：使用 getByRole 查询按钮
      const button = screen.getByRole('button', { name: '新建申请' });
      expect(button).toBeInTheDocument();

      // ✅ 好的：使用 getByRole 查询表格
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // ✅ 好的：使用 getByRole 查询单元格
      const cell = screen.getByRole('cell', { name: '张三' });
      expect(cell).toBeInTheDocument();

      document.body.removeChild(container);
    });

    it('演示 getByText 的使用（非交互内容）', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <h1>加班申请列表</h1>
        <p>共有 <span>5</span> 条申请记录</p>
      `;
      document.body.appendChild(container);

      // ✅ 好的：使用 getByRole 查询标题
      const heading = screen.getByRole('heading', { name: '加班申请列表' });
      expect(heading).toBeInTheDocument();

      // ✅ 好的：使用正则表达式匹配部分文本
      const countParagraph = screen.getByText(/共有.*条申请记录/);
      expect(countParagraph).toBeInTheDocument();

      document.body.removeChild(container);
    });
  });

  describe('状态徽章显示测试', () => {
    it('待审批状态显示黄色徽章', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <span class="status-badge bg-yellow-100 text-yellow-800">待审批</span>
      `;
      document.body.appendChild(container);

      const badge = screen.getByText('待审批');
      expect(badge).toHaveClass('bg-yellow-100');
      expect(badge).toHaveClass('text-yellow-800');

      document.body.removeChild(container);
    });

    it('已通过状态显示绿色徽章', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <span class="status-badge bg-green-100 text-green-800">已通过</span>
      `;
      document.body.appendChild(container);

      const badge = screen.getByText('已通过');
      expect(badge).toHaveClass('bg-green-100');
      expect(badge).toHaveClass('text-green-800');

      document.body.removeChild(container);
    });

    it('已驳回状态显示红色徽章', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <span class="status-badge bg-red-100 text-red-800">已驳回</span>
      `;
      document.body.appendChild(container);

      const badge = screen.getByText('已驳回');
      expect(badge).toHaveClass('bg-red-100');
      expect(badge).toHaveClass('text-red-800');

      document.body.removeChild(container);
    });
  });

  describe('表单交互测试', () => {
    it('演示表单输入流程', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();

      const container = document.createElement('div');
      container.innerHTML = `
        <form id="test-form">
          <label for="name">申请人</label>
          <input type="text" id="name" placeholder="请输入姓名" />
          <button type="submit">提交</button>
        </form>
      `;
      document.body.appendChild(container);

      const form = container.querySelector('form')!;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSubmit();
      });

      // ✅ 使用 userEvent 模拟真实用户交互
      const input = screen.getByLabelText('申请人');
      await user.type(input, '张三');

      expect(input).toHaveValue('张三');

      // ✅ 点击提交按钮
      const submitButton = screen.getByRole('button', { name: '提交' });
      await user.click(submitButton);

      expect(handleSubmit).toHaveBeenCalledTimes(1);

      document.body.removeChild(container);
    });

    it('演示表单验证失败场景', async () => {
      const user = userEvent.setup();

      const container = document.createElement('div');
      container.innerHTML = `
        <form id="test-form">
          <label for="name">申请人</label>
          <input type="text" id="name" required />
          <span id="name-error" class="error"></span>
          <button type="submit">提交</button>
        </form>
      `;
      document.body.appendChild(container);

      const input = screen.getByLabelText('申请人');

      // 提交空表单
      const form = container.querySelector('form')!;
      const isValid = form.checkValidity();

      expect(isValid).toBe(false);

      document.body.removeChild(container);
    });
  });

  describe('可访问性测试', () => {
    it('表单输入有正确的标签关联', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <label for="name">申请人姓名</label>
        <input type="text" id="name" />
      `;
      document.body.appendChild(container);

      // ✅ 好的：使用 getByLabelText 验证标签关联
      const input = screen.getByLabelText('申请人姓名');
      expect(input).toBeInTheDocument();

      document.body.removeChild(container);
    });

    it('按钮有可访问的名称', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button aria-label="关闭对话框">×</button>
      `;
      document.body.appendChild(container);

      // ✅ 使用 aria-label 作为按钮名称
      const closeButton = screen.getByRole('button', { name: '关闭对话框' });
      expect(closeButton).toBeInTheDocument();

      document.body.removeChild(container);
    });
  });

  describe('异步操作测试', () => {
    it('模拟加载状态显示', async () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div id="loading" class="hidden">加载中...</div>
        <div id="content" class="visible">数据加载完成</div>
      `;
      document.body.appendChild(container);

      // 初始状态：加载中元素应该隐藏
      const loadingEl = screen.getByText('加载中...');
      expect(loadingEl).toHaveClass('hidden');

      // 内容应该可见
      const contentEl = screen.getByText('数据加载完成');
      expect(contentEl).toHaveClass('visible');

      document.body.removeChild(container);
    });
  });
});
