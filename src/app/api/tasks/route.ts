import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("member_id");
  const date = searchParams.get("date");

  const supabase = await createClient();

  let query = supabase
    .from("tasks")
    .select(
      `
      id, member_id, project_id, title, purpose, status, start_date, due_date, created_at,
      project:projects (id, name)
    `
    )
    .order("created_at", { ascending: false });

  if (memberId) query = query.eq("member_id", memberId);
  if (date) {
    query = query.lte("start_date", date).gte("due_date", date);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { member_id, project_name, title, purpose, status, start_date, due_date } = body;

  if (!member_id || !project_name || !title) {
    return NextResponse.json(
      { error: "member_id, project_name, title은 필수입니다." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // 프로젝트 upsert
  let projectId: string;
  const { data: existingProject } = await supabase
    .from("projects")
    .select("id")
    .eq("name", project_name)
    .single();

  if (existingProject) {
    projectId = existingProject.id;
  } else {
    const { data: newProject, error: projectError } = await supabase
      .from("projects")
      .insert({ name: project_name })
      .select("id")
      .single();

    if (projectError) {
      return NextResponse.json({ error: projectError.message }, { status: 500 });
    }
    projectId = newProject.id;
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

  if (!id) {
    return NextResponse.json({ error: "id는 필수입니다." }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
