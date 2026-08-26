/**
 * @fileoverview 应用状态管理
 *
 * 使用 Svelte Store 管理加班申请的状态，
 * 包括记录列表、加载状态、错误状态和选中记录
 */

import { writable, derived } from 'svelte/store';
import type { OvertimeRecord, WorkflowStep, ApplicationStatus } from './types';

/** 应用全局状态结构 */
export interface AppState {
  records: OvertimeRecord[];
  loading: boolean;
  error: string | null;
  selectedRecord: OvertimeRecord | null;
}

/** 初始状态 */
const initialState: AppState = {
  records: [],
  loading: false,
  error: null,
  selectedRecord: null,
};

/**
 * 创建应用状态 Store
 *
 * 提供状态管理和业务操作方法
 */
function createAppStore() {
  const { subscribe, set, update } = writable<AppState>(initialState);

  return {
    subscribe,

    /**
     * 设置记录列表
     */
    setRecords(records: OvertimeRecord[]) {
      update((state) => ({ ...state, records }));
    },

    /**
     * 添加新记录到列表头部
     */
    addRecord(record: OvertimeRecord) {
      update((state) => ({
        ...state,
        records: [record, ...state.records],
      }));
    },

    /**
     * 根据 ID 更新记录
     */
    updateRecord(id: string, updates: Partial<OvertimeRecord>) {
      update((state) => ({
        ...state,
        records: state.records.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      }));
    },

    /**
     * 根据 ID 删除记录
     */
    deleteRecord(id: string) {
      update((state) => ({
        ...state,
        records: state.records.filter((r) => r.id !== id),
      }));
    },

    /**
     * 设置当前选中的记录
     */
    setSelectedRecord(record: OvertimeRecord | null) {
      update((state) => ({ ...state, selectedRecord: record }));
    },

    /**
     * 根据 ID 获取记录
     */
    getRecordById(id: string): OvertimeRecord | undefined {
      let found: OvertimeRecord | undefined;
      update((state) => {
        found = state.records.find((r) => r.id === id);
        return state;
      });
      return found;
    },

    /**
     * 审批通过记录
     */
    approveRecord(id: string, operator: string, comment?: string) {
      const now = new Date().toISOString();
      const step: WorkflowStep = {
        id: crypto.randomUUID(),
        type: 'approve',
        status: 'completed',
        operator,
        operateTime: now,
        comment,
        stepName: '审批通过',
      };

      update((state) => ({
        ...state,
        records: state.records.map((r) => {
          if (r.id === id) {
            return {
              ...r,
              status: 'approved' as ApplicationStatus,
              workflowHistory: [...(r.workflowHistory ?? []), step],
            };
          }
          return r;
        }),
        selectedRecord:
          state.selectedRecord?.id === id
            ? {
                ...state.selectedRecord,
                status: 'approved' as ApplicationStatus,
                workflowHistory: [...(state.selectedRecord.workflowHistory ?? []), step],
              }
            : state.selectedRecord,
      }));
    },

    /**
     * 驳回申请记录
     */
    rejectRecord(id: string, operator: string, comment?: string) {
      const now = new Date().toISOString();
      const step: WorkflowStep = {
        id: crypto.randomUUID(),
        type: 'reject',
        status: 'rejected',
        operator,
        operateTime: now,
        comment,
        stepName: '审批驳回',
      };

      update((state) => ({
        ...state,
        records: state.records.map((r) => {
          if (r.id === id) {
            return {
              ...r,
              status: 'rejected' as ApplicationStatus,
              workflowHistory: [...(r.workflowHistory ?? []), step],
            };
          }
          return r;
        }),
        selectedRecord:
          state.selectedRecord?.id === id
            ? {
                ...state.selectedRecord,
                status: 'rejected' as ApplicationStatus,
                workflowHistory: [...(state.selectedRecord.workflowHistory ?? []), step],
              }
            : state.selectedRecord,
      }));
    },

    /**
     * 设置加载状态
     */
    setLoading(loading: boolean) {
      update((state) => ({ ...state, loading }));
    },

    /**
     * 设置错误信息
     */
    setError(error: string | null) {
      update((state) => ({ ...state, error }));
    },

    /**
     * 重置状态到初始值
     */
    reset() {
      set(initialState);
    },
  };
}

export const appStore = createAppStore();

/** 记录列表（派生状态） */
export const records = derived(appStore, ($store) => $store.records);

/** 加载状态（派生状态） */
export const loading = derived(appStore, ($store) => $store.loading);

/** 错误信息（派生状态） */
export const error = derived(appStore, ($store) => $store.error);

/** 选中的记录（派生状态） */
export const selectedRecord = derived(appStore, ($store) => $store.selectedRecord);

/**
 * 统计数据（派生状态）
 */
export const statistics = derived(appStore, ($store) => {
  const records = $store.records;
  return {
    total: records.length,
    pending: records.filter((r) => r.status === 'pending').length,
    approved: records.filter((r) => r.status === 'approved').length,
    rejected: records.filter((r) => r.status === 'rejected').length,
    totalHours: records.reduce((sum, r) => sum + r.duration, 0),
  };
});
