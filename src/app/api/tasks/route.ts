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
    .from("tasks")
    .select(`id, member_id, project_id, title, purpose, status, start_date, due_date, created_at, project:projects (id, name)`)
    .order("created_at", { ascending: false });

  if (memberId) query = query.eq("member_id", memberId);
  if (date) {
    query = query.lte("start_date", date).or(`due_date.gte.${date},due_date.is.null`);
  } else if (from && to) {
    // 해당 기간에 겹치는 task: start_date <= to AND (due_date >= from OR due_date IS NULL)
    query = query.lte("start_date", to).or(`due_date.gte.${from},due_date.is.null`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { member_id, project_name, title, purpose, status, start_date, due_date } = body;

  if (!member_id || !title) {
    return NextResponse.json({ error: "member_id, title은 필수입니다." }, { status: 400 });
  }

  const supabase = await createClient();

  let projectId: string | null = null;

  if (project_name) {
    const { data: existing } = await supabase
      .from("projects")
      .select("id")
      .eq("name", project_name)
      .single();

    if (existing) {
      projectId = existing.id;
    } else {
      const { data: newProject, error: projectError } = await supabase
        .from("projects")
        .insert({ name: project_name })
        .select("id")
        .single();
      if (projectError) return NextResponse.json({ error: projectError.message }, { status: 500 });
      projectId = newProject.id;
    }
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({ member_id, project_id: projectId, title, purpose, status: status ?? "진행중", start_date, due_date })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id는 필수입니다." }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase.from("tasks").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id는 필수입니다." }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
