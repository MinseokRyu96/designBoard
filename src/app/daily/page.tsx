"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import MemberTabs from "@/components/ui/MemberTabs";
import StatusBadge from "@/components/ui/StatusBadge";
import TaskAttachments from "@/components/ui/TaskAttachments";
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

const LOG_FIELDS = [
  { field: "progress" as const, label: "진행 내용", placeholder: "오늘 진행한 내용을 입력하세요" },
  { field: "issue" as const, label: "이슈 · 블로커", placeholder: "발생한 이슈나 블로커가 있나요?" },
  { field: "next_action" as const, label: "다음 액션", placeholder: "내일 또는 다음으로 할 작업" },
  { field: "insight" as const, label: "인사이트", placeholder: "오늘 배운 점이나 아이디어" },
];

function DailyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedMember, setSelectedMember] = useState<MemberName>(MEMBER_ORDER[0]);
  const [date, setDate] = useState(searchParams.get("date") ?? todayStr());
  const [tasks, setTasks] = useState<TaskWithLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string; project_name: string; purpose: string;
    status: TaskStatus; due_date: string;
  } | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "", project_name: "", purpose: "",
    status: "진행중" as TaskStatus, due_date: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [logsRes, tasksRes] = await Promise.all([
        fetch(`/api/daily-logs?member_id=${MEMBER_IDS[selectedMember]}&date=${date}`),
        fetch(`/api/tasks?member_id=${MEMBER_IDS[selectedMember]}&date=${date}`),
      ]);
      const logs: { task: { id: string } | null; progress: string; issue: string; next_action: string; insight: string }[] = await logsRes.json();
      const allTasks: (Omit<TaskWithLog, "log" | "logDirty">)[] = await tasksRes.json();

      const logMap = new Map(logs.filter(l => l.task).map(l => [l.task!.id, l]));

      setTasks(allTasks.map((t) => {
        const log = logMap.get(t.id);
        return {
          ...t,
          log: {
            progress: log?.progress ?? "",
            issue: log?.issue ?? "",
            next_action: log?.next_action ?? "",
            insight: log?.insight ?? "",
          },
          logDirty: false,
        };
      }));
    } finally {
      setLoading(false);
    }
  }, [selectedMember, date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function updateLog(taskId: string, field: string, value: string) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, log: { ...t.log, [field]: value }, logDirty: true } : t));
  }

  async function saveLog(task: TaskWithLog) {
    setSaving(task.id);
    try {
      await fetch("/api/daily-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: task.id, member_id: MEMBER_IDS[selectedMember], log_date: date, ...task.log }),
      });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, logDirty: false } : t));
    } finally {
      setSaving(null);
    }
  }

  async function deleteTask(taskId: string) {
    if (!confirm("이 업무를 삭제하시겠습니까? 연결된 로그도 함께 삭제됩니다.")) return;
    setDeleting(taskId);
    await fetch(`/api/tasks?id=${taskId}`, { method: "DELETE" });
    setDeleting(null);
    fetchData();
  }

  function startEdit(task: TaskWithLog) {
    setEditingId(task.id);
    setEditForm({
      title: task.title,
      project_name: task.project?.name ?? "",
      purpose: task.purpose ?? "",
      status: task.status,
      due_date: task.due_date ?? "",
    });
  }

  async function saveEdit(taskId: string) {
    if (!editForm) return;
    setEditSaving(true);
    try {
      await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, title: editForm.title, purpose: editForm.purpose || null, status: editForm.status, due_date: editForm.due_date || null }),
      });
      setEditingId(null);
      setEditForm(null);
      fetchData();
    } finally {
      setEditSaving(false);
    }
  }

  async function createTask() {
    if (!newTask.title) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        member_id: MEMBER_IDS[selectedMember],
        title: newTask.title,
        project_name: newTask.project_name || undefined,
        purpose: newTask.purpose || undefined,
        status: newTask.status,
        start_date: date,
        due_date: newTask.due_date || undefined,
      }),
    });
    setShowNewTask(false);
    setNewTask({ title: "", project_name: "", purpose: "", status: "진행중", due_date: "" });
    fetchData();
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-[22px] font-bold text-[#191F28] tracking-tight">Daily Log</h1>
          <p className="text-sm text-[#A0AAB4] mt-1">일별 업무 기록</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); router.replace(`/daily?date=${e.target.value}`); }}
            className="border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3366FF] bg-white"
          />
          <Link
            href={`/report/print?type=daily&date=${date}`}
            className="px-4 py-2 bg-[#191F28] text-white rounded-xl text-sm font-medium hover:bg-[#2D3748] transition-colors"
          >
            출력
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <MemberTabs selected={selectedMember} onChange={setSelectedMember} />
      </div>

      {loading ? (
        <div className="text-center py-16 text-[#A0AAB4] text-sm">불러오는 중...</div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
              {/* 카드 헤더 */}
              <div className="px-5 pt-5 pb-4 border-b border-[#EEF1F6]">
                {editingId === task.id && editForm ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#A0AAB4] mb-1.5 uppercase tracking-wide">업무명 *</label>
                      <input
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3366FF]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#A0AAB4] mb-1.5 uppercase tracking-wide">목적</label>
                        <input
                          value={editForm.purpose}
                          onChange={(e) => setEditForm({ ...editForm, purpose: e.target.value })}
                          className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3366FF]"
                          placeholder="업무 목적"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#A0AAB4] mb-1.5 uppercase tracking-wide">상태</label>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value as TaskStatus })}
                          className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3366FF] bg-white"
                        >
                          <option>진행중</option>
                          <option>완료</option>
                          <option>보류</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#A0AAB4] mb-1.5 uppercase tracking-wide">완료 예정일</label>
                      <input
                        type="date"
                        value={editForm.due_date}
                        onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                        className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3366FF]"
                      />
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        onClick={() => { setEditingId(null); setEditForm(null); }}
                        className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#6B7685] hover:bg-[#F4F6FA] transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => saveEdit(task.id)}
                        disabled={editSaving}
                        className="px-4 py-2 bg-[#3366FF] text-white rounded-xl text-sm font-medium hover:bg-[#2255EE] disabled:opacity-50 transition-colors"
                      >
                        {editSaving ? "저장 중..." : "저장"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {task.project && (
                        <p className="text-xs font-medium text-[#A0AAB4] mb-1">{task.project.name}</p>
                      )}
                      <h3 className="font-semibold text-[#191F28] text-[15px] leading-snug">{task.title}</h3>
                      {task.purpose && (
                        <p className="text-sm text-[#6B7685] mt-1">{task.purpose}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 pt-0.5">
                      <StatusBadge status={task.status} />
                      {task.due_date && (
                        <span className="text-xs text-[#A0AAB4]">~{task.due_date}</span>
                      )}
                      <button
                        onClick={() => startEdit(task)}
                        className="text-xs text-[#A0AAB4] hover:text-[#3366FF] border border-[#E2E8F0] rounded-lg px-2.5 py-1 transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        disabled={deleting === task.id}
                        className="text-xs text-[#C0C8D4] hover:text-[#FF4E6A] transition-colors"
                      >
                        {deleting === task.id ? "..." : "삭제"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 로그 필드 */}
              <div className="px-5 py-4 space-y-4">
                {LOG_FIELDS.map(({ field, label, placeholder }) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold text-[#A0AAB4] mb-1.5 uppercase tracking-wide">{label}</label>
                    <textarea
                      rows={2}
                      value={task.log[field]}
                      onChange={(e) => updateLog(task.id, field, e.target.value)}
                      placeholder={placeholder}
                      className="w-full border border-[#EEF1F6] rounded-xl px-3 py-2.5 text-sm text-[#191F28] resize-none focus:outline-none focus:ring-2 focus:ring-[#3366FF] bg-[#F9FAFB] placeholder:text-[#C0C8D4] transition-colors"
                    />
                  </div>
                ))}

                {task.logDirty && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => saveLog(task)}
                      disabled={saving === task.id}
                      className="px-5 py-2 bg-[#3366FF] text-white rounded-xl text-sm font-medium hover:bg-[#2255EE] disabled:opacity-50 transition-colors"
                    >
                      {saving === task.id ? "저장 중..." : "저장"}
                    </button>
                  </div>
                )}
              </div>

              <div className="px-5 pb-5">
                <TaskAttachments taskId={task.id} />
              </div>
            </div>
          ))}

          {tasks.length === 0 && !showNewTask && (
            <div className="text-center py-16">
              <p className="text-[#A0AAB4] text-sm">{date}에 기록된 업무가 없습니다.</p>
              <p className="text-xs text-[#C0C8D4] mt-1">아래 버튼으로 업무를 추가해보세요</p>
            </div>
          )}
        </div>
      )}

      {/* 업무 추가 폼 */}
      {showNewTask ? (
        <div className="mt-4 bg-white border border-[#3366FF] border-opacity-30 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-[#191F28] mb-4 text-[15px]">새 업무 추가</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#A0AAB4] mb-1.5 uppercase tracking-wide">업무명 *</label>
              <input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && createTask()}
                autoFocus
                className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3366FF]"
                placeholder="오늘 진행한 업무명"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#A0AAB4] mb-1.5 uppercase tracking-wide">프로젝트 (선택)</label>
                <input
                  value={newTask.project_name}
                  onChange={(e) => setNewTask({ ...newTask, project_name: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3366FF]"
                  placeholder="프로젝트명"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#A0AAB4] mb-1.5 uppercase tracking-wide">상태</label>
                <select
                  value={newTask.status}
                  onChange={(e) => setNewTask({ ...newTask, status: e.target.value as TaskStatus })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3366FF] bg-white"
                >
                  <option>진행중</option>
                  <option>완료</option>
                  <option>보류</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#A0AAB4] mb-1.5 uppercase tracking-wide">목적 (선택)</label>
                <input
                  value={newTask.purpose}
                  onChange={(e) => setNewTask({ ...newTask, purpose: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3366FF]"
                  placeholder="업무 목적"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#A0AAB4] mb-1.5 uppercase tracking-wide">완료 예정일 (선택)</label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3366FF]"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <button
              onClick={() => setShowNewTask(false)}
              className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#6B7685] hover:bg-[#F4F6FA] transition-colors"
            >
              취소
            </button>
            <button
              onClick={createTask}
              className="px-5 py-2 bg-[#3366FF] text-white rounded-xl text-sm font-medium hover:bg-[#2255EE] transition-colors"
            >
              추가
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowNewTask(true)}
          className="mt-4 w-full py-3.5 border-2 border-dashed border-[#E2E8F0] rounded-2xl text-sm text-[#A0AAB4] hover:border-[#3366FF] hover:text-[#3366FF] transition-colors"
        >
          + 업무 추가
        </button>
      )}
    </div>
  );
}

export default function DailyPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-[#A0AAB4]">로딩 중...</div>}>
      <DailyContent />
    </Suspense>
  );
}
