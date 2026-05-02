import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("member_id");
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "date 파라미터가 필요합니다." }, { status: 400 });
  }

  const supabase = await createClient();

  let query = supabase
    .from("daily_logs")
    .select(
      `
      id, member_id, log_date, progress, issue, next_action, insight, created_at,
      task:tasks (
        id, title, purpose, status, start_date, due_date,
        project:projects (id, name)
      )
    `
    )
    .eq("log_date", date);

  if (memberId) query = query.eq("member_id", memberId);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { task_id, member_id, log_date, progress, issue, next_action, insight } = body;

  if (!task_id || !member_id || !log_date) {
    return NextResponse.json(
      { error: "task_id, member_id, log_date는 필수입니다." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // upsert: 같은 task_id + log_date 조합은 덮어씀
  const { data, error } = await supabase
    .from("daily_logs")
    .upsert(
      { task_id, member_id, log_date, progress, issue, next_action, insight },
      { onConflict: "task_id,log_date" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
