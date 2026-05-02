import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("member_id");
  const date = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const supabase = await createClient();

  let query = supabase
    .from("daily_logs")
    .select(`
      id, member_id, log_date, progress, issue, next_action, insight, created_at,
      task:tasks (
        id, title, purpose, status, start_date, due_date,
        project:projects (id, name)
      )
    `)
    .order("log_date", { ascending: false });

  if (memberId) query = query.eq("member_id", memberId);

  if (date) {
    query = query.eq("log_date", date);
  } else if (from && to) {
    query = query.gte("log_date", from).lte("log_date", to);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { task_id, member_id, log_date, progress, issue, next_action, insight } = body;

  if (!task_id || !member_id || !log_date) {
    return NextResponse.json({ error: "task_id, member_id, log_date는 필수입니다." }, { status: 400 });
  }

  const supabase = await createClient();

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
