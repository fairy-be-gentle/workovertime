/**
 * 服务端存储工具（仅可在服务端代码中使用）
 * 位于 $lib/server 目录下，SvelteKit 会阻止其被打包到客户端
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DATA_DIR = '.data';
const DATA_FILE = join(DATA_DIR, 'applications.json');

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * 从文件加载加班申请数据
 */
export function loadApplicationsFromFile(): import('$lib/storage').OvertimeRecord[] {
  ensureDataDir();

  if (!existsSync(DATA_FILE)) {
    return [];
  }

  try {
    const data = readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * 保存加班申请数据到文件
 */
export function saveApplicationsToFile(records: import('$lib/storage').OvertimeRecord[]): void {
  ensureDataDir();
  writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 计算加班时长（小时） - 服务端使用的便捷 re-export
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
}
