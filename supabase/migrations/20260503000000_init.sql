-- 멤버 테이블
CREATE TABLE members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 초기 멤버 데이터 (출력 순서: 류민석 → 계은영 → 한다영)
INSERT INTO members (id, name) VALUES
  ('11111111-1111-1111-1111-111111111111', '류민석'),
  ('22222222-2222-2222-2222-222222222222', '계은영'),
  ('33333333-3333-3333-3333-333333333333', '한다영');

-- 프로젝트 테이블
CREATE TABLE projects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 업무 테이블
CREATE TABLE tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id    UUID NOT NULL REFERENCES members(id),
  project_id   UUID NOT NULL REFERENCES projects(id),
  title        TEXT NOT NULL,
  purpose      TEXT,
  status       TEXT NOT NULL DEFAULT '진행중' CHECK (status IN ('진행중', '완료', '보류')),
  start_date   DATE,
  due_date     DATE,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 일일 로그 테이블
CREATE TABLE daily_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  member_id   UUID NOT NULL REFERENCES members(id),
  log_date    DATE NOT NULL,
  progress    TEXT,
  issue       TEXT,
  next_action TEXT,
  insight     TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (task_id, log_date)
);

-- 차주 예정 업무 테이블
CREATE TABLE next_week_tasks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id  UUID NOT NULL REFERENCES members(id),
  title      TEXT NOT NULL,
  start_date DATE,
  due_date   DATE,
  week_of    DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_tasks_member_id ON tasks(member_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_daily_logs_member_id_date ON daily_logs(member_id, log_date);
CREATE INDEX idx_daily_logs_task_id ON daily_logs(task_id);
CREATE INDEX idx_next_week_tasks_week_of ON next_week_tasks(week_of);
