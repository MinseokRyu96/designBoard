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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  if (!userId) return NextResponse.redirect(new URL("/admin", request.url));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  if (!(await checkIsAdmin(user.id))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  await approveUser(userId);
  return NextResponse.redirect(new URL("/admin?approved=1", request.url));
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
  await admin.from("profiles").update({ status: "approved" }).eq("id", userId);
}
