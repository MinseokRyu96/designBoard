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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAttachments();
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
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("task_id", taskId);
      formData.append("name", file.name);
      await fetch("/api/attachments", { method: "POST", body: formData });
      fetchAttachments();
    } finally {
      setUploading(false);
      setMode("idle");
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
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">첨부</span>
        {mode === "idle" && (
          <div className="flex gap-2">
            <button
              onClick={() => setMode("link")}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              + 링크
            </button>
            <button
              onClick={() => { setMode("image"); fileInputRef.current?.click(); }}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              + 이미지
            </button>
          </div>
        )}
      </div>

      {/* 숨겨진 파일 input */}
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

      {/* 링크 입력 폼 */}
      {mode === "link" && (
        <div className="mb-2 p-2 bg-gray-50 rounded-lg space-y-2">
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="URL 입력 (https://...)"
            className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            onKeyDown={(e) => e.key === "Enter" && addLink()}
            autoFocus
          />
          <input
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
            placeholder="이름 (선택)"
            className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setMode("idle"); setLinkUrl(""); setLinkName(""); }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              취소
            </button>
            <button
              onClick={addLink}
              className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              추가
            </button>
          </div>
        </div>
      )}

      {/* 업로드 중 */}
      {uploading && (
        <div className="text-xs text-gray-400 py-1">업로드 중...</div>
      )}

      {/* 첨부 목록 */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center gap-2 group">
              {att.type === "link" ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-gray-400 text-xs">🔗</span>
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline truncate"
                  >
                    {att.name || att.url}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <Image
                      src={att.url}
                      alt={att.name ?? "첨부 이미지"}
                      width={48}
                      height={48}
                      className="w-12 h-12 object-cover rounded border border-gray-200 hover:opacity-80 transition-opacity"
                    />
                  </a>
                  <span className="text-xs text-gray-500 truncate">{att.name}</span>
                </div>
              )}
              <button
                onClick={() => deleteAttachment(att.id)}
                disabled={deleting === att.id}
                className="shrink-0 text-xs text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {deleting === att.id ? "..." : "✕"}
              </button>
            </div>
          ))}
        </div>
      )}

      {attachments.length === 0 && mode === "idle" && (
        <p className="text-xs text-gray-300">첨부 없음</p>
      )}
    </div>
  );
}
