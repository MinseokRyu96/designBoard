"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { ReportResponse, ReportMember, ReportNextWeekTask } from "@/types";

function formatDate(date: string) {
  const d = new Date(date);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function PrintContent() {
  const searchParams = useSearchParams();
  const printRef = useRef<HTMLDivElement>(null);

  const [type, setType] = useState<"daily" | "weekly">(
    (searchParams.get("type") as "daily" | "weekly") ?? "daily"
  );
  const [date, setDate] = useState(
    searchParams.get("date") ?? new Date().toISOString().split("T")[0]
  );
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params =
        type === "daily"
          ? `type=daily&date=${date}`
          : `type=weekly&week=${getWeekParam(date)}`;
      const res = await fetch(`/api/reports?${params}`);
      if (!res.ok) throw new Error("보고서 조회 실패");
      const data = await res.json();
      setReport(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [type, date]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  function handlePrint() {
    window.print();
  }

  const hasContent =
    report &&
    report.members.some((m) => m.projects.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 컨트롤 패널 — 인쇄 시 숨김 */}
      <div className="no-print sticky top-16 z-40 bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">유형</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "daily" | "weekly")}
            className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="daily">일간</option>
            <option value="weekly">주간</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">날짜</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={fetchReport}
          className="px-4 py-1.5 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50"
        >
          조회
        </button>
        <button
          onClick={handlePrint}
          disabled={!hasContent || loading}
          className="ml-auto px-6 py-2 bg-gray-900 text-white rounded font-medium text-sm hover:bg-gray-700 disabled:opacity-40 transition-colors"
        >
          🖨️ 출력하기
        </button>
      </div>

      {/* 미리보기 영역 */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {loading && (
          <div className="text-center py-20 text-gray-400">보고서 생성 중...</div>
        )}
        {error && (
          <div className="text-center py-20 text-red-500">{error}</div>
        )}
        {!loading && !error && report && (
          <div
            ref={printRef}
            className="print-page bg-white shadow-sm border border-gray-100 rounded-xl p-10"
          >
            <ReportDocument report={report} type={type} date={date} />
          </div>
        )}
        {!loading && !error && !report && (
          <div className="text-center py-20 text-gray-400">
            날짜를 선택하고 조회를 클릭하세요.
          </div>
        )}
      </div>
    </div>
  );
}

function ReportDocument({
  report,
  type,
  date,
}: {
  report: ReportResponse;
  type: "daily" | "weekly";
  date: string;
}) {
  return (
    <div className="font-['serif'] text-gray-900">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-wide">디자인팀 업무 보고</h1>
        <p className="text-sm text-gray-500 mt-2">
          {type === "daily" ? formatDate(date) : `${date} 주간`}
        </p>
      </div>

      <hr className="print-divider border-gray-300 mb-8" />

      {/* 멤버별 섹션 */}
      {report.members.map((member, i) => (
        <MemberSection key={member.id} member={member} isLast={i === report.members.length - 1} />
      ))}

      {/* 차주 예정 업무 */}
      {report.next_week_tasks.some((m) => m.tasks.length > 0) && (
        <>
          <hr className="print-divider border-gray-300 my-8" />
          <NextWeekSection nextWeekTasks={report.next_week_tasks} />
        </>
      )}
    </div>
  );
}

function MemberSection({
  member,
  isLast,
}: {
  member: ReportMember;
  isLast: boolean;
}) {
  return (
    <div className="mb-6">
      <h2 className="print-member-title text-xl font-bold border-b-2 border-gray-900 pb-2 mb-4">
        [{member.name}]
      </h2>

      {member.projects.length === 0 ? (
        <p className="text-sm text-gray-400 italic">기록된 업무가 없습니다.</p>
      ) : (
        member.projects.map((project) => (
          <div key={project.project_id} className="mb-5">
            <h3 className="print-project-title font-semibold text-base mb-2">
              {project.project_name}
            </h3>
            {project.tasks.map((task) => (
              <div key={task.id} className="ml-2 mb-4 pb-4 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{task.title}</span>
                  <span className="text-xs border border-gray-400 px-1 print-status">
                    {task.status}
                  </span>
                </div>
                {task.purpose && (
                  <Field label="목적" value={task.purpose} />
                )}
                {task.start_date && (
                  <Field
                    label="기간"
                    value={`${task.start_date} ~ ${task.due_date ?? "-"}`}
                  />
                )}
                {task.log && (
                  <>
                    {task.log.progress && (
                      <Field label="진행 내용" value={task.log.progress} />
                    )}
                    {task.log.issue && (
                      <Field label="이슈" value={task.log.issue} />
                    )}
                    {task.log.next_action && (
                      <Field label="다음 작업" value={task.log.next_action} />
                    )}
                    {task.log.insight && (
                      <Field label="인사이트" value={task.log.insight} />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        ))
      )}

      {!isLast && <hr className="print-divider border-gray-200 mt-6 mb-6" />}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="print-field text-sm ml-1 mb-1">
      <span className="text-gray-500">{label}: </span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

function NextWeekSection({ nextWeekTasks }: { nextWeekTasks: ReportNextWeekTask[] }) {
  return (
    <div>
      <h2 className="print-section-title text-lg font-bold mb-4">[차주 예정 업무]</h2>
      {nextWeekTasks.map((member) =>
        member.tasks.length > 0 ? (
          <div key={member.member_name} className="mb-4">
            <h3 className="font-semibold text-base mb-2">[{member.member_name}]</h3>
            <ul className="ml-3 space-y-1">
              {member.tasks.map((task, i) => (
                <li key={i} className="text-sm">
                  - {task.title}
                  {(task.start_date || task.due_date) && (
                    <span className="text-gray-500 ml-2">
                      ({task.start_date ?? "-"} ~ {task.due_date ?? "-"})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null
      )}
    </div>
  );
}

function getWeekParam(date: string): string {
  const d = new Date(date);
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const weekNum = Math.ceil(
    ((d.getTime() - startOfWeek1.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export default function PrintPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">로딩 중...</div>}>
      <PrintContent />
    </Suspense>
  );
}
