"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface FormState {
  name: string;
  username: string;
  password: string;
  passwordConfirm: string;
  email: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: "",
    username: "",
    password: "",
    passwordConfirm: "",
    email: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.username || !form.password || !form.passwordConfirm || !form.email) {
      setError("모든 항목을 입력해주세요.");
      return;
    }

    if (form.password !== form.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          username: form.username,
          password: form.password,
          email: form.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "회원가입에 실패했습니다.");
        return;
      }

      router.push("/login?signup=success");
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
          <h1 className="text-2xl font-bold text-[#191F28]">회원가입</h1>
          <p className="text-sm text-[#6B7685] mt-1">디자인팀 업무 관리 보드에 가입하세요</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-[#191F28] mb-1.5">이름</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="홍길동"
              autoComplete="name"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3366FF] focus:border-transparent placeholder:text-[#C0C8D4]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#191F28] mb-1.5">아이디</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="사용할 아이디 입력"
              autoComplete="username"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3366FF] focus:border-transparent placeholder:text-[#C0C8D4]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#191F28] mb-1.5">비밀번호</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="비밀번호 입력"
              autoComplete="new-password"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3366FF] focus:border-transparent placeholder:text-[#C0C8D4]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#191F28] mb-1.5">비밀번호 확인</label>
            <input
              name="passwordConfirm"
              type="password"
              value={form.passwordConfirm}
              onChange={handleChange}
              placeholder="비밀번호 재입력"
              autoComplete="new-password"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3366FF] focus:border-transparent placeholder:text-[#C0C8D4]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#191F28] mb-1.5">이메일</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@email.com"
              autoComplete="email"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#191F28] focus:outline-none focus:ring-2 focus:ring-[#3366FF] focus:border-transparent placeholder:text-[#C0C8D4]"
            />
            <p className="mt-1 text-xs text-[#A0AAB4]">비밀번호 찾기 시 이 이메일로 안내가 발송됩니다.</p>
          </div>

          {error && (
            <div className="text-sm text-[#FF4E6A] bg-[#FFF5F7] border border-[#FFD6DD] rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3366FF] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#2255EE] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "가입 중..." : "회원가입"}
          </button>

          <p className="text-center text-sm text-[#6B7685]">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-[#3366FF] font-medium hover:underline">
              로그인
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
