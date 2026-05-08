import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email } = body;

  if (!email) {
    return NextResponse.json({ error: "이메일을 입력해주세요." }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  // 가입된 이메일인지 확인
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (!profile) {
    // 보안상 존재 여부를 노출하지 않고 성공 응답
    return NextResponse.json({ success: true });
  }

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SUPABASE_URL;

  await serviceClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  return NextResponse.json({ success: true });
}
