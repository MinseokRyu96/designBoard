-- 모든 public 테이블에 RLS 활성화
-- 정책: 로그인한 사용자(authenticated)는 모든 데이터 읽기/쓰기 가능
-- service_role(API routes)은 RLS를 자동 우회하므로 별도 정책 불필요

ALTER TABLE members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE next_week_tasks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- members
CREATE POLICY "authenticated can read members"
  ON members FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated can insert members"
  ON members FOR INSERT TO authenticated WITH CHECK (true);

-- projects
CREATE POLICY "authenticated can read projects"
  ON projects FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated can insert projects"
  ON projects FOR INSERT TO authenticated WITH CHECK (true);

-- tasks
CREATE POLICY "authenticated can read tasks"
  ON tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated can insert tasks"
  ON tasks FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated can update tasks"
  ON tasks FOR UPDATE TO authenticated USING (true);

CREATE POLICY "authenticated can delete tasks"
  ON tasks FOR DELETE TO authenticated USING (true);

-- daily_logs
CREATE POLICY "authenticated can read daily_logs"
  ON daily_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated can insert daily_logs"
  ON daily_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated can update daily_logs"
  ON daily_logs FOR UPDATE TO authenticated USING (true);

CREATE POLICY "authenticated can delete daily_logs"
  ON daily_logs FOR DELETE TO authenticated USING (true);

-- next_week_tasks
CREATE POLICY "authenticated can read next_week_tasks"
  ON next_week_tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated can insert next_week_tasks"
  ON next_week_tasks FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated can delete next_week_tasks"
  ON next_week_tasks FOR DELETE TO authenticated USING (true);

-- task_attachments
CREATE POLICY "authenticated can read task_attachments"
  ON task_attachments FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated can insert task_attachments"
  ON task_attachments FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated can delete task_attachments"
  ON task_attachments FOR DELETE TO authenticated USING (true);
