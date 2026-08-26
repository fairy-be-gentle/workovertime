/**
 * 服务端数据加载和处理
 * 支持 SSR 渲染
 */
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import {
  loadApplicationsFromFile,
  saveApplicationsToFile,
  generateId,
  calculateDuration,
} from '$lib/server/storage';
import { OVERTIME_FORM_SCHEMA, validateFormData } from '$lib/form-schema';

/**
 * 从 FormData 解析并校验申请表单字段。
 * 返回清理后的 values 和字段级 errors；调用方根据 errors 是否为空决定是否 fail。
 *
 * 适用于 create / update 两个 action 的共享校验逻辑：
 * - 必填字段（依 schema）
 * - 加班事由至少 5 个字符
 * - 结束时间必须晚于开始时间
 */
type ParsedApplicationForm = {
  values: {
    applicantName: string;
    department: string;
    position: string;
    startTime: string;
    endTime: string;
    reason: string;
  };
  errors: Record<string, string>;
};

function parseApplicationForm(formData: FormData): ParsedApplicationForm {
  const raw = {
    applicantName: formData.get('applicantName')?.toString() ?? '',
    department: formData.get('department')?.toString() ?? '',
    position: formData.get('position')?.toString() ?? '',
    startTime: formData.get('startTime')?.toString() ?? '',
    endTime: formData.get('endTime')?.toString() ?? '',
    reason: formData.get('reason')?.toString() ?? '',
  };
  const errors = validateFormData(raw, OVERTIME_FORM_SCHEMA);
  return {
    values: {
      applicantName: raw.applicantName.trim(),
      department: raw.department,
      position: raw.position,
      startTime: raw.startTime,
      endTime: raw.endTime,
      reason: raw.reason.trim(),
    },
    errors,
  };
}

export const ssr = true;

// 加载数据（SSR）
export const load: PageServerLoad = () => {
  const records = loadApplicationsFromFile();
  return {
    records,
    formFields: OVERTIME_FORM_SCHEMA,
  };
};

// 表单操作（CRUD）
export const actions: Actions = {
  // 创建申请
  create: async ({ request }) => {
    const formData = await request.formData();
    const { values, errors } = parseApplicationForm(formData);

    if (
      errors.applicantName ||
      errors.department ||
      errors.position ||
      errors.startTime ||
      errors.endTime ||
      errors.reason
    ) {
      // 优先返回第一个字段级错误，便于前端高亮定位
      const fieldOrder = [
        'applicantName',
        'department',
        'position',
        'startTime',
        'endTime',
        'reason',
      ] as const;
      for (const field of fieldOrder) {
        if (errors[field]) {
          return fail(400, { error: errors[field], field });
        }
      }
    }

    const now = new Date().toISOString();

    // 创建新记录，包含工作流历史
    const records = loadApplicationsFromFile();
    const newRecord = {
      id: generateId(),
      applicantName: values.applicantName,
      department: values.department,
      position: values.position,
      startTime: values.startTime,
      endTime: values.endTime,
      duration: calculateDuration(values.startTime, values.endTime),
      reason: values.reason,
      submitTime: now,
      status: 'pending' as const,
      workflowHistory: [
        {
          id: generateId(),
          type: 'submit' as const,
          status: 'completed' as const,
          operator: values.applicantName,
          operateTime: now,
          stepName: '提交申请',
        },
      ],
    };

    records.unshift(newRecord);
    saveApplicationsToFile(records);

    return { success: true, action: 'create' };
  },

  // 更新申请
  update: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get('id')?.toString() ?? '';

    if (!id) {
      return fail(400, { error: '缺少记录ID' });
    }

    const { values, errors } = parseApplicationForm(formData);
    if (
      errors.applicantName ||
      errors.department ||
      errors.position ||
      errors.startTime ||
      errors.endTime ||
      errors.reason
    ) {
      const fieldOrder = [
        'applicantName',
        'department',
        'position',
        'startTime',
        'endTime',
        'reason',
      ] as const;
      for (const field of fieldOrder) {
        if (errors[field]) {
          return fail(400, { error: errors[field], field });
        }
      }
    }

    const records = loadApplicationsFromFile();
    const index = records.findIndex((r) => r.id === id);

    if (index === -1) {
      return fail(404, { error: '记录不存在' });
    }

    const now = new Date().toISOString();
    const existing = records[index];
    const previousStatus = existing.status;

    // 已驳回的记录重新编辑后，状态回到待审批并追加工作流记录
    const workflowHistory = existing.workflowHistory ? [...existing.workflowHistory] : [];
    if (previousStatus === 'rejected') {
      workflowHistory.push({
        id: generateId(),
        type: 'resubmit' as const,
        status: 'completed' as const,
        operator: values.applicantName,
        operateTime: now,
        stepName: '重新提交申请',
      });
    }

    // 更新记录，保留工作流历史
    records[index] = {
      ...existing,
      applicantName: values.applicantName,
      department: values.department,
      position: values.position,
      startTime: values.startTime,
      endTime: values.endTime,
      duration: calculateDuration(values.startTime, values.endTime),
      reason: values.reason,
      status: previousStatus === 'rejected' ? 'pending' : existing.status,
      workflowHistory,
    };

    saveApplicationsToFile(records);

    return { success: true, action: 'update' };
  },

  // 删除申请
  delete: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get('id')?.toString() ?? '';

    if (!id) {
      return fail(400, { error: '缺少记录ID' });
    }

    const records = loadApplicationsFromFile();
    const filteredRecords = records.filter((r) => r.id !== id);

    if (filteredRecords.length === records.length) {
      return fail(404, { error: '记录不存在' });
    }

    saveApplicationsToFile(filteredRecords);

    return { success: true, action: 'delete' };
  },
};
