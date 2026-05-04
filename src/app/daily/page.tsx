"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import MemberTabs from "@/components/ui/MemberTabs";
import StatusBadge from "@/components/ui/StatusBadge";
import TaskAttachments from "@/components/ui/TaskAttachments";
import Icon from "@/components/ui/Icon";
import Tooltip from "@/components/ui/Tooltip";
import { MEMBER_ORDER, type MemberName, type TaskStatus } from "@/types";
import { KOREAN_HOLIDAYS } from "@/lib/holidays";
import Link from "next/link";

function isNonWorkday(dateStr: string): boolean {
  const day = new Date(dateStr + "T00:00:00").getDay();
  return day === 0 || day === 6 || !!KOREAN_HOLIDAYS[dateStr];
}

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
  log: { progress: string; issue: string; next_action: string; insight: string };
  logDirty: boolean;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const LOG_FIELDS = [
  { field: "progress" as const, label: "진행 내용", placeholder: "오늘 진행한 내용을 입력하세요" },
  { field: "issue" as const, label: "이슈 · 블로커", placeholder: "발생한 이슈나 블로커가 있나요?" },
  { field: "next_action" as const, label: "다음 액션", placeholder: "내일 또는 다음으로 할 작업" },
  { field: "insight" as const, label: "인사이트", placeholder: "오늘 배운 점이나 아이디어" },
] as const;

function DailyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ── #3: 마지막 선택 멤버 localStorage 유지 ──────────────────────────────
  const [selectedMember, setSelectedMember] = useState<MemberName>(MEMBER_ORDER[0]);
  useEffect(() => {
    const saved = localStorage.getItem("designboard_member");
    if (saved && MEMBER_ORDER.includes(saved as MemberName)) {
      setSelectedMember(saved as MemberName);
    }
  }, []);

  function handleMemberChange(member: MemberName) {
    setSelectedMember(member);
    localStorage.setItem("designboard_member", member);
  }

  // ── 기본 상태 ──────────────────────────────────────────────────────────
  const [date, setDate] = useState(searchParams.get("date") ?? todayStr());
  const [tasks, setTasks] = useState<TaskWithLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [collapsedTasks, setCollapsedTasks] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string; project_name: string; purpose: string;
    status: TaskStatus; due_date: string;
  } | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  // ── #1: 퀵 추가 ────────────────────────────────────────────────────────
  const [quickTitle, setQuickTitle] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const [detailForm, setDetailForm] = useState({
    project_name: "", purpose: "", status: "진행중" as TaskStatus, due_date: "",
  });
  const [creating, setCreating] = useState(false);
  const [focusNewTaskId, setFocusNewTaskId] = useState<string | null>(null);
  const logRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());

  // 새 업무 카드가 렌더링되면 첫 번째 로그 필드에 자동 포커스
  useEffect(() => {
    if (!focusNewTaskId) return;
    const el = logRefs.current.get(focusNewTaskId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus();
      setFocusNewTaskId(null);
    }
  }, [tasks, focusNewTaskId]);

  // ── #2: 자동 저장 ──────────────────────────────────────────────────────
  const tasksRef = useRef<TaskWithLog[]>([]);
  const autoSaveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [saveStatus, setSaveStatus] = useState<Map<string, "saving" | "saved">>(new Map());

  // tasks 변경 시 ref 동기화 (클로저 stale 방지)
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  function scheduleSave(taskId: string) {
    const existing = autoSaveTimers.current.get(taskId);
    if (existing) clearTimeout(existing);
    autoSaveTimers.current.set(taskId, setTimeout(() => {
      const task = tasksRef.current.find(t => t.id === taskId);
      if (task?.logDirty) saveLog(task);
    }, 1500));
  }

  async function saveLog(task: TaskWithLog) {
    setSaveStatus(prev => new Map(prev).set(task.id, "saving"));
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
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, logDirty: false } : t));
      setSaveStatus(prev => new Map(prev).set(task.id, "saved"));
      // 2초 후 "저장됨" 사라짐
      setTimeout(() => setSaveStatus(prev => {
        const next = new Map(prev);
        next.delete(task.id);
        return next;
      }), 2000);
    } catch {
      setSaveStatus(prev => { const next = new Map(prev); next.delete(task.id); return next; });
    }
  }

  // ── 데이터 로드 ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [logsRes, tasksRes] = await Promise.all([
        fetch(`/api/daily-logs?member_id=${MEMBER_IDS[selectedMember]}&date=${date}`),
        fetch(`/api/tasks?member_id=${MEMBER_IDS[selectedMember]}&date=${date}`),
      ]);
      const logs = await logsRes.json();
      const allTasks = await tasksRes.json();

      type RawLog = { task: { id: string } | null; progress: string; issue: string; next_action: string; insight: string };
      const logMap = new Map<string, RawLog>(
        (Array.isArray(logs) ? logs as RawLog[] : [])
          .filter(l => l.task)
          .map(l => [l.task!.id, l])
      );

      setTasks(
        (Array.isArray(allTasks) ? allTasks : []).map((t: Omit<TaskWithLog, "log" | "logDirty">) => {
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
        })
      );
    } finally {
      setLoading(false);
    }
  }, [selectedMember, date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function updateLog(taskId: string, field: string, value: string) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, log: { ...t.log, [field]: value }, logDirty: true } : t));
    scheduleSave(taskId); // #2: 1.5초 후 자동 저장
  }

  // ── #4: 상태 퀵 토글 ───────────────────────────────────────────────────
  const STATUS_CYCLE: TaskStatus[] = ["진행중", "완료", "보류"];
  async function updateStatus(taskId: string, current: TaskStatus) {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length];
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: next } : t));
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, status: next }),
    });
  }

  // ── #5: 태스크 복제 ────────────────────────────────────────────────────
  async function duplicateTask(task: TaskWithLog) {
    if (creating) return;
    setCreating(true);
    try {
      const taskRes = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: MEMBER_IDS[selectedMember],
          title: task.title,
          project_name: task.project?.name || undefined,
          purpose: task.purpose || undefined,
          status: task.status,
          start_date: date,
          due_date: task.due_date || undefined,
        }),
      });
      const newTask = await taskRes.json();
      if (newTask?.id) {
        await fetch("/api/daily-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task_id: newTask.id, member_id: MEMBER_IDS[selectedMember], log_date: date }),
        });
        setFocusNewTaskId(newTask.id);
      }
      await fetchData();
    } finally {
      setCreating(false);
    }
  }

  // ── #6: 카드 접기/펼치기 ───────────────────────────────────────────────
  function toggleCollapse(taskId: string) {
    setCollapsedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
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
        body: JSON.stringify({
          id: taskId,
          title: editForm.title,
          purpose: editForm.purpose || null,
          status: editForm.status,
          due_date: editForm.due_date || null,
        }),
      });
      setEditingId(null);
      setEditForm(null);
      fetchData();
    } finally {
      setEditSaving(false);
    }
  }

  // ── #1: 퀵 업무 생성 ───────────────────────────────────────────────────
  async function quickCreate() {
    const title = quickTitle.trim();
    if (!title || creating) return;

    // 현재 폼 값을 로컬에 캡처한 뒤 즉시 리셋 — 연속 생성 시 값 공유 방지
    const { project_name, purpose, status, due_date } = detailForm;
    setQuickTitle("");
    setShowDetail(false);
    setDetailForm({ project_name: "", purpose: "", status: "진행중", due_date: "" });
    setCreating(true);

    try {
      const taskRes = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: MEMBER_IDS[selectedMember],
          title,
          project_name: project_name || undefined,
          purpose: purpose || undefined,
          status,
          start_date: date,
          due_date: due_date || undefined,
        }),
      });
      const task = await taskRes.json();
      if (task?.id) {
        await fetch("/api/daily-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task_id: task.id, member_id: MEMBER_IDS[selectedMember], log_date: date }),
        });
        setFocusNewTaskId(task.id);
      }
      await fetchData();
    } finally {
      setCreating(false);
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-[22px] font-bold text-[#191F28] tracking-tight">Daily Log</h1>
          <p className="text-sm text-[#A0AAB4] mt-1">일별 업무 기록</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date" value={date}
            onChange={(e) => { setDate(e.target.value); router.replace(`/daily?date=${e.target.value}`); }}
            className="border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3366FF] bg-white"
          />
          <Link href={`/report/print?type=daily&date=${date}`}
            className="px-4 py-2 bg-[#191F28] text-white rounded-xl text-sm font-medium hover:bg-[#2D3748] transition-colors">
            출력
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <MemberTabs selected={selectedMember} onChange={handleMemberChange} />
      </div>

      {/* ── #1: 퀵 추가 카드 ── */}
      {(() => {
        const isOff = isNonWorkday(date);
        const offLabel = KOREAN_HOLIDAYS[date] ?? (new Date(date + "T00:00:00").getDay() === 0 ? "일요일" : "토요일");
        return (
          <>
            {isOff && (
              <div className="flex items-center gap-2 mb-3 px-4 py-2.5 bg-[#FFF5F7] border border-[#FFD6DE] rounded-xl text-xs text-[#FF4E6A] font-medium">
                <Icon name="warning" size={14} />
                {offLabel} — 휴무일에는 업무 입력이 제한됩니다.
              </div>
            )}
            <div className={`bg-white border border-[#E2E8F0] rounded-2xl shadow-sm mb-5 overflow-hidden ${isOff ? "opacity-50 pointer-events-none select-none" : ""}`}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <Icon name="plus" size={20} className="shrink-0 select-none" />
                <input
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && quickCreate()}
                  placeholder="업무명 입력 후 Enter…"
                  className="flex-1 text-sm text-[#191F28] placeholder:text-[#C0C8D4] focus:outline-none bg-transparent"
                  disabled={isOff}
                />
                <button
                  onClick={() => setShowDetail(v => !v)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors shrink-0 ${
                    showDetail
                      ? "border-[#3366FF] text-[#3366FF] bg-[#EEF3FF]"
                      : "border-[#E2E8F0] text-[#A0AAB4] hover:border-[#C0C8D4] hover:text-[#6B7685]"
                  }`}
                >
                  상세 {showDetail ? "▴" : "▾"}
                </button>
                {quickTitle.trim() && (
                  <button
                    onClick={quickCreate}
                    disabled={creating}
                    className="text-xs px-3 py-1.5 bg-[#3366FF] text-white rounded-lg font-medium hover:bg-[#2255EE] disabled:opacity-50 transition-colors shrink-0"
                  >
                    {creating ? "추가 중…" : "추가"}
                  </button>
                )}
              </div>

        {/* 상세 옵션 (접기/펼치기) */}
        {showDetail && (
          <div className="px-4 pb-4 pt-0.5 border-t border-[#EEF1F6] space-y-3">
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-semibold text-[#A0AAB4] mb-1.5 uppercase tracking-wide">프로젝트</label>
                <input
                  value={detailForm.project_name}
                  onChange={(e) => setDetailForm(f => ({ ...f, project_name: e.target.value }))}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3366FF]"
                  placeholder="프로젝트명"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#A0AAB4] mb-1.5 uppercase tracking-wide">상태</label>
                <select
                  value={detailForm.status}
                  onChange={(e) => setDetailForm(f => ({ ...f, status: e.target.value as TaskStatus }))}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3366FF]"
                >
                  <option>진행중</option><option>완료</option><option>보류</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#A0AAB4] mb-1.5 uppercase tracking-wide">목적</label>
                <input
                  value={detailForm.purpose}
                  onChange={(e) => setDetailForm(f => ({ ...f, purpose: e.target.value }))}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3366FF]"
                  placeholder="업무 목적"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#A0AAB4] mb-1.5 uppercase tracking-wide">완료 예정일</label>
                <input
                  type="date"
                  value={detailForm.due_date}
                  onChange={(e) => setDetailForm(f => ({ ...f, due_date: e.target.value }))}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3366FF]"
                />
              </div>
            </div>
          </div>
        )}
      </div>
          </>
        );
      })()}

      {/* ── 업무 카드 목록 ── */}
      {loading ? (
        <div className="text-center py-16 text-[#A0AAB4] text-sm">불러오는 중...</div>
      ) : (
        <div className="space-y-4">
          {tasks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#A0AAB4] text-sm">{date}에 기록된 업무가 없습니다.</p>
              <p className="text-xs text-[#C0C8D4] mt-1">위 입력창에 업무명을 입력하고 Enter를 누르세요</p>
            </div>
          )}

          {tasks.map((task) => {
            const status = saveStatus.get(task.id);
            return (
              <div key={task.id} className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">

                {/* 카드 헤더 */}
                <div className="px-5 pt-5 pb-4 border-b border-[#EEF1F6]">
                  {editingId === task.id && editForm ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#A0AAB4] mb-1.5 uppercase tracking-wide">업무명 *</label>
                        <input value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3366FF]" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#A0AAB4] mb-1.5 uppercase tracking-wide">목적</label>
                          <input value={editForm.purpose}
                            onChange={(e) => setEditForm({ ...editForm, purpose: e.target.value })}
                            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3366FF]"
                            placeholder="업무 목적" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#A0AAB4] mb-1.5 uppercase tracking-wide">상태</label>
                          <select value={editForm.status}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value as TaskStatus })}
                            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3366FF]">
                            <option>진행중</option><option>완료</option><option>보류</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#A0AAB4] mb-1.5 uppercase tracking-wide">완료 예정일</label>
                        <input type="date" value={editForm.due_date}
                          onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                          className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3366FF]" />
                      </div>
                      <div className="flex gap-2 justify-end pt-1">
                        <button onClick={() => { setEditingId(null); setEditForm(null); }}
                          className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#6B7685] hover:bg-[#F4F6FA] transition-colors">취소</button>
                        <button onClick={() => saveEdit(task.id)} disabled={editSaving}
                          className="px-4 py-2 bg-[#3366FF] text-white rounded-xl text-sm font-medium hover:bg-[#2255EE] disabled:opacity-50 transition-colors">
                          {editSaving ? "저장 중..." : "저장"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {task.project && <p className="text-xs font-medium text-[#A0AAB4] mb-1">{task.project.name}</p>}
                        <h3 className="font-semibold text-[#191F28] text-[15px] leading-snug">{task.title}</h3>
                        {task.purpose && <p className="text-sm text-[#6B7685] mt-1">{task.purpose}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                        {/* #4: 클릭으로 상태 순환 */}
                        <Tooltip text="클릭하여 상태 변경">
                          <StatusBadge status={task.status} onClick={() => updateStatus(task.id, task.status)} />
                        </Tooltip>
                        {task.due_date && <span className="text-xs text-[#A0AAB4]">~{task.due_date}</span>}
                        <Tooltip text="수정">
                          <button onClick={() => startEdit(task)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E2E8F0] hover:border-[#3366FF] opacity-60 hover:opacity-100 transition-all">
                            <Icon name="pencil" size={14} />
                          </button>
                        </Tooltip>
                        {/* #5: 태스크 복제 */}
                        <Tooltip text="복제">
                          <button onClick={() => duplicateTask(task)} disabled={creating}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E2E8F0] hover:border-[#3366FF] opacity-60 hover:opacity-100 transition-all disabled:opacity-30">
                            <Icon name="copy" size={14} />
                          </button>
                        </Tooltip>
                        <Tooltip text="삭제">
                          <button onClick={() => deleteTask(task.id)} disabled={deleting === task.id}
                            className="w-7 h-7 flex items-center justify-center rounded-lg opacity-40 hover:opacity-100 hover:bg-[#FFF5F7] transition-all">
                            {deleting === task.id ? <span className="text-xs">…</span> : <Icon name="trash" size={14} />}
                          </button>
                        </Tooltip>
                        {/* #6: 접기/펼치기 */}
                        <Tooltip text={collapsedTasks.has(task.id) ? "펼치기" : "접기"}>
                          <button onClick={() => toggleCollapse(task.id)}
                            className="text-xs text-[#A0AAB4] hover:text-[#191F28] w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F4F6FA] transition-colors ml-0.5">
                            {collapsedTasks.has(task.id) ? "▾" : "▴"}
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  )}
                </div>

                {/* #6: 로그 필드 — collapsed 시 숨김 */}
                {!collapsedTasks.has(task.id) && (
                  <>
                    <div className="px-5 py-4 space-y-4">
                      {LOG_FIELDS.map(({ field, label, placeholder }) => (
                        <div key={field}>
                          <label className="block text-xs font-semibold text-[#A0AAB4] mb-1.5 uppercase tracking-wide">{label}</label>
                          <textarea
                            rows={2}
                            value={task.log[field]}
                            onChange={(e) => updateLog(task.id, field, e.target.value)}
                            placeholder={placeholder}
                            ref={(el) => {
                              if (field === "progress") {
                                if (el) logRefs.current.set(task.id, el);
                                else logRefs.current.delete(task.id);
                              }
                            }}
                            className="w-full border border-[#EEF1F6] rounded-xl px-3 py-2.5 text-sm text-[#191F28] resize-none focus:outline-none focus:ring-2 focus:ring-[#3366FF] bg-[#F9FAFB] placeholder:text-[#C0C8D4] transition-colors"
                          />
                        </div>
                      ))}

                      {/* ── #2: 저장 상태 표시 ── */}
                      <div className="flex justify-end items-center gap-3 pt-1 min-h-[32px]">
                        {status === "saving" && (
                          <span className="text-xs text-[#A0AAB4] flex items-center gap-1.5">
                            <span className="w-3 h-3 border-2 border-[#A0AAB4] border-t-transparent rounded-full animate-spin" />
                            저장 중…
                          </span>
                        )}
                        {status === "saved" && (
                          <span className="flex items-center gap-1 text-xs text-[#0BB15A] font-semibold">
                            <Icon name="check" size={14} /> 저장됨
                          </span>
                        )}
                        {!status && task.logDirty && (
                          <button
                            onClick={() => saveLog(task)}
                            className="px-5 py-2 bg-[#3366FF] text-white rounded-xl text-sm font-medium hover:bg-[#2255EE] transition-colors"
                          >
                            저장
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="px-5 pb-5">
                      <TaskAttachments taskId={task.id} />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
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
