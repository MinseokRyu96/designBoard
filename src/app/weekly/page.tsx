"use client";

import { useState, useEffect, useCallback } from "react";
import MemberTabs from "@/components/ui/MemberTabs";
import StatusBadge from "@/components/ui/StatusBadge";
import TaskAttachments from "@/components/ui/TaskAttachments";
import Icon from "@/components/ui/Icon";
import { type TaskStatus } from "@/types";
import { KOREAN_HOLIDAYS } from "@/lib/holidays";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";


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

function getSunday(d: Date): Date {
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - d.getDay()); // 일요일로 되돌림 (0=일)
  return sunday;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00");
  const sat = new Date(d);
  sat.setDate(d.getDate() + 6);
  return `${d.getMonth() + 1}/${d.getDate()}(일) ~ ${sat.getMonth() + 1}/${sat.getDate()}(토)`;
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default function WeeklyPage() {
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [loggedInName, setLoggedInName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("name").eq("id", user.id).single();
      if (data?.name) setLoggedInName(data.name);
    });
  }, []);

  useEffect(() => {
    fetch("/api/members")
      .then(r => r.json())
      .then((data: { id: string; name: string }[]) => {
        if (!Array.isArray(data) || data.length === 0) return;
        setMembers(data);
        const saved = localStorage.getItem("designboard_member");
        const match = data.find(m => m.name === saved);
        setSelectedMember(match ? match.name : data[0].name);
      });
  }, []);
  const [weekMonday, setWeekMonday] = useState<string>(() => toDateStr(getSunday(new Date())));
  const [tab, setTab] = useState<"this" | "next">("this");

  const [dailyLogs, setDailyLogs] = useState<DailyLogEntry[]>([]);
  const [nextTasks, setNextTasks] = useState<NextTask[]>([]);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", start_date: "", due_date: "" });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<DailyLogEntry | null>(null);

  const selectedMemberId = members.find(m => m.name === selectedMember)?.id ?? "";

  const weekSunday = toDateStr(new Date(new Date(weekMonday + "T00:00:00").setDate(new Date(weekMonday + "T00:00:00").getDate() + 6)));
  const nextMonday = toDateStr(new Date(new Date(weekMonday + "T00:00:00").setDate(new Date(weekMonday + "T00:00:00").getDate() + 7)));

  const fetchData = useCallback(async () => {
    if (!selectedMemberId) return;
    setLoading(true);
    try {
      const [logsRes, nextRes] = await Promise.all([
        fetch(`/api/daily-logs?member_id=${selectedMemberId}&from=${weekMonday}&to=${weekSunday}`),
        fetch(`/api/next-week-tasks?week=${nextMonday}`),
      ]);

      const logs = await logsRes.json();
      const nextAll = await nextRes.json();

      setDailyLogs(Array.isArray(logs) ? logs : []);
      setNextTasks(
        Array.isArray(nextAll)
          ? nextAll.filter((t: NextTask & { member_id: string }) => t.member_id === selectedMemberId)
          : []
      );
    } finally {
      setLoading(false);
    }
  }, [selectedMemberId, weekMonday, weekSunday, nextMonday]);

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
        member_id: selectedMemberId,
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

  const isOwner = loggedInName === selectedMember;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
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
        <MemberTabs members={members.map(m => m.name)} selected={selectedMember} onChange={setSelectedMember} />
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
            const holiday = KOREAN_HOLIDAYS[dateStr];
            const dayLabel = `${WEEKDAY_LABELS[i]} ${d.getMonth() + 1}/${d.getDate()}`;
            const isSun = i === 0;
            const isSat = i === 6;
            const isRed = isSun || !!holiday;
            return (
              <div key={dateStr} className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
                <div className={`flex items-center justify-between px-4 py-3 border-b border-[#EEF1F6] ${
                  isSat ? "bg-[#F0F5FF]" : isRed ? "bg-[#FFF5F7]" : "bg-[#F9FAFB]"
                }`}>
                  <span className={`text-sm font-bold tracking-wide ${
                    isSat ? "text-[#3366FF]" : isRed ? "text-[#FF4E6A]" : "text-[#6B7685]"
                  }`}>
                    {dayLabel}{holiday && <span className="font-medium ml-1.5 opacity-75">· {holiday}</span>}
                  </span>
                  {isOwner && !isSun && !isSat && !holiday && (
                    <Link
                      href={`/daily?date=${dateStr}`}
                      className="text-xs text-[#3366FF] hover:underline font-medium"
                    >
                      <Icon name="plus" size={12} className="inline mr-0.5" /> 기록
                    </Link>
                  )}
                </div>
                {logs.length === 0 ? (
                  <div className="px-5 py-4 text-sm text-[#C0C8D4]">기록 없음</div>
                ) : (() => {
                  const inProgress = logs.filter(l => l.task?.status !== "완료");
                  const done = logs.filter(l => l.task?.status === "완료");
                  const hasBoth = inProgress.length > 0 && done.length > 0;

                  const renderLog = (log: DailyLogEntry, isDone: boolean) => (
                    <div key={log.id} className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                        {log.task?.project && (
                          <span className="text-xs font-medium text-[#A0AAB4] bg-[#F4F6FA] px-2 py-0.5 rounded-md">
                            {log.task.project.name}
                          </span>
                        )}
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="font-semibold text-base text-[#191F28] hover:text-[#3366FF] transition-colors text-left"
                        >
                          {log.task?.title ?? "-"}
                        </button>
                      </div>
                      {(log.progress || log.issue || log.next_action || log.insight) && (
                        <div className="grid grid-cols-[2.5rem_1fr] gap-x-2 gap-y-1.5 items-start">
                          {log.progress && <>
                            <span className="text-xs font-bold text-[#B0BAC8] pt-0.5">진행</span>
                            <p className="text-sm text-[#6B7685] leading-relaxed whitespace-pre-wrap">{log.progress}</p>
                          </>}
                          {log.issue && <>
                            <span className="text-xs font-bold text-[#B0BAC8] pt-0.5">이슈</span>
                            <p className="text-sm text-[#6B7685] leading-relaxed whitespace-pre-wrap">{log.issue}</p>
                          </>}
                          {log.next_action && <>
                            <span className="text-xs font-bold text-[#B0BAC8] pt-0.5">다음</span>
                            <p className="text-sm text-[#6B7685] leading-relaxed whitespace-pre-wrap">{log.next_action}</p>
                          </>}
                          {log.insight && <>
                            <span className="text-xs font-bold text-[#B0BAC8] pt-0.5">인사</span>
                            <p className="text-sm text-[#3366FF] leading-relaxed whitespace-pre-wrap">{log.insight}</p>
                          </>}
                        </div>
                      )}
                      {log.task && <TaskAttachments taskId={log.task.id} readOnly />}
                    </div>
                  );

                  return (
                    <div>
                      {inProgress.length > 0 && (
                        <div>
                          {hasBoth && (
                            <div className="flex items-center gap-2 px-5 pt-3 pb-1">
                              <span className="text-[11px] font-bold text-[#3366FF] tracking-wide uppercase">진행 중</span>
                              <div className="flex-1 h-px bg-[#EEF3FF]" />
                            </div>
                          )}
                          <div className="divide-y divide-[#EEF1F6]">
                            {inProgress.map(log => renderLog(log, false))}
                          </div>
                        </div>
                      )}
                      {done.length > 0 && (
                        <div className={hasBoth ? "border-t border-[#EEF1F6]" : ""}>
                          {hasBoth && (
                            <div className="flex items-center gap-2 px-5 pt-3 pb-1">
                              <span className="text-[11px] font-bold text-[#A0AAB4] tracking-wide uppercase">완료</span>
                              <div className="flex-1 h-px bg-[#EEF1F6]" />
                            </div>
                          )}
                          <div className="divide-y divide-[#EEF1F6]">
                            {done.map(log => renderLog(log, true))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
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
                {isOwner && (
                  <button
                    onClick={() => deleteNextTask(task.id)}
                    disabled={deleting === task.id}
                    className="text-xs text-[#C0C8D4] hover:text-[#FF4E6A] transition-colors"
                  >
                    {deleting === task.id ? "..." : "삭제"}
                  </button>
                )}
              </div>
            ))}
            {nextTasks.length === 0 && !showForm && (
              <div className="text-center py-12 text-[#A0AAB4] text-sm">등록된 차주 예정 업무가 없습니다.</div>
            )}
          </div>

          {isOwner && showForm ? (
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
                      min={newTask.start_date || undefined}
                      value={newTask.due_date}
                      onChange={(e) => {
                        const val = e.target.value;
                        const min = newTask.start_date;
                        setNewTask({ ...newTask, due_date: (min && val && val < min) ? min : val });
                      }}
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
          ) : isOwner ? (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 w-full py-3.5 border-2 border-dashed border-[#E2E8F0] rounded-2xl text-sm text-[#A0AAB4] hover:border-[#3366FF] hover:text-[#3366FF] transition-colors"
            >
              <Icon name="plus" size={16} className="inline mr-1" /> 차주 업무 추가
            </button>
          ) : null}
        </div>
      )}

      {/* ── 일일 로그 모달 ── */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedLog(null)}
        >
          {/* 오버레이 */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

          {/* 모달 패널 */}
          <div
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="sticky top-0 bg-white px-6 pt-5 pb-4 border-b border-[#EEF1F6] z-10">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {selectedLog.task?.project && (
                    <p className="text-xs font-medium text-[#A0AAB4] mb-1">{selectedLog.task.project.name}</p>
                  )}
                  <h3 className="font-bold text-[#191F28] text-base leading-snug">{selectedLog.task?.title ?? "-"}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    {selectedLog.task && <StatusBadge status={selectedLog.task.status} />}
                    <span className="text-xs text-[#A0AAB4]">{selectedLog.log_date}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F4F6FA] transition-colors mt-0.5"
                >
                  <Icon name="cancel" size={18} />
                </button>
              </div>
            </div>

            {/* 로그 내용 */}
            <div className="px-6 py-4 space-y-4">
              {[
                { label: "진행 내용", value: selectedLog.progress },
                { label: "이슈 · 블로커", value: selectedLog.issue },
                { label: "다음 액션", value: selectedLog.next_action },
                { label: "인사이트", value: selectedLog.insight },
              ].map(({ label, value }) =>
                value ? (
                  <div key={label}>
                    <p className="text-xs font-semibold text-[#A0AAB4] uppercase tracking-wide mb-1.5">{label}</p>
                    <p className="text-sm text-[#191F28] leading-relaxed whitespace-pre-wrap">{value}</p>
                  </div>
                ) : null
              )}

              {!selectedLog.progress && !selectedLog.issue && !selectedLog.next_action && !selectedLog.insight && (
                <p className="text-sm text-[#C0C8D4] text-center py-4">기록된 내용이 없습니다.</p>
              )}

              {/* 첨부파일 */}
              {selectedLog.task && (
                <div className="pt-2 border-t border-[#EEF1F6]">
                  <TaskAttachments taskId={selectedLog.task.id} readOnly />
                </div>
              )}
            </div>

            {/* 푸터 — Daily 편집 링크 */}
            <div className="px-6 pb-5 pt-2 border-t border-[#EEF1F6]">
              <Link
                href={`/daily?date=${selectedLog.log_date}`}
                onClick={() => setSelectedLog(null)}
                className="flex items-center justify-center gap-1.5 w-full py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#6B7685] hover:border-[#3366FF] hover:text-[#3366FF] transition-colors"
              >
                <Icon name="pencil" size={14} />
                Daily Log에서 편집
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
