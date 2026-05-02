"use client";

import { useState, useEffect, useCallback } from "react";
import MemberTabs from "@/components/ui/MemberTabs";
import DatePicker from "@/components/ui/DatePicker";
import StatusBadge from "@/components/ui/StatusBadge";
import { MEMBER_ORDER, type MemberName, type TaskStatus } from "@/types";
import Link from "next/link";

const MEMBER_IDS: Record<MemberName, string> = {
  류민석: "11111111-1111-1111-1111-111111111111",
  계은영: "22222222-2222-2222-2222-222222222222",
  한다영: "33333333-3333-3333-3333-333333333333",
};

interface TaskWithLog {
  id: string;
  title: string;
  purpose: string | null;
  status: TaskStatus;
  start_date: string | null;
  due_date: string | null;
  project: { id: string; name: string } | null;
  log: {
    id?: string;
    progress: string;
    issue: string;
    next_action: string;
    insight: string;
  };
  logDirty: boolean;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function DailyPage() {
  const [selectedMember, setSelectedMember] = useState<MemberName>(MEMBER_ORDER[0]);
  const [date, setDate] = useState(todayStr());
  const [tasks, setTasks] = useState<TaskWithLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask] = useState({
    project_name: "",
    title: "",
    purpose: "",
    status: "진행중" as TaskStatus,
    start_date: todayStr(),
    due_date: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/daily-logs?member_id=${MEMBER_IDS[selectedMember]}&date=${date}`
      );
      const logs = await res.json();

      // 로그가 있는 태스크 + 오늘 진행중 태스크 합치기
      const taskRes = await fetch(
        `/api/tasks?member_id=${MEMBER_IDS[selectedMember]}&date=${date}`
      );
      const allTasks = await taskRes.json();

      const logMap = new Map(logs.map((l: { task: { id: string }; id: string; progress: string; issue: string; next_action: string; insight: string }) => [l.task?.id, l]));

      const merged: TaskWithLog[] = allTasks.map((t: { id: string; title: string; purpose: string | null; status: TaskStatus; start_date: string | null; due_date: string | null; project: { id: string; name: string } | null }) => {
        const log = logMap.get(t.id) as { id: string; progress: string; issue: string; next_action: string; insight: string } | undefined;
        return {
          ...t,
          log: {
            id: log?.id,
            progress: log?.progress ?? "",
            issue: log?.issue ?? "",
            next_action: log?.next_action ?? "",
            insight: log?.insight ?? "",
          },
          logDirty: false,
        };
      });

      setTasks(merged);
    } finally {
      setLoading(false);
    }
  }, [selectedMember, date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function updateLog(taskId: string, field: string, value: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, log: { ...t.log, [field]: value }, logDirty: true } : t
      )
    );
  }

  async function saveLog(task: TaskWithLog) {
    setSaving(task.id);
    try {
      await fetch("/api/daily-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: task.id,
          member_id: MEMBER_IDS[selectedMember],
          log_date: date,
          ...task.log,
        }),
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, logDirty: false } : t))
      );
    } finally {
      setSaving(null);
    }
  }

  async function createTask() {
    if (!newTask.project_name || !newTask.title) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        member_id: MEMBER_IDS[selectedMember],
        ...newTask,
      }),
    });
    setShowNewTask(false);
    setNewTask({ project_name: "", title: "", purpose: "", status: "진행중", start_date: todayStr(), due_date: "" });
    fetchData();
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Daily Log</h1>
        <div className="flex items-center gap-3">
          <DatePicker value={date} onChange={setDate} label="날짜" />
          <Link
            href={`/report/print?type=daily&date=${date}`}
            className="px-4 py-2 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            출력하기
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <MemberTabs selected={selectedMember} onChange={setSelectedMember} />
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">불러오는 중...</div>
      ) : (
        <div className="space-y-5">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">{task.project?.name}</p>
                  <h3 className="font-semibold text-gray-900">{task.title}</h3>
                  {task.purpose && (
                    <p className="text-sm text-gray-500 mt-0.5">{task.purpose}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={task.status} />
                  {task.due_date && (
                    <span className="text-xs text-gray-400">~{task.due_date}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {(
                  [
                    { field: "progress", label: "오늘 진행 내용" },
                    { field: "issue", label: "이슈" },
                    { field: "next_action", label: "다음 작업" },
                    { field: "insight", label: "특별 인사이트" },
                  ] as const
                ).map(({ field, label }) => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {label}
                    </label>
                    <textarea
                      rows={2}
                      value={task.log[field]}
                      onChange={(e) => updateLog(task.id, field, e.target.value)}
                      placeholder={`${label} 입력...`}
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>

              {task.logDirty && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => saveLog(task)}
                    disabled={saving === task.id}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {saving === task.id ? "저장 중..." : "저장"}
                  </button>
                </div>
              )}
            </div>
          ))}

          {tasks.length === 0 && !showNewTask && (
            <div className="text-center py-12 text-gray-400">
              {date}에 등록된 업무가 없습니다.
            </div>
          )}
        </div>
      )}

      {/* 새 업무 추가 */}
      {showNewTask ? (
        <div className="mt-5 bg-white border border-blue-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">새 업무 추가</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">프로젝트명 *</label>
              <input
                value={newTask.project_name}
                onChange={(e) => setNewTask({ ...newTask, project_name: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="프로젝트명"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">업무명 *</label>
              <input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="업무명"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">목적</label>
              <input
                value={newTask.purpose}
                onChange={(e) => setNewTask({ ...newTask, purpose: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="업무 목적"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">상태</label>
              <select
                value={newTask.status}
                onChange={(e) => setNewTask({ ...newTask, status: e.target.value as TaskStatus })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>진행중</option>
                <option>완료</option>
                <option>보류</option>
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">시작일</label>
                <input
                  type="date"
                  value={newTask.start_date}
                  onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">완료예정일</label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <button
              onClick={() => setShowNewTask(false)}
              className="px-4 py-2 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={createTask}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
            >
              추가
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowNewTask(true)}
          className="mt-5 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
        >
          + 새 업무 추가
        </button>
      )}
    </div>
  );
}
