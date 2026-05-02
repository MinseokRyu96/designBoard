"use client";

import { useState, useEffect, useCallback } from "react";
import MemberTabs from "@/components/ui/MemberTabs";
import { MEMBER_ORDER, type MemberName } from "@/types";
import Link from "next/link";

const MEMBER_IDS: Record<MemberName, string> = {
  류민석: "11111111-1111-1111-1111-111111111111",
  계은영: "22222222-2222-2222-2222-222222222222",
  한다영: "33333333-3333-3333-3333-333333333333",
};

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

function getNextMonday(d: Date): string {
  const next = new Date(d);
  next.setDate(d.getDate() + 7);
  return toDateStr(getMonday(next));
}

function formatWeekLabel(monday: string): string {
  const d = new Date(monday);
  const sunday = new Date(d);
  sunday.setDate(d.getDate() + 6);
  return `${d.getMonth() + 1}/${d.getDate()} ~ ${sunday.getMonth() + 1}/${sunday.getDate()}`;
}

export default function WeeklyPage() {
  const [selectedMember, setSelectedMember] = useState<MemberName>(MEMBER_ORDER[0]);
  const [weekOf, setWeekOf] = useState<string>(() =>
    getNextMonday(getMonday(new Date()))
  );
  const [tasks, setTasks] = useState<NextTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", start_date: "", due_date: "" });
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/next-week-tasks?week=${weekOf}`
      );
      const all = await res.json();
      setTasks(
        (all as (NextTask & { member_id: string })[]).filter(
          (t) => t.member_id === MEMBER_IDS[selectedMember]
        )
      );
    } finally {
      setLoading(false);
    }
  }, [selectedMember, weekOf]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  async function addTask() {
    if (!newTask.title) return;
    await fetch("/api/next-week-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        member_id: MEMBER_IDS[selectedMember],
        title: newTask.title,
        start_date: newTask.start_date || null,
        due_date: newTask.due_date || null,
        week_of: weekOf,
      }),
    });
    setNewTask({ title: "", start_date: "", due_date: "" });
    setShowForm(false);
    fetchTasks();
  }

  async function deleteTask(id: string) {
    setDeleting(id);
    await fetch(`/api/next-week-tasks?id=${id}`, { method: "DELETE" });
    setDeleting(null);
    fetchTasks();
  }

  const prevWeek = toDateStr(
    new Date(new Date(weekOf).setDate(new Date(weekOf).getDate() - 7))
  );
  const nextWeek = toDateStr(
    new Date(new Date(weekOf).setDate(new Date(weekOf).getDate() + 7))
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Weekly Report</h1>
        <Link
          href={`/report/print?type=weekly&date=${weekOf}`}
          className="px-4 py-2 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          출력하기
        </Link>
      </div>

      {/* 주간 선택 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setWeekOf(prevWeek)}
          className="px-3 py-1.5 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50"
        >
          ← 이전 주
        </button>
        <span className="font-semibold text-gray-800">
          차주 예정 업무 ({formatWeekLabel(weekOf)})
        </span>
        <button
          onClick={() => setWeekOf(nextWeek)}
          className="px-3 py-1.5 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50"
        >
          다음 주 →
        </button>
      </div>

      <div className="mb-6">
        <MemberTabs selected={selectedMember} onChange={setSelectedMember} />
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">불러오는 중...</div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-4"
            >
              <div>
                <p className="font-medium text-gray-900">{task.title}</p>
                {(task.start_date || task.due_date) && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {task.start_date ?? "-"} ~ {task.due_date ?? "-"}
                  </p>
                )}
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                disabled={deleting === task.id}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                {deleting === task.id ? "삭제 중..." : "삭제"}
              </button>
            </div>
          ))}

          {tasks.length === 0 && !showForm && (
            <div className="text-center py-12 text-gray-400">
              {formatWeekLabel(weekOf)} 주에 등록된 예정 업무가 없습니다.
            </div>
          )}
        </div>
      )}

      {showForm ? (
        <div className="mt-5 bg-white border border-blue-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">차주 업무 추가</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">업무명 *</label>
              <input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="업무명"
              />
            </div>
            <div className="flex gap-3">
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
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={addTask}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
            >
              추가
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="mt-5 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
        >
          + 차주 업무 추가
        </button>
      )}
    </div>
  );
}
