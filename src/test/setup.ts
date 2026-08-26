/**
 * Vitest 测试配置
 *
 * 测试原则：
 * 1. 测试间隔离 - 每个测试独立运行
 * 2. 保持测试快速 - 避免不必要的等待
 * 3. 使用 fake timers 避免真实时间等待
 */

import { beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/svelte';
import '@testing-library/jest-dom';

// 在每个测试前重置状态
beforeEach(() => {
  // 清除所有 mock
  vi.clearAllMocks();
});

// 在每个测试后清理
afterEach(() => {
  // 清理可能的状态
});

// 使用 fake timers 避免 setTimeout/setInterval 导致的测试延迟
// 如需在特定测试中使用真实时间，可以：
// vi.useRealTimers();

// 为 crypto.randomUUID 提供 mock（Vitest 环境）
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as unknown as { crypto: Crypto }).crypto = {
    randomUUID: () => `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  } as Crypto;
} else if (!globalThis.crypto.randomUUID) {
  // 使用类型断言覆盖返回值类型
  (globalThis.crypto as unknown as { randomUUID: () => string }).randomUUID = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
