import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("task_id");

  if (!taskId) {
    return NextResponse.json({ error: "task_id가 필요합니다." }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient
    .from("task_attachments")
    .select("id, task_id, type, url, name, created_at")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  // 이미지 업로드 (multipart/form-data) — service role로 Storage 접근
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const taskId = formData.get("task_id") as string | null;
    const name = formData.get("name") as string | null;

    if (!file || !taskId) {
      return NextResponse.json({ error: "file과 task_id가 필요합니다." }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const ext = file.name.split(".").pop();
    const filePath = `${taskId}/${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await serviceClient.storage
      .from("attachments")
      .upload(filePath, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicData } = serviceClient.storage
      .from("attachments")
      .getPublicUrl(filePath);

    const { data, error } = await serviceClient
      .from("task_attachments")
      .insert({ task_id: taskId, type: "image", url: publicData.publicUrl, name: name ?? file.name })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }

  // 링크 추가 (application/json)
  const body = await request.json();
  const { task_id, url, name } = body;

  if (!task_id || !url) {
    return NextResponse.json({ error: "task_id와 url이 필요합니다." }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient
    .from("task_attachments")
    .insert({ task_id, type: "link", url, name: name ?? url })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  const { data: attachment } = await serviceClient
    .from("task_attachments")
    .select("type, url")
    .eq("id", id)
    .single();

  // 이미지면 Storage에서도 삭제
  if (attachment?.type === "image") {
    const url = new URL(attachment.url);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/attachments\/(.+)/);
    if (pathMatch) {
      await serviceClient.storage.from("attachments").remove([pathMatch[1]]);
    }
  }

  const { error } = await serviceClient.from("task_attachments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
