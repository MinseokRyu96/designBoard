import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

function createAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function checkIsAdmin(userId: string): Promise<boolean> {
  const serviceClient = createServiceClient();
  const { data } = await serviceClient
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  return !!data?.is_admin;
}

// 이메일 수락 버튼 클릭 — 토큰으로 인증 (로그인 불필요)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const userId = searchParams.get("user_id"); // 관리자 페이지에서 직접 호출 시 fallback

  if (token) {
    const serviceClient = createServiceClient();
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("id, status")
      .eq("approval_token", token)
      .maybeSingle();

    if (!profile) {
      return new NextResponse(renderResult("유효하지 않거나 이미 사용된 링크입니다.", false), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (profile.status === "approved") {
      return new NextResponse(renderResult("이미 승인된 계정입니다.", false), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    await approveUser(profile.id);

    return new NextResponse(renderResult("가입이 승인되었습니다.", true), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // 관리자 페이지 버튼용 (로그인 필요)
  if (userId) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(new URL("/login", request.url));
    if (!(await checkIsAdmin(user.id))) return NextResponse.redirect(new URL("/", request.url));

    await approveUser(userId);
    return NextResponse.redirect(new URL("/admin?approved=1", request.url));
  }

  return NextResponse.redirect(new URL("/admin", request.url));
}

export async function POST(request: NextRequest) {
  const { user_id } = await request.json();
  if (!user_id) return NextResponse.json({ error: "user_id 필요" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  if (!(await checkIsAdmin(user.id))) {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  await approveUser(user_id);
  return NextResponse.json({ success: true });
}

async function approveUser(userId: string) {
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
  await admin
    .from("profiles")
    .update({ status: "approved", approval_token: null })
    .eq("id", userId);
}

function renderResult(message: string, success: boolean) {
  const color = success ? "#3366FF" : "#FF4E6A";
  const bg = success ? "#EEF3FF" : "#FFF5F7";
  return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><title>DesignBoard</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#F7F9FC;}
.box{text-align:center;padding:48px 40px;background:#fff;border-radius:16px;border:1px solid #E2E8F0;max-width:400px;}
.icon{width:56px;height:56px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;margin:0 auto 20px;}
h2{color:#191F28;font-size:18px;margin:0 0 8px;}
p{color:#6B7685;font-size:14px;margin:0 0 24px;}
a{display:inline-block;padding:10px 24px;background:${color};color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;}</style>
</head>
<body>
<div class="box">
  <div class="icon">
    ${success
      ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
      : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="${color}" stroke-width="2" stroke-linecap="round"/></svg>`
    }
  </div>
  <h2>${message}</h2>
  <p>${success ? "이제 해당 멤버가 DesignBoard에 로그인할 수 있습니다." : "관리자 페이지에서 직접 확인해주세요."}</p>
  <a href="/admin">관리자 페이지로 이동</a>
</div>
</body>
</html>`;
}
