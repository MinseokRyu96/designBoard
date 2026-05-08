export type MemberName = string;

export const MEMBER_ORDER: string[] = ["류민석", "계은영", "한다영"];

export type TaskStatus = "진행중" | "완료" | "보류";

export interface Member {
  id: string;
  name: MemberName;
}

export interface Task {
  id: string;
  member_id: string;
  project_id: string;
  project_name: string;
  title: string;
  purpose: string | null;
  status: TaskStatus;
  start_date: string | null;
  due_date: string | null;
  created_at: string;
}

export interface DailyLog {
  id: string;
  task_id: string;
  member_id: string;
  log_date: string;
  progress: string | null;
  issue: string | null;
  next_action: string | null;
  insight: string | null;
  created_at: string;
}

export interface NextWeekTask {
  id: string;
  member_id: string;
  member_name: MemberName;
  title: string;
  start_date: string | null;
  due_date: string | null;
  week_of: string;
  created_at: string;
}

// Report API 응답 타입
export interface ReportTask {
  id: string;
  title: string;
  purpose: string | null;
  status: TaskStatus;
  start_date: string | null;
  due_date: string | null;
  log: {
    progress: string | null;
    issue: string | null;
    next_action: string | null;
    insight: string | null;
  } | null;
}

export interface ReportProject {
  project_id: string;
  project_name: string;
  tasks: ReportTask[];
}

export interface ReportMember {
  id: string;
  name: MemberName;
  projects: ReportProject[];
}

export interface ReportNextWeekTask {
  member_name: MemberName;
  tasks: {
    title: string;
    start_date: string | null;
    due_date: string | null;
  }[];
}

export interface ReportResponse {
  type: "daily" | "weekly";
  date?: string;
  week?: string;
  members: ReportMember[];
  next_week_tasks: ReportNextWeekTask[];
}
