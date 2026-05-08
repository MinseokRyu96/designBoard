"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
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
          <h1 className="text-2xl font-bold text-[#191F28]">비밀번호 찾기</h1>
          <p className="text-sm text-[#6B7685] mt-1">가입 시 입력한 이메일로 재설정 링크를 보내드립니다</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-[#EEF3FF] rounded-full flex items-center justify-center mx-auto">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="#3366FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 6L12 13L2 6" stroke="#3366FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm text-[#191F28] font-medium">이메일을 확인해주세요</p>
              <p className="text-sm text-[#6B7685]">
                <span className="font-medium text-[#191F28]">{email}</span> 으로<br />
                비밀번호 재설정 링크를 발송했습니다.
              </p>
              <Link
                href="/login"
                className="block text-sm text-[#3366FF] font-medium hover:underline mt-4"
              >
                로그인으로 돌아가기
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#191F28] mb-1.5">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="가입 시 입력한 이메일"
                  required
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3366FF] focus:border-transparent placeholder:text-[#C0C8D4]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#3366FF] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#2255EE] transition-colors disabled:opacity-50"
              >
                {loading ? "발송 중..." : "재설정 링크 보내기"}
              </button>
              <Link
                href="/login"
                className="block text-center text-sm text-[#A0AAB4] hover:text-[#6B7685] transition-colors"
              >
                로그인으로 돌아가기
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
