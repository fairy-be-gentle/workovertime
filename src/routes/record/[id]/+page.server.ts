import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { loadApplicationsFromFile, saveApplicationsToFile, generateId } from '$lib/server/storage';

export const load: PageServerLoad = async ({ params }) => {
  const records = loadApplicationsFromFile();
  
  const record = records.find(r => r.id === params.id);
  
  if (!record) {
    throw error(404, '申请记录不存在');
  }

  return {
    record
  };
};

export const actions: Actions = {
  approve: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get('id')?.toString();
    const operator = formData.get('operator')?.toString() || '审批人';
    const comment = formData.get('comment')?.toString() || '';

    if (!id) {
      return fail(400, { error: '缺少申请ID' });
    }

    const records = loadApplicationsFromFile();
    
    const recordIndex = records.findIndex(r => r.id === id);
    if (recordIndex === -1) {
      return fail(404, { error: '申请记录不存在' });
    }

    const record = records[recordIndex];
    if (record.status !== 'pending') {
      return fail(400, { error: '该申请已处理，无法重复审批' });
    }

    const now = new Date().toISOString();
    
    // 添加审批记录到工作流历史
    const workflowStep = {
      id: generateId(),
      type: 'approve' as const,
      status: 'completed' as const,
      operator,
      operateTime: now,
      comment,
      stepName: '审批通过'
    };

    // 更新记录
    records[recordIndex] = {
      ...record,
      status: 'approved' as const,
      workflowHistory: [...(record.workflowHistory || []), workflowStep]
    };

    saveApplicationsToFile(records);

    return { success: true, action: 'approve' };
  },

  reject: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get('id')?.toString();
    const operator = formData.get('operator')?.toString() || '审批人';
    const comment = formData.get('comment')?.toString() || '';

    if (!id) {
      return fail(400, { error: '缺少申请ID' });
    }

    const records = loadApplicationsFromFile();
    
    const recordIndex = records.findIndex(r => r.id === id);
    if (recordIndex === -1) {
      return fail(404, { error: '申请记录不存在' });
    }

    const record = records[recordIndex];
    if (record.status !== 'pending') {
      return fail(400, { error: '该申请已处理，无法重复审批' });
    }

    const now = new Date().toISOString();
    
    // 添加驳回记录到工作流历史
    const workflowStep = {
      id: generateId(),
      type: 'reject' as const,
      status: 'rejected' as const,
      operator,
      operateTime: now,
      comment,
      stepName: '审批驳回'
    };

    // 更新记录
    records[recordIndex] = {
      ...record,
      status: 'rejected' as const,
      workflowHistory: [...(record.workflowHistory || []), workflowStep]
    };

    saveApplicationsToFile(records);

    return { success: true, action: 'reject' };
  }
};
