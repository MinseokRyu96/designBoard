"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface Attachment {
  id: string;
  type: "link" | "image";
  url: string;
  name: string | null;
  created_at: string;
}

interface TaskAttachmentsProps {
  taskId: string;
}

export default function TaskAttachments({ taskId }: TaskAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [mode, setMode] = useState<"idle" | "link" | "image">("idle");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAttachments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  async function fetchAttachments() {
    const res = await fetch(`/api/attachments?task_id=${taskId}`);
    const data = await res.json();
    if (Array.isArray(data)) setAttachments(data);
  }

  async function addLink() {
    if (!linkUrl) return;
    await fetch("/api/attachments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: taskId, url: linkUrl, name: linkName || linkUrl }),
    });
    setLinkUrl("");
    setLinkName("");
    setMode("idle");
    fetchAttachments();
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("task_id", taskId);
      formData.append("name", file.name);
      const res = await fetch("/api/attachments", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setUploadError(body.error ?? `업로드 실패 (${res.status})`);
        return;
      }
      fetchAttachments();
      setMode("idle");
    } catch (e) {
      setUploadError((e as Error).message ?? "업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function deleteAttachment(id: string) {
    setDeleting(id);
    await fetch(`/api/attachments?id=${id}`, { method: "DELETE" });
    setDeleting(null);
    fetchAttachments();
  }

  return (
    <div className="mt-1 pt-4 border-t border-[#EEF1F6]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[#A0AAB4] uppercase tracking-wide">첨부</span>
        {mode === "idle" && (
          <div className="flex gap-2">
            <button
              onClick={() => setMode("link")}
              className="text-xs text-[#3366FF] hover:text-[#2255EE] font-medium transition-colors"
            >
              + 링크
            </button>
            <button
              onClick={() => { setMode("image"); fileInputRef.current?.click(); }}
              className="text-xs text-[#3366FF] hover:text-[#2255EE] font-medium transition-colors"
            >
              + 이미지
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadImage(file);
        }}
      />

      {mode === "link" && (
        <div className="mb-3 p-3 bg-[#F9FAFB] border border-[#E2E8F0] rounded-xl space-y-2">
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="URL 입력 (https://...)"
            className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3366FF] bg-white"
            onKeyDown={(e) => e.key === "Enter" && addLink()}
            autoFocus
          />
          <input
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
            placeholder="이름 (선택)"
            className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3366FF] bg-white"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setMode("idle"); setLinkUrl(""); setLinkName(""); }}
              className="text-xs text-[#A0AAB4] hover:text-[#6B7685] transition-colors"
            >
              취소
            </button>
            <button
              onClick={addLink}
              className="text-xs px-3 py-1.5 bg-[#3366FF] text-white rounded-lg hover:bg-[#2255EE] transition-colors font-medium"
            >
              추가
            </button>
          </div>
        </div>
      )}

      {uploading && (
        <div className="text-xs text-[#A0AAB4] py-1.5 flex items-center gap-1.5">
          <span className="w-3 h-3 border-2 border-[#3366FF] border-t-transparent rounded-full animate-spin" />
          업로드 중...
        </div>
      )}

      {uploadError && (
        <div className="text-xs text-[#FF4E6A] py-1.5 flex items-center justify-between gap-2 bg-[#FFF5F7] px-3 rounded-lg border border-[#FFD6DD]">
          <span>⚠ {uploadError}</span>
          <button onClick={() => setUploadError(null)} className="text-[#C0C8D4] hover:text-[#6B7685] shrink-0">✕</button>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center gap-2 group p-2 rounded-lg hover:bg-[#F9FAFB] transition-colors">
              {att.type === "link" ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-[#EEF3FF] flex items-center justify-center text-[#3366FF] text-[10px] shrink-0">🔗</span>
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#3366FF] hover:underline truncate font-medium"
                  >
                    {att.name || att.url}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <a href={att.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    <Image
                      src={att.url}
                      alt={att.name ?? "첨부 이미지"}
                      width={40}
                      height={40}
                      className="w-10 h-10 object-cover rounded-lg border border-[#E2E8F0] hover:opacity-80 transition-opacity"
                    />
                  </a>
                  <span className="text-xs text-[#6B7685] truncate">{att.name}</span>
                </div>
              )}
              <button
                onClick={() => deleteAttachment(att.id)}
                disabled={deleting === att.id}
                className="shrink-0 text-xs text-[#C0C8D4] hover:text-[#FF4E6A] opacity-0 group-hover:opacity-100 transition-all"
              >
                {deleting === att.id ? "..." : "✕"}
              </button>
            </div>
          ))}
        </div>
      )}

      {attachments.length === 0 && mode === "idle" && !uploadError && (
        <p className="text-xs text-[#C0C8D4]">첨부 없음</p>
      )}
    </div>
  );
}
