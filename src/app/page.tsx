"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MEMBER_ORDER, type MemberName } from "@/types";

const MEMBER_COLORS: Record<MemberName, { dot: string; chip: string; text: string }> = {
  류민석: { dot: "bg-blue-400", chip: "bg-blue-100", text: "text-blue-700" },
  계은영: { dot: "bg-rose-400", chip: "bg-rose-100", text: "text-rose-700" },
  한다영: { dot: "bg-amber-400", chip: "bg-amber-100", text: "text-amber-700" },
};

const MEMBER_IDS: Record<MemberName, string> = {
  류민석: "11111111-1111-1111-1111-111111111111",
  계은영: "22222222-2222-2222-2222-222222222222",
  한다영: "33333333-3333-3333-3333-333333333333",
};

interface LogEntry {
  log_date: string;
  member_id: string;
  task: { id: string; title: string } | null;
}

interface TaskStreak {
  taskId: string;
  title: string;
  memberName: MemberName;
  dates: string[]; // sorted ascending
}

function getMemberName(id: string): MemberName | null {
  return (Object.entries(MEMBER_IDS).find(([, v]) => v === id)?.[0] as MemberName) ?? null;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDow(year: number, month: number) {
  // 월요일=0 기준
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

// 연속 날짜 중 주(week) 행을 넘지 않는 범위에서 chip 위치 결정
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

    fetch(`/api/daily-logs?from=${from}&to=${to}`)
      .then(r => r.json())
      .then((data: LogEntry[]) => {
        if (!Array.isArray(data)) return;

        // 멤버 점 (기존)
        const dotMap = new Map<string, MemberName[]>();
        // 태스크별 streak 계산
        const taskMap = new Map<string, { title: string; memberName: MemberName; dates: Set<string> }>();

        for (const entry of data) {
          const memberName = getMemberName(entry.member_id);
          if (!memberName) continue;

          // 멤버 점
          if (!dotMap.has(entry.log_date)) dotMap.set(entry.log_date, []);
          if (!dotMap.get(entry.log_date)!.includes(memberName)) {
            dotMap.get(entry.log_date)!.push(memberName);
          }

          // 태스크 streak
          if (!entry.task) continue;
          const key = entry.task.id;
          if (!taskMap.has(key)) {
            taskMap.set(key, { title: entry.task.title, memberName, dates: new Set() });
          }
          taskMap.get(key)!.dates.add(entry.log_date);
        }

        setMemberDots(dotMap);

        // streak: 날짜 2개 이상인 태스크만 (연속 체크는 렌더링 시)
        const streakList: TaskStreak[] = [];
        for (const [taskId, info] of taskMap.entries()) {
          const sortedDates = [...info.dates].sort();
          streakList.push({ taskId, title: info.title, memberName: info.memberName, dates: sortedDates });
        }
        setStreaks(streakList);
      });
  }, [year, month]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDow(year, month);
  const todayStr = toDateStr(today);

  // 날짜→해당 날에 보여줄 streak 목록
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">DesignBoard</h1>
          <p className="text-sm text-gray-400 mt-0.5">류민석 · 계은영 · 한다영</p>
        </div>
        <Link href="/report/print"
          className="px-4 py-2 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-700 transition-colors">
          출력하기
        </Link>
      </div>

      {/* 멤버 범례 */}
      <div className="flex gap-4 mb-5">
        {MEMBER_ORDER.map((name) => (
          <div key={name} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${MEMBER_COLORS[name].dot}`} />
            <span className="text-xs text-gray-600">{name}</span>
          </div>
        ))}
      </div>

      {/* 캘린더 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* 월 네비게이션 */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors text-lg">‹</button>
          <span className="font-semibold text-gray-800">{year}년 {month + 1}월</span>
          <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors text-lg">›</button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {weekdays.map((d, i) => (
            <div key={d} className={`text-center text-xs font-medium py-2 ${i === 5 ? "text-blue-400" : i === 6 ? "text-red-400" : "text-gray-400"}`}>
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 셀 */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`e-${i}`} className="border-b border-r border-gray-50 min-h-[80px]" />
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
              <Link key={day} href={`/daily?date=${dateStr}`}
                className={`border-b border-r border-gray-50 min-h-[80px] p-1.5 flex flex-col hover:bg-blue-50 transition-colors ${isSat ? "text-blue-500" : isSun ? "text-red-500" : "text-gray-700"}`}>
                {/* 날짜 숫자 */}
                <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full self-center ${isToday ? "bg-gray-900 text-white" : ""}`}>
                  {day}
                </span>

                {/* 멤버 점 (로그 있는 날) */}
                {dots.length > 0 && dayStreaks.length === 0 && (
                  <div className="flex gap-0.5 justify-center mt-1">
                    {MEMBER_ORDER.filter(n => dots.includes(n)).map(name => (
                      <span key={name} className={`w-1.5 h-1.5 rounded-full ${MEMBER_COLORS[name].dot}`} />
                    ))}
                  </div>
                )}

                {/* 연결 chip */}
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
                            <span className={`text-[10px] font-medium truncate px-1.5 ${colors.text}`}>
                              {streak.title}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {dayStreaks.length > 3 && (
                      <span className="text-[10px] text-gray-400 px-1">+{dayStreaks.length - 3}</span>
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
        {[
          { href: "/daily", label: "Daily Log", desc: "오늘 업무 기록" },
          { href: "/weekly", label: "Weekly", desc: "주간 현황 & 차주 계획" },
          { href: "/report/print", label: "보고서 출력", desc: "대표 보고서 자동 생성" },
        ].map((f) => (
          <Link key={f.href} href={f.href}
            className="p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all">
            <p className="font-medium text-gray-800 text-sm">{f.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
