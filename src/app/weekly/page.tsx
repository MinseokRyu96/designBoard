"use client";

import { useState, useEffect, useCallback } from "react";
import MemberTabs from "@/components/ui/MemberTabs";
import StatusBadge from "@/components/ui/StatusBadge";
import { MEMBER_ORDER, type MemberName, type TaskStatus } from "@/types";
import Link from "next/link";

const MEMBER_IDS: Record<MemberName, string> = {
  류민석: "11111111-1111-1111-1111-111111111111",
  계은영: "22222222-2222-2222-2222-222222222222",
  한다영: "33333333-3333-3333-3333-333333333333",
};

interface DailyLogEntry {
  id: string;
  log_date: string;
  progress: string | null;
  issue: string | null;
  next_action: string | null;
  insight: string | null;
  task: {
    id: string;
    title: string;
    status: TaskStatus;
    project: { name: string } | null;
  } | null;
}

interface NextTask {
  id: string;
  title: string;
  start_date: string | null;
  due_date: string | null;
  week_of: string;
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = (day + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - diff);
  return monday;
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatWeekLabel(monday: string): string {
  const d = new Date(monday + "T00:00:00");
  const sunday = new Date(d);
  sunday.setDate(d.getDate() + 6);
  return `${d.getMonth() + 1}/${d.getDate()}(월) ~ ${sunday.getMonth() + 1}/${sunday.getDate()}(일)`;
}

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

export default function WeeklyPage() {
  const [selectedMember, setSelectedMember] = useState<MemberName>(MEMBER_ORDER[0]);
  const [weekMonday, setWeekMonday] = useState<string>(() => toDateStr(getMonday(new Date())));
  const [tab, setTab] = useState<"this" | "next">("this");

  const [dailyLogs, setDailyLogs] = useState<DailyLogEntry[]>([]);
  const [nextTasks, setNextTasks] = useState<NextTask[]>([]);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", start_date: "", due_date: "" });
  const [deleting, setDeleting] = useState<string | null>(null);

  const weekSunday = toDateStr(new Date(new Date(weekMonday + "T00:00:00").setDate(new Date(weekMonday + "T00:00:00").getDate() + 6)));
  const nextMonday = toDateStr(new Date(new Date(weekMonday + "T00:00:00").setDate(new Date(weekMonday + "T00:00:00").getDate() + 7)));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [logsRes, nextRes] = await Promise.all([
        fetch(`/api/daily-logs?member_id=${MEMBER_IDS[selectedMember]}&from=${weekMonday}&to=${weekSunday}`),
        fetch(`/api/next-week-tasks?week=${nextMonday}`),
      ]);

      const logs = await logsRes.json();
      const nextAll = await nextRes.json();

      setDailyLogs(Array.isArray(logs) ? logs : []);
      setNextTasks(
        Array.isArray(nextAll)
          ? nextAll.filter((t: NextTask & { member_id: string }) => t.member_id === MEMBER_IDS[selectedMember])
          : []
      );
    } finally {
      setLoading(false);
    }
  }, [selectedMember, weekMonday, weekSunday, nextMonday]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 날짜별 로그 그룹핑
  const logsByDay = new Map<string, DailyLogEntry[]>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekMonday + "T00:00:00");
    d.setDate(d.getDate() + i);
    logsByDay.set(toDateStr(d), []);
  }
  for (const log of dailyLogs) {
    if (logsByDay.has(log.log_date)) {
      logsByDay.get(log.log_date)!.push(log);
    }
  }

  function prevWeek() {
    const d = new Date(weekMonday + "T00:00:00");
    d.setDate(d.getDate() - 7);
    setWeekMonday(toDateStr(d));
  }
  function nextWeek() {
    const d = new Date(weekMonday + "T00:00:00");
    d.setDate(d.getDate() + 7);
    setWeekMonday(toDateStr(d));
  }

  async function addNextTask() {
    if (!newTask.title) return;
    await fetch("/api/next-week-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        member_id: MEMBER_IDS[selectedMember],
        title: newTask.title,
        start_date: newTask.start_date || null,
        due_date: newTask.due_date || null,
        week_of: nextMonday,
      }),
    });
    setNewTask({ title: "", start_date: "", due_date: "" });
    setShowForm(false);
    fetchData();
  }

  async function deleteNextTask(id: string) {
    setDeleting(id);
    await fetch(`/api/next-week-tasks?id=${id}`, { method: "DELETE" });
    setDeleting(null);
    fetchData();
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Weekly</h1>
        <Link
          href={`/report/print?type=weekly&date=${weekMonday}`}
          className="px-4 py-2 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          출력
        </Link>
      </div>

      {/* 주간 네비게이션 */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={prevWeek} className="px-3 py-1.5 border border-gray-200 rounded text-sm text-gray-500 hover:bg-gray-50">← 이전</button>
        <span className="font-medium text-gray-700 text-sm">{formatWeekLabel(weekMonday)}</span>
        <button onClick={nextWeek} className="px-3 py-1.5 border border-gray-200 rounded text-sm text-gray-500 hover:bg-gray-50">다음 →</button>
      </div>

      <div className="mb-5">
        <MemberTabs selected={selectedMember} onChange={setSelectedMember} />
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {[{ key: "this", label: "이번 주 기록" }, { key: "next", label: "차주 예정" }].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as "this" | "next")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key ? "text-blue-600 border-blue-600" : "text-gray-400 border-transparent hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">불러오는 중...</div>
      ) : tab === "this" ? (
        /* ── 이번 주 기록 ── */
        <div className="space-y-4">
          {Array.from(logsByDay.entries()).map(([dateStr, logs], i) => {
            const d = new Date(dateStr + "T00:00:00");
            const dayLabel = `${WEEKDAY_LABELS[i]} ${d.getMonth() + 1}/${d.getDate()}`;
            return (
              <div key={dateStr}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-gray-500">{dayLabel}</span>
                  <Link href={`/daily?date=${dateStr}`} className="text-xs text-blue-400 hover:underline">+ 기록</Link>
                </div>
                {logs.length === 0 ? (
                  <div className="text-xs text-gray-300 pl-2 pb-2">기록 없음</div>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log) => (
                      <div key={log.id} className="bg-white border border-gray-100 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {log.task?.project && (
                            <span className="text-xs text-gray-400">{log.task.project.name}</span>
                          )}
                          <span className="font-medium text-sm text-gray-800">{log.task?.title ?? "-"}</span>
                          {log.task && <StatusBadge status={log.task.status} />}
                        </div>
                        <div className="space-y-1">
                          {log.progress && <p className="text-xs text-gray-600"><span className="text-gray-400">진행</span> {log.progress}</p>}
                          {log.issue && <p className="text-xs text-gray-600"><span className="text-gray-400">이슈</span> {log.issue}</p>}
                          {log.next_action && <p className="text-xs text-gray-600"><span className="text-gray-400">다음</span> {log.next_action}</p>}
                          {log.insight && <p className="text-xs text-blue-600"><span className="text-gray-400">인사이트</span> {log.insight}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── 차주 예정 ── */
        <div>
          <p className="text-xs text-gray-400 mb-3">{formatWeekLabel(nextMonday)} 예정 업무</p>
          <div className="space-y-2">
            {nextTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-4 py-3">
                <div>
                  <p className="font-medium text-sm text-gray-800">{task.title}</p>
                  {(task.start_date || task.due_date) && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {task.start_date ?? "-"} ~ {task.due_date ?? "-"}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteNextTask(task.id)}
                  disabled={deleting === task.id}
                  className="text-xs text-gray-300 hover:text-red-400 transition-colors"
                >
                  {deleting === task.id ? "..." : "삭제"}
                </button>
              </div>
            ))}
            {nextTasks.length === 0 && !showForm && (
              <div className="text-center py-10 text-gray-300 text-sm">등록된 차주 예정 업무가 없습니다.</div>
            )}
          </div>

          {showForm ? (
            <div className="mt-4 bg-white border border-blue-200 rounded-xl p-5">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">업무명 *</label>
                  <input
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && addNextTask()}
                    autoFocus
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="차주 예정 업무명"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">시작일</label>
                    <input type="date" value={newTask.start_date}
                      onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">완료예정일</label>
                    <input type="date" value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 justify-end">
                <button onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50">취소</button>
                <button onClick={addNextTask}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">추가</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)}
              className="mt-4 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors">
              + 차주 업무 추가
            </button>
          )}
        </div>
      )}
    </div>
  );
}
