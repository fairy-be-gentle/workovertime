/// <reference types="@sveltejs/kit" />

// 加班申请单状态
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

// 加班申请记录
export interface OvertimeRecord {
  id: string;
  applicantName: string;
  department: string;
  position: string;
  startTime: string;
  endTime: string;
  duration: number;
  reason: string;
  submitTime: string;
  status: ApplicationStatus;
}

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
