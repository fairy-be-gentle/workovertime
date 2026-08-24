import { writable, derived } from 'svelte/store';
import type { OvertimeRecord, WorkflowStep, ApplicationStatus } from './types';

// 应用状态
export interface AppState {
  records: OvertimeRecord[];
  loading: boolean;
  error: string | null;
  selectedRecord: OvertimeRecord | null;
}

// 初始状态
const initialState: AppState = {
  records: [],
  loading: false,
  error: null,
  selectedRecord: null
};

// 创建 store
function createAppStore() {
  const { subscribe, set, update } = writable<AppState>(initialState);

  return {
    subscribe,
    
    // 设置记录列表
    setRecords(records: OvertimeRecord[]) {
      update(state => ({ ...state, records }));
    },
    
    // 添加记录
    addRecord(record: OvertimeRecord) {
      update(state => ({
        ...state,
        records: [record, ...state.records]
      }));
    },
    
    // 更新记录
    updateRecord(id: string, updates: Partial<OvertimeRecord>) {
      update(state => ({
        ...state,
        records: state.records.map(r => 
          r.id === id ? { ...r, ...updates } : r
        )
      }));
    },
    
    // 删除记录
    deleteRecord(id: string) {
      update(state => ({
        ...state,
        records: state.records.filter(r => r.id !== id)
      }));
    },
    
    // 设置选中的记录
    setSelectedRecord(record: OvertimeRecord | null) {
      update(state => ({ ...state, selectedRecord: record }));
    },
    
    // 根据ID获取记录
    getRecordById(id: string): OvertimeRecord | undefined {
      let found: OvertimeRecord | undefined;
      update(state => {
        found = state.records.find(r => r.id === id);
        return state;
      });
      return found;
    },
    
    // 审批通过
    approveRecord(id: string, operator: string, comment?: string) {
      const now = new Date().toISOString();
      const step: WorkflowStep = {
        id: crypto.randomUUID(),
        type: 'approve',
        status: 'completed',
        operator,
        operateTime: now,
        comment,
        stepName: '审批通过'
      };
      
      update(state => ({
        ...state,
        records: state.records.map(r => {
          if (r.id === id) {
            return {
              ...r,
              status: 'approved' as ApplicationStatus,
              workflowHistory: [...(r.workflowHistory || []), step]
            };
          }
          return r;
        }),
        selectedRecord: state.selectedRecord?.id === id ? {
          ...state.selectedRecord,
          status: 'approved' as ApplicationStatus,
          workflowHistory: [...(state.selectedRecord.workflowHistory || []), step]
        } : state.selectedRecord
      }));
    },
    
    // 驳回申请
    rejectRecord(id: string, operator: string, comment?: string) {
      const now = new Date().toISOString();
      const step: WorkflowStep = {
        id: crypto.randomUUID(),
        type: 'reject',
        status: 'rejected',
        operator,
        operateTime: now,
        comment,
        stepName: '审批驳回'
      };
      
      update(state => ({
        ...state,
        records: state.records.map(r => {
          if (r.id === id) {
            return {
              ...r,
              status: 'rejected' as ApplicationStatus,
              workflowHistory: [...(r.workflowHistory || []), step]
            };
          }
          return r;
        }),
        selectedRecord: state.selectedRecord?.id === id ? {
          ...state.selectedRecord,
          status: 'rejected' as ApplicationStatus,
          workflowHistory: [...(state.selectedRecord.workflowHistory || []), step]
        } : state.selectedRecord
      }));
    },
    
    // 设置加载状态
    setLoading(loading: boolean) {
      update(state => ({ ...state, loading }));
    },
    
    // 设置错误
    setError(error: string | null) {
      update(state => ({ ...state, error }));
    },
    
    // 重置状态
    reset() {
      set(initialState);
    }
  };
}

// 导出 store
export const appStore = createAppStore();

// 导出派生状态
export const records = derived(appStore, $store => $store.records);
export const loading = derived(appStore, $store => $store.loading);
export const error = derived(appStore, $store => $store.error);
export const selectedRecord = derived(appStore, $store => $store.selectedRecord);

// 统计派生数据
export const statistics = derived(appStore, $store => {
  const records = $store.records;
  return {
    total: records.length,
    pending: records.filter(r => r.status === 'pending').length,
    approved: records.filter(r => r.status === 'approved').length,
    rejected: records.filter(r => r.status === 'rejected').length,
    totalHours: records.reduce((sum, r) => sum + r.duration, 0)
  };
});
