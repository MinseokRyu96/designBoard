import { createClient } from "@supabase/supabase-js";

// Storage 업로드/삭제 등 서버 전용 작업에 사용
// RLS를 우회하므로 서버 사이드(API Route)에서만 사용할 것
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
