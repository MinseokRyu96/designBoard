-- 업무 첨부파일 테이블 (링크 + 이미지)
CREATE TABLE task_attachments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('link', 'image')),
  url        TEXT NOT NULL,
  name       TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_task_attachments_task_id ON task_attachments(task_id);

ALTER TABLE task_attachments DISABLE ROW LEVEL SECURITY;

-- Supabase Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;
