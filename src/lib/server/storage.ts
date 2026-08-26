/**
 * @fileoverview 服务端存储工具
 *
 * 提供文件 IO 操作，仅限服务端代码使用。
 * 位于 $lib/server 目录下，SvelteKit 会阻止其被打包到客户端
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { OvertimeRecord } from '$lib/types';

const DATA_DIR = '.data';
const DATA_FILE = join(DATA_DIR, 'applications.json');

/** 确保数据目录存在 */
function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * 从文件加载加班申请数据
 *
 * @returns 申请记录数组，数据不存在时返回空数组
 */
export function loadApplicationsFromFile(): OvertimeRecord[] {
  ensureDataDir();

  if (!existsSync(DATA_FILE)) {
    return [];
  }

  try {
    const data = readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data) as OvertimeRecord[];
  } catch {
    return [];
  }
}

/**
 * 保存加班申请数据到文件
 *
 * @param records - 申请记录数组
 */
export function saveApplicationsToFile(records: OvertimeRecord[]): void {
  ensureDataDir();
  writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

/**
 * 生成唯一 ID
 *
 * @returns 格式为 "时间戳-随机字符串" 的唯一标识
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 计算加班时长（小时）
 *
 * @param startTime - 开始时间（ISO 8601 格式）
 * @param endTime - 结束时间（ISO 8601 格式）
 * @returns 加班时长（小时），保留两位小数
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
}
