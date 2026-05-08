-- 회원 프로필 테이블 (Supabase Auth와 1:1 연결)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  username text not null unique,
  email text not null,
  created_at timestamptz not null default now()
);

-- 서비스 Role이 아닌 일반 사용자는 자기 프로필만 조회
alter table profiles enable row level security;

create policy "users can read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- service_role은 RLS 우회하므로 별도 정책 불필요
