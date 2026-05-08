import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendSignupRequestEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, username, password, email } = body;

  if (!name || !username || !password || !email) {
    return NextResponse.json({ error: "모든 항목을 입력해주세요." }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  const { data: existingUsername } = await serviceClient
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existingUsername) {
    return NextResponse.json({ error: "이미 사용 중인 아이디입니다." }, { status: 409 });
  }

  const { data: existingEmail } = await serviceClient
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingEmail) {
    return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });
  }

  // 가입 즉시 로그인 차단 (관리자 승인 전까지)
  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    ban_duration: "876000h",
    user_metadata: { name, username },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  const { error: profileError } = await serviceClient.from("profiles").insert({
    id: authData.user.id,
    name,
    username,
    email,
    status: "pending",
  });

  if (profileError) {
    await serviceClient.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // 관리자 이메일로 가입 신청 알림 발송
  const adminEmail = process.env.ADMIN_EMAIL ?? process.env.NAVER_USER ?? "";

  if (adminEmail) {
    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
    const approveUrl = `${origin}/api/admin/approve?user_id=${authData.user.id}`;

    try {
      await sendSignupRequestEmail({
        adminEmail,
        applicantName: name,
        applicantUsername: username,
        applicantEmail: email,
        approveUrl,
      });
    } catch {
      // 이메일 발송 실패해도 가입 신청은 유효
    }
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
