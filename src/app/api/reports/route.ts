import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { type ReportResponse } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as "daily" | "weekly" | null;
  const date = searchParams.get("date");
  const week = searchParams.get("week");

  if (!type || (type === "daily" && !date) || (type === "weekly" && !week)) {
    return NextResponse.json(
      { error: "type과 date(daily) 또는 week(weekly) 파라미터가 필요합니다." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // 멤버 조회 (created_at 순 = 원래 멤버 먼저)
  const { data: members, error: membersError } = await supabase
    .from("members")
    .select("id, name")
    .order("created_at");

  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 });
  }

  // 날짜 범위 계산
  let dateFrom: string;
  let dateTo: string;

  if (type === "daily" && date) {
    dateFrom = date;
    dateTo = date;
  } else {
    // weekly: week 파라미터 (YYYY-Www 형식)
    const weekDate = parseWeek(week!);
    dateFrom = weekDate.from;
    dateTo = weekDate.to;
  }

  // 멤버별 태스크 + 로그 조회
  const { data: logs, error: logsError } = await supabase
    .from("daily_logs")
    .select(
      `
      id,
      member_id,
      log_date,
      progress,
      issue,
      next_action,
      insight,
      task:tasks (
        id,
        title,
        purpose,
        status,
        start_date,
        due_date,
        project:projects (
          id,
          name
        )
      )
    `
    )
    .gte("log_date", dateFrom)
    .lte("log_date", dateTo);

  if (logsError) {
    return NextResponse.json({ error: logsError.message }, { status: 500 });
  }

  // 차주 예정 업무 조회 (해당 주 또는 다음 주)
  const nextWeekOf = getNextWeekOf(dateFrom);
  const { data: nextWeekTasksRaw, error: nextWeekError } = await supabase
    .from("next_week_tasks")
    .select("id, member_id, title, start_date, due_date, week_of")
    .eq("week_of", nextWeekOf);

  if (nextWeekError) {
    return NextResponse.json({ error: nextWeekError.message }, { status: 500 });
  }

  // 멤버별 프로젝트별 태스크 그룹핑
  const reportMembers = members.map((member) => {
    const memberName = member.name;

    const memberLogs = (logs ?? []).filter((l) => l.member_id === member.id);

    // 프로젝트별 그룹핑
    const projectMap = new Map<
      string,
      { project_id: string; project_name: string; tasks: unknown[] }
    >();

    // 중복 task 제거 (같은 task가 여러 날짜 로그에 있을 수 있음)
    const seenTaskIds = new Set<string>();

    for (const log of memberLogs) {
      const task = (log.task as unknown) as {
        id: string;
        title: string;
        purpose: string | null;
        status: string;
        start_date: string | null;
        due_date: string | null;
        project: { id: string; name: string } | null;
      } | null;

      if (!task) continue;
      if (seenTaskIds.has(task.id)) continue;
      seenTaskIds.add(task.id);

      // 프로젝트 없는 업무는 "__none__" 키로 그룹핑
      const projectId = task.project?.id ?? "__none__";
      const projectName = task.project?.name ?? "";

      if (!projectMap.has(projectId)) {
        projectMap.set(projectId, {
          project_id: projectId,
          project_name: projectName,
          tasks: [],
        });
      }

      projectMap.get(projectId)!.tasks.push({
        id: task.id,
        title: task.title,
        purpose: task.purpose,
        status: task.status,
        start_date: task.start_date,
        due_date: task.due_date,
        log: {
          progress: log.progress,
          issue: log.issue,
          next_action: log.next_action,
          insight: log.insight,
        },
      });
    }

    return {
      id: member.id,
      name: memberName,
      projects: Array.from(projectMap.values()),
    };
  });

  // 차주 업무 그룹핑 (members 테이블 순서 기준)
  const nextWeekTasks = members.map((member) => {
    const tasks = (nextWeekTasksRaw ?? [])
      .filter((t) => t.member_id === member.id)
      .map((t) => ({
        title: t.title,
        start_date: t.start_date,
        due_date: t.due_date,
      }));

    return { member_name: member.name, tasks };
  });

  const response: ReportResponse = {
    type,
    ...(type === "daily" ? { date: dateFrom } : { week: week! }),
    members: reportMembers as ReportResponse["members"],
    next_week_tasks:
      nextWeekTasks as ReportResponse["next_week_tasks"],
  };

  return NextResponse.json(response);
}

function parseWeek(week: string): { from: string; to: string } {
  // YYYY-Www → 해당 주 월요일~일요일
  const [yearStr, weekStr] = week.split("-W");
  const year = parseInt(yearStr);
  const weekNum = parseInt(weekStr);

  const jan4 = new Date(year, 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));

  const from = new Date(startOfWeek1);
  from.setDate(startOfWeek1.getDate() + (weekNum - 1) * 7);

  const to = new Date(from);
  to.setDate(from.getDate() + 6);

  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

function getNextWeekOf(date: string): string {
  const d = new Date(date);
  // 현재 주의 월요일 기준으로 다음 주 월요일 계산
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  monday.setDate(monday.getDate() + 7);
  return monday.toISOString().split("T")[0];
}
