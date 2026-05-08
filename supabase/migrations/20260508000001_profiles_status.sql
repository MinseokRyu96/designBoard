-- 가입 승인 상태 및 관리자 여부 컬럼 추가
alter table profiles
  add column if not exists status text not null default 'approved'
    check (status in ('pending', 'approved')),
  add column if not exists is_admin boolean not null default false;

-- 기존 가입된 사용자는 모두 approved 처리 (류민석 포함)
update profiles set status = 'approved' where status is null or status = 'approved';

-- 류민석 계정을 마스터(관리자)로 지정
update profiles set is_admin = true where name = '류민석';
