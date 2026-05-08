import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// members + 현재 로그인 사용자 정보를 한 번에 반환
// daily/weekly 페이지의 초기 로딩 워터폴 제거용
export async function GET() {
  const supabase = await createClient();

  const [{ data: { user } }, { data: members }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("members").select("id, name").order("created_at"),
  ]);

  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, is_admin")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    name: profile?.name ?? "",
    is_admin: profile?.is_admin ?? false,
    members: members ?? [],
  });
}
