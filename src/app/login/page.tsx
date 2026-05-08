"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "로그인에 실패했습니다.");
        return;
      }

      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-9 h-9 rounded-xl bg-[#3366FF] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="2" width="14" height="14" rx="2" stroke="white" strokeWidth="1.5"/>
                <line x1="5" y1="6" x2="13" y2="6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="5" y1="9" x2="11" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="5" y1="12" x2="9" y2="12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </span>
            <span className="font-bold text-[#191F28] text-xl tracking-tight">DesignBoard</span>
          </div>
          <h1 className="text-2xl font-bold text-[#191F28]">로그인</h1>
          <p className="text-sm text-[#6B7685] mt-1">디자인팀 업무 관리 보드</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-[#191F28] mb-1.5">아이디</label>
            <input
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(null); }}
              placeholder="아이디 입력"
              autoComplete="username"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3366FF] focus:border-transparent placeholder:text-[#C0C8D4]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#191F28] mb-1.5">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              placeholder="비밀번호 입력"
              autoComplete="current-password"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3366FF] focus:border-transparent placeholder:text-[#C0C8D4]"
            />
          </div>

          {error && (
            <div className="text-sm text-[#FF4E6A] bg-[#FFF5F7] border border-[#FFD6DD] rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3366FF] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#2255EE] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>

          <div className="flex items-center justify-between text-sm">
            <Link href="/forgot-password" className="text-[#A0AAB4] hover:text-[#6B7685] transition-colors">
              비밀번호 찾기
            </Link>
            <Link href="/signup" className="text-[#3366FF] font-medium hover:underline">
              회원가입
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
