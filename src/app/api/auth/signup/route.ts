import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, username, password, email } = body;

  if (!name || !username || !password || !email) {
    return NextResponse.json({ error: "모든 항목을 입력해주세요." }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  // 아이디 중복 확인
  const { data: existing } = await serviceClient
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "이미 사용 중인 아이디입니다." }, { status: 409 });
  }

  // 이메일 중복 확인
  const { data: existingEmail } = await serviceClient
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingEmail) {
    return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });
  }

  // Supabase Auth 사용자 생성 (이메일 인증 없이 바로 활성화)
  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, username },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  // 프로필 저장
  const { error: profileError } = await serviceClient.from("profiles").insert({
    id: authData.user.id,
    name,
    username,
    email,
  });

  if (profileError) {
    // 프로필 저장 실패 시 auth 사용자도 롤백
    await serviceClient.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
