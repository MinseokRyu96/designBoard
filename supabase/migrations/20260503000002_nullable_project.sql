-- tasks.project_id를 nullable로 변경 (개별 업무 작성 지원)
ALTER TABLE tasks ALTER COLUMN project_id DROP NOT NULL;
