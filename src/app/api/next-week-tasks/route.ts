import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get("week");

  const supabase = await createClient();

  let query = supabase
    .from("next_week_tasks")
    .select(
      `
      id, member_id, title, start_date, due_date, week_of, created_at,
      member:members (id, name)
    `
    )
    .order("created_at", { ascending: true });

  if (week) query = query.eq("week_of", week);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { member_id, title, start_date, due_date, week_of } = body;

  if (!member_id || !title || !week_of) {
    return NextResponse.json(
      { error: "member_id, title, week_of는 필수입니다." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("next_week_tasks")
    .insert({ member_id, title, start_date, due_date, week_of })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id는 필수입니다." }, { status: 400 });
  }

  const supabase = await createClient();

  const { error } = await supabase.from("next_week_tasks").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
