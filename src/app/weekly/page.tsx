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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-[22px] font-bold text-[#191F28] tracking-tight">Weekly</h1>
          <p className="text-sm text-[#A0AAB4] mt-1">주간 현황 및 차주 계획</p>
        </div>
        <Link
          href={`/report/print?type=weekly&date=${weekMonday}`}
          className="px-4 py-2 bg-[#191F28] text-white rounded-xl text-sm font-medium hover:bg-[#2D3748] transition-colors"
        >
          출력
        </Link>
      </div>

      {/* 주간 네비게이션 */}
      <div className="flex items-center gap-3 mb-6 bg-white border border-[#E2E8F0] rounded-2xl px-4 py-3 shadow-sm">
        <button
          onClick={prevWeek}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#A0AAB4] hover:bg-[#F4F6FA] hover:text-[#191F28] transition-colors text-base"
        >
          ‹
        </button>
        <span className="flex-1 text-center font-semibold text-[#191F28] text-sm">{formatWeekLabel(weekMonday)}</span>
        <button
          onClick={nextWeek}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#A0AAB4] hover:bg-[#F4F6FA] hover:text-[#191F28] transition-colors text-base"
        >
          ›
        </button>
      </div>

      <div className="mb-6">
        <MemberTabs selected={selectedMember} onChange={setSelectedMember} />
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-6 bg-[#F4F6FA] p-1 rounded-xl">
        {[{ key: "this", label: "이번 주 기록" }, { key: "next", label: "차주 예정" }].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as "this" | "next")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === key
                ? "bg-white text-[#191F28] shadow-sm"
                : "text-[#A0AAB4] hover:text-[#6B7685]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-[#A0AAB4] text-sm">불러오는 중...</div>
      ) : tab === "this" ? (
        <div className="space-y-3">
          {Array.from(logsByDay.entries()).map(([dateStr, logs], i) => {
            const d = new Date(dateStr + "T00:00:00");
            const dayLabel = `${WEEKDAY_LABELS[i]} ${d.getMonth() + 1}/${d.getDate()}`;
            const isSat = i === 5;
            const isSun = i === 6;
            return (
              <div key={dateStr} className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
                <div className={`flex items-center justify-between px-4 py-3 border-b border-[#EEF1F6] ${
                  isSat ? "bg-[#F0F5FF]" : isSun ? "bg-[#FFF5F7]" : "bg-[#F9FAFB]"
                }`}>
                  <span className={`text-xs font-bold tracking-wide ${
                    isSat ? "text-[#3366FF]" : isSun ? "text-[#FF4E6A]" : "text-[#6B7685]"
                  }`}>
                    {dayLabel}
                  </span>
                  <Link
                    href={`/daily?date=${dateStr}`}
                    className="text-xs text-[#3366FF] hover:underline font-medium"
                  >
                    + 기록
                  </Link>
                </div>
                {logs.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-[#C0C8D4]">기록 없음</div>
                ) : (
                  <div className="divide-y divide-[#EEF1F6]">
                    {logs.map((log) => (
                      <div key={log.id} className="px-4 py-3">
                        <div className="flex items-center gap-2 mb-2">
                          {log.task?.project && (
                            <span className="text-xs text-[#A0AAB4]">{log.task.project.name}</span>
                          )}
                          <span className="font-semibold text-sm text-[#191F28]">{log.task?.title ?? "-"}</span>
                          {log.task && <StatusBadge status={log.task.status} />}
                        </div>
                        <div className="space-y-1">
                          {log.progress && (
                            <p className="text-xs text-[#6B7685]">
                              <span className="font-semibold text-[#A0AAB4] mr-1.5">진행</span>{log.progress}
                            </p>
                          )}
                          {log.issue && (
                            <p className="text-xs text-[#6B7685]">
                              <span className="font-semibold text-[#A0AAB4] mr-1.5">이슈</span>{log.issue}
                            </p>
                          )}
                          {log.next_action && (
                            <p className="text-xs text-[#6B7685]">
                              <span className="font-semibold text-[#A0AAB4] mr-1.5">다음</span>{log.next_action}
                            </p>
                          )}
                          {log.insight && (
                            <p className="text-xs text-[#3366FF]">
                              <span className="font-semibold text-[#A0AAB4] mr-1.5">인사이트</span>{log.insight}
                            </p>
                          )}
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
        <div>
          <p className="text-xs font-medium text-[#A0AAB4] mb-3">{formatWeekLabel(nextMonday)} 예정 업무</p>
          <div className="space-y-2">
            {nextTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between bg-white border border-[#E2E8F0] rounded-2xl px-4 py-3.5 shadow-sm">
                <div>
                  <p className="font-semibold text-sm text-[#191F28]">{task.title}</p>
                  {(task.start_date || task.due_date) && (
                    <p className="text-xs text-[#A0AAB4] mt-0.5">
                      {task.start_date ?? "-"} ~ {task.due_date ?? "-"}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteNextTask(task.id)}
                  disabled={deleting === task.id}
                  className="text-xs text-[#C0C8D4] hover:text-[#FF4E6A] transition-colors"
                >
                  {deleting === task.id ? "..." : "삭제"}
                </button>
              </div>
            ))}
            {nextTasks.length === 0 && !showForm && (
              <div className="text-center py-12 text-[#A0AAB4] text-sm">등록된 차주 예정 업무가 없습니다.</div>
            )}
          </div>

          {showForm ? (
            <div className="mt-4 bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#A0AAB4] mb-1.5 uppercase tracking-wide">업무명 *</label>
                  <input
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && addNextTask()}
                    autoFocus
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3366FF]"
                    placeholder="차주 예정 업무명"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-[#A0AAB4] mb-1.5 uppercase tracking-wide">시작일</label>
                    <input
                      type="date"
                      value={newTask.start_date}
                      onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                      className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3366FF]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-[#A0AAB4] mb-1.5 uppercase tracking-wide">완료예정일</label>
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
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#6B7685] hover:bg-[#F4F6FA] transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={addNextTask}
                  className="px-5 py-2 bg-[#3366FF] text-white rounded-xl text-sm font-medium hover:bg-[#2255EE] transition-colors"
                >
                  추가
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 w-full py-3.5 border-2 border-dashed border-[#E2E8F0] rounded-2xl text-sm text-[#A0AAB4] hover:border-[#3366FF] hover:text-[#3366FF] transition-colors"
            >
              + 차주 업무 추가
            </button>
          )}
        </div>
      )}
    </div>
  );
}
