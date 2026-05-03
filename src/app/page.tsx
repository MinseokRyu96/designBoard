"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MEMBER_ORDER, type MemberName } from "@/types";

const MEMBER_COLORS: Record<MemberName, { dot: string; chip: string; text: string }> = {
  류민석: { dot: "bg-[#3366FF]", chip: "bg-[#EEF3FF]", text: "text-[#3366FF]" },
  계은영: { dot: "bg-[#FF4E6A]", chip: "bg-[#FFF0F2]", text: "text-[#FF4E6A]" },
  한다영: { dot: "bg-[#F5A623]", chip: "bg-[#FFF8EC]", text: "text-[#C87D00]" },
};

const MEMBER_IDS: Record<MemberName, string> = {
  류민석: "11111111-1111-1111-1111-111111111111",
  계은영: "22222222-2222-2222-2222-222222222222",
  한다영: "33333333-3333-3333-3333-333333333333",
};

interface LogEntry {
  log_date: string;
  member_id: string;
}

interface TaskEntry {
  id: string;
  member_id: string;
  title: string;
  start_date: string | null;
  due_date: string | null;
}

interface TaskStreak {
  taskId: string;
  title: string;
  memberName: MemberName;
  dates: string[]; // start_date ~ due_date 전체 구간
}

function getMemberName(id: string): MemberName | null {
  return (Object.entries(MEMBER_IDS).find(([, v]) => v === id)?.[0] as MemberName) ?? null;
}

function dateRange(start: string, end: string, clampFrom: string, clampTo: string): string[] {
  const from = start < clampFrom ? clampFrom : start;
  const to = end > clampTo ? clampTo : end;
  const dates: string[] = [];
  const d = new Date(from + "T00:00:00");
  while (toDateStr(d) <= to) {
    dates.push(toDateStr(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDow(year: number, month: number) {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

function getChipPos(dates: string[], date: string, col: number): "solo" | "start" | "middle" | "end" {
  const idx = dates.indexOf(date);
  const prevConsec = idx > 0 && dates[idx - 1] === addDays(date, -1) && col > 0;
  const nextConsec = idx < dates.length - 1 && dates[idx + 1] === addDays(date, 1) && col < 6;
  if (prevConsec && nextConsec) return "middle";
  if (prevConsec) return "end";
  if (nextConsec) return "start";
  return "solo";
}

const chipClass: Record<string, string> = {
  solo: "mx-1 rounded-full",
  start: "ml-1 mr-0 rounded-l-full rounded-r-none",
  middle: "mx-0 rounded-none",
  end: "ml-0 mr-1 rounded-l-none rounded-r-full",
};

const SHORTCUTS = [
  { href: "/daily", label: "Daily Log", desc: "오늘 업무 기록" },
  { href: "/weekly", label: "Weekly", desc: "주간 현황 & 차주 계획" },
  { href: "/report/print", label: "보고서 출력", desc: "대표 보고서 자동 생성" },
];

export default function DashboardPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [streaks, setStreaks] = useState<TaskStreak[]>([]);
  const [memberDots, setMemberDots] = useState<Map<string, MemberName[]>>(new Map());

  useEffect(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const to = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

    // member dots: daily_logs 기반
    const logsPromise = fetch(`/api/daily-logs?from=${from}&to=${to}`)
      .then(r => r.json())
      .then((data: LogEntry[]) => {
        if (!Array.isArray(data)) return;
        const dotMap = new Map<string, MemberName[]>();
        for (const entry of data) {
          const memberName = getMemberName(entry.member_id);
          if (!memberName) continue;
          if (!dotMap.has(entry.log_date)) dotMap.set(entry.log_date, []);
          if (!dotMap.get(entry.log_date)!.includes(memberName)) {
            dotMap.get(entry.log_date)!.push(memberName);
          }
        }
        setMemberDots(dotMap);
      });

    // chips: tasks의 start_date ~ due_date 전체 구간 기반
    const tasksPromise = fetch(`/api/tasks?from=${from}&to=${to}`)
      .then(r => r.json())
      .then((data: TaskEntry[]) => {
        if (!Array.isArray(data)) return;
        const streakList: TaskStreak[] = [];
        for (const task of data) {
          const memberName = getMemberName(task.member_id);
          if (!memberName || !task.start_date) continue;
          const end = task.due_date ?? task.start_date;
          const dates = dateRange(task.start_date, end, from, to);
          if (dates.length > 0) {
            streakList.push({ taskId: task.id, title: task.title, memberName, dates });
          }
        }
        setStreaks(streakList);
      });

    Promise.all([logsPromise, tasksPromise]);
  }, [year, month]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDow(year, month);
  const todayStr = toDateStr(today);

  const dateStreakMap = new Map<string, { streak: TaskStreak; col: number }[]>();
  for (let i = 0; i < daysInMonth; i++) {
    const day = i + 1;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const col = (firstDow + i) % 7;
    const matches = streaks.filter(s => s.dates.includes(dateStr));
    if (matches.length > 0) dateStreakMap.set(dateStr, matches.map(s => ({ streak: s, col })));
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const weekdays = ["월", "화", "수", "목", "금", "토", "일"];

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-bold text-[#191F28] tracking-tight">이번 달 현황</h1>
          <p className="text-sm text-[#A0AAB4] mt-1">{year}년 {month + 1}월 팀 활동 캘린더</p>
        </div>
        <Link
          href="/report/print"
          className="px-4 py-2 bg-[#191F28] text-white rounded-xl text-sm font-medium hover:bg-[#2D3748] transition-colors"
        >
          보고서 출력
        </Link>
      </div>

      {/* 멤버 범례 */}
      <div className="flex gap-5 mb-6">
        {MEMBER_ORDER.map((name) => (
          <div key={name} className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${MEMBER_COLORS[name].dot}`} />
            <span className="text-xs font-medium text-[#6B7685]">{name}</span>
          </div>
        ))}
      </div>

      {/* 캘린더 */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        {/* 월 네비게이션 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEF1F6]">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#A0AAB4] hover:bg-[#F4F6FA] hover:text-[#191F28] transition-colors text-base"
          >
            ‹
          </button>
          <span className="font-semibold text-[#191F28] text-sm">{year}년 {month + 1}월</span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#A0AAB4] hover:bg-[#F4F6FA] hover:text-[#191F28] transition-colors text-base"
          >
            ›
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 bg-[#F9FAFB]">
          {weekdays.map((d, i) => (
            <div
              key={d}
              className={`text-center text-[11px] font-semibold py-2.5 tracking-wide ${
                i === 5 ? "text-[#3366FF]" : i === 6 ? "text-[#FF4E6A]" : "text-[#A0AAB4]"
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 셀 */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`e-${i}`} className="border-b border-r border-[#EEF1F6] min-h-[76px]" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const col = (firstDow + i) % 7;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dots = memberDots.get(dateStr) ?? [];
            const dayStreaks = dateStreakMap.get(dateStr) ?? [];
            const isToday = dateStr === todayStr;
            const isSat = col === 5;
            const isSun = col === 6;

            return (
              <Link
                key={day}
                href={`/daily?date=${dateStr}`}
                className={`border-b border-r border-[#EEF1F6] min-h-[76px] p-1.5 flex flex-col hover:bg-[#F8FAFF] transition-colors ${
                  isSat ? "text-[#3366FF]" : isSun ? "text-[#FF4E6A]" : "text-[#6B7685]"
                }`}
              >
                <span
                  className={`text-[11px] font-semibold w-6 h-6 flex items-center justify-center rounded-full self-center transition-colors ${
                    isToday
                      ? "bg-[#3366FF] text-white"
                      : "hover:bg-[#EEF3FF]"
                  }`}
                >
                  {day}
                </span>

                {dots.length > 0 && dayStreaks.length === 0 && (
                  <div className="flex gap-0.5 justify-center mt-1.5">
                    {MEMBER_ORDER.filter(n => dots.includes(n)).map(name => (
                      <span key={name} className={`w-1.5 h-1.5 rounded-full ${MEMBER_COLORS[name].dot}`} />
                    ))}
                  </div>
                )}

                {dayStreaks.length > 0 && (
                  <div className="mt-1 space-y-0.5 overflow-hidden">
                    {dayStreaks.slice(0, 3).map(({ streak, col: c }) => {
                      const pos = getChipPos(streak.dates, dateStr, c);
                      const colors = MEMBER_COLORS[streak.memberName];
                      return (
                        <div
                          key={streak.taskId}
                          className={`h-4 flex items-center ${colors.chip} ${chipClass[pos]}`}
                          title={streak.title}
                        >
                          {(pos === "solo" || pos === "start") && (
                            <span className={`text-[9px] font-semibold truncate px-1.5 ${colors.text}`}>
                              {streak.title}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {dayStreaks.length > 3 && (
                      <span className="text-[9px] text-[#A0AAB4] px-1.5">+{dayStreaks.length - 3}</span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* 바로가기 */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        {SHORTCUTS.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="p-4 bg-white border border-[#E2E8F0] rounded-2xl hover:border-[#3366FF] hover:shadow-sm transition-all group"
          >
            <p className="font-semibold text-[#191F28] text-sm group-hover:text-[#3366FF] transition-colors">{f.label}</p>
            <p className="text-xs text-[#A0AAB4] mt-1">{f.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
