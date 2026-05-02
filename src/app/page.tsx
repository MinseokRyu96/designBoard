"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MEMBER_ORDER, type MemberName } from "@/types";

const MEMBER_COLORS: Record<MemberName, string> = {
  류민석: "bg-blue-400",
  계은영: "bg-rose-400",
  한다영: "bg-amber-400",
};

const MEMBER_IDS: Record<MemberName, string> = {
  류민석: "11111111-1111-1111-1111-111111111111",
  계은영: "22222222-2222-2222-2222-222222222222",
  한다영: "33333333-3333-3333-3333-333333333333",
};

interface LogDay {
  log_date: string;
  member_id: string;
}

function getMemberName(id: string): MemberName | null {
  return (Object.entries(MEMBER_IDS).find(([, v]) => v === id)?.[0] as MemberName) ?? null;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  // 0=일, 1=월 ... → 월요일 시작 기준
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7;
}

export default function DashboardPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [logDays, setLogDays] = useState<LogDay[]>([]);

  useEffect(() => {
    const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = getDaysInMonth(year, month);
    const to = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    fetch(`/api/daily-logs?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // 날짜+member_id 중복 제거
          const seen = new Set<string>();
          const unique: LogDay[] = [];
          for (const d of data) {
            const key = `${d.log_date}-${d.member_id}`;
            if (!seen.has(key)) { seen.add(key); unique.push({ log_date: d.log_date, member_id: d.member_id }); }
          }
          setLogDays(unique);
        }
      });
  }, [year, month]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfWeek(year, month);
  const todayStr = today.toISOString().split("T")[0];

  const logMap = new Map<string, MemberName[]>();
  for (const l of logDays) {
    const name = getMemberName(l.member_id);
    if (!name) continue;
    if (!logMap.has(l.log_date)) logMap.set(l.log_date, []);
    logMap.get(l.log_date)!.push(name);
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const monthLabel = `${year}년 ${month + 1}월`;
  const weekdays = ["월", "화", "수", "목", "금", "토", "일"];

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">DesignBoard</h1>
          <p className="text-sm text-gray-400 mt-0.5">류민석 · 계은영 · 한다영</p>
        </div>
        <Link
          href="/report/print"
          className="px-4 py-2 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          출력하기
        </Link>
      </div>

      {/* 멤버 범례 */}
      <div className="flex gap-4 mb-6">
        {MEMBER_ORDER.map((name) => (
          <div key={name} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${MEMBER_COLORS[name]}`} />
            <span className="text-xs text-gray-600">{name}</span>
          </div>
        ))}
      </div>

      {/* 캘린더 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* 월 네비게이션 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <button onClick={prevMonth} className="text-gray-400 hover:text-gray-700 text-lg px-2">‹</button>
          <span className="font-semibold text-gray-800">{monthLabel}</span>
          <button onClick={nextMonth} className="text-gray-400 hover:text-gray-700 text-lg px-2">›</button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {weekdays.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 셀 */}
        <div className="grid grid-cols-7">
          {/* 빈 칸 (월 시작 전) */}
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`empty-${i}`} className="border-b border-r border-gray-50 h-20" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const members = logMap.get(dateStr) ?? [];
            const isToday = dateStr === todayStr;
            const col = (firstDow + i) % 7;
            const isSat = col === 5;
            const isSun = col === 6;

            return (
              <Link
                key={day}
                href={`/daily?date=${dateStr}`}
                className={`border-b border-r border-gray-50 h-20 p-2 flex flex-col hover:bg-blue-50 transition-colors ${
                  isSat ? "text-blue-400" : isSun ? "text-red-400" : "text-gray-700"
                }`}
              >
                <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday ? "bg-gray-900 text-white" : ""
                }`}>
                  {day}
                </span>
                {members.length > 0 && (
                  <div className="flex gap-0.5 mt-1 flex-wrap">
                    {MEMBER_ORDER.filter(n => members.includes(n)).map((name) => (
                      <span key={name} className={`w-2 h-2 rounded-full ${MEMBER_COLORS[name]}`} />
                    ))}
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
