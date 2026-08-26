import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { loadApplicationsFromFile, saveApplicationsToFile, generateId } from '$lib/server/storage';
import { OVERTIME_FORM_FIELDS, calculateDuration } from '$lib/storage';

export const ssr = false;

export const load: PageServerLoad = async ({ url }) => {
  const editId = url.searchParams.get('id');
  let editingRecord: ReturnType<typeof loadApplicationsFromFile>[number] | null = null;

  if (editId) {
    const records = loadApplicationsFromFile();
    editingRecord = records.find((r) => r.id === editId) ?? null;
  }

  return {
    formFields: OVERTIME_FORM_FIELDS,
    editingRecord,
  };
};

// ==================== 校验函数 ====================

interface ValidationResult {
  valid: boolean;
  error?: string;
  field?: string;
}

function validateField(name: string, value: string): ValidationResult {
  switch (name) {
    case 'applicantName':
      if (!value.trim()) return { valid: false, error: '请输入申请人姓名', field: 'applicantName' };
      break;
    case 'department':
      if (!value) return { valid: false, error: '请选择部门', field: 'department' };
      break;
    case 'position':
      if (!value) return { valid: false, error: '请选择职位', field: 'position' };
      break;
    case 'reason':
      if (!value.trim()) return { valid: false, error: '请输入加班事由', field: 'reason' };
      if (value.trim().length < 5) return { valid: false, error: '加班事由至少需要5个字符', field: 'reason' };
      break;
  }
  return { valid: true };
}

function validateOvertimeFields(data: {
  applicantName: string;
  department: string;
  position: string;
  startTime: string;
  endTime: string;
  reason: string;
}): ValidationResult {
  // 必填字段校验
  const fieldNames = ['applicantName', 'department', 'position', 'reason'] as const;
  for (const name of fieldNames) {
    const result = validateField(name, data[name]);
    if (!result.valid) return result;
  }

  // 时间校验
  if (!data.startTime || !data.endTime) {
    return { valid: false, error: '请选择加班时间' };
  }
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  if (end <= start) {
    return { valid: false, error: '结束时间必须大于开始时间', field: 'endTime' };
  }

  return { valid: true };
}

export const actions: Actions = {
  create: async ({ request }) => {
    const formData = await request.formData();

    const applicantName = formData.get('applicantName')?.toString() || '';
    const department = formData.get('department')?.toString() || '';
    const position = formData.get('position')?.toString() || '';
    const startTime = formData.get('startTime')?.toString() || '';
    const endTime = formData.get('endTime')?.toString() || '';
    const reason = formData.get('reason')?.toString() || '';

    // 校验
    const validation = validateOvertimeFields({ applicantName, department, position, startTime, endTime, reason });
    if (!validation.valid) {
      return fail(400, { error: validation.error, field: validation.field });
    }

    // 计算时长
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = calculateDuration(startTime, endTime);

    const now = new Date().toISOString();
    const newRecord = {
      id: generateId(),
      applicantName: applicantName.trim(),
      department,
      position,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      duration,
      reason: reason.trim(),
      submitTime: now,
      status: 'pending' as const,
      workflowHistory: [
        {
          id: generateId(),
          type: 'submit' as const,
          status: 'completed' as const,
          operator: applicantName.trim(),
          operateTime: now,
          stepName: '提交申请',
        },
      ],
    };

    const records = loadApplicationsFromFile();
    records.unshift(newRecord);
    saveApplicationsToFile(records);

    // 提交成功后跳转首页。/preview 用 fetch 提交，不会依赖这个 redirect；
    // /new 用 enhance 提交时 SvelteKit 会跟随 redirect 让浏览器 navigate('/')。
    throw redirect(303, '/');
  },

  update: async ({ request }) => {
    const formData = await request.formData();

    const id = formData.get('id')?.toString() || '';
    const applicantName = formData.get('applicantName')?.toString() || '';
    const department = formData.get('department')?.toString() || '';
    const position = formData.get('position')?.toString() || '';
    const startTime = formData.get('startTime')?.toString() || '';
    const endTime = formData.get('endTime')?.toString() || '';
    const reason = formData.get('reason')?.toString() || '';

    if (!id) {
      return fail(400, { error: '缺少记录ID' });
    }

    // 校验
    const validation = validateOvertimeFields({ applicantName, department, position, startTime, endTime, reason });
    if (!validation.valid) {
      return fail(400, { error: validation.error, field: validation.field });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    const records = loadApplicationsFromFile();
    const index = records.findIndex((r) => r.id === id);
    if (index === -1) {
      return fail(404, { error: '记录不存在' });
    }

    const now = new Date().toISOString();
    const existing = records[index];
    const previousStatus = existing.status;

    const workflowHistory = existing.workflowHistory ? [...existing.workflowHistory] : [];
    if (previousStatus === 'rejected') {
      workflowHistory.push({
        id: generateId(),
        type: 'resubmit' as const,
        status: 'completed' as const,
        operator: applicantName.trim(),
        operateTime: now,
        stepName: '重新提交申请',
      });
    }

    records[index] = {
      ...existing,
      applicantName: applicantName.trim(),
      department,
      position,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      duration: calculateDuration(startTime, endTime),
      reason: reason.trim(),
      status: previousStatus === 'rejected' ? 'pending' : existing.status,
      workflowHistory,
    };

    saveApplicationsToFile(records);

    throw redirect(303, '/');
  },
};
