"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Icon from "@/components/ui/Icon";

const navItems = [
  { href: "/", label: "대시보드" },
  { href: "/daily", label: "Daily Log" },
  { href: "/weekly", label: "Weekly" },
  { href: "/report/print", label: "보고서" },
];

interface UserProfile {
  name: string;
  username: string;
  is_admin: boolean;
}

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setProfile(null); return; }

      const { data } = await supabase
        .from("profiles")
        .select("name, username, is_admin")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data);
    }

    loadProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setProfile(null);
    router.push("/login");
    router.refresh();
  }

  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password";
  if (isAuthPage) return null;

  return (
    <nav className="no-print fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-[#E2E8F0] flex items-center px-8 gap-0">
      <Link href="/" className="mr-8 flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg bg-[#3366FF] flex items-center justify-center"><Icon name="write" size={16} /></span>
        <span className="font-bold text-[#191F28] text-[15px] tracking-tight">DesignBoard</span>
      </Link>
      <div className="flex items-center gap-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-[#EEF3FF] text-[#3366FF]"
                  : "text-[#6B7685] hover:bg-[#F4F6FA] hover:text-[#191F28]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="ml-auto flex items-center gap-3">
        {profile ? (
          <>
            <span className="text-sm text-[#6B7685]">
              <span className="font-medium text-[#191F28]">{profile.name}</span>
              <span className="ml-1 text-[#A0AAB4] text-xs">@{profile.username}</span>
            </span>
            {profile.is_admin && (
              <Link
                href="/admin"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/admin"
                    ? "bg-[#EEF3FF] text-[#3366FF]"
                    : "text-[#6B7685] hover:bg-[#F4F6FA] hover:text-[#191F28]"
                }`}
              >
                멤버 관리
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#6B7685] hover:bg-[#F4F6FA] hover:text-[#191F28] transition-colors"
            >
              로그아웃
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#6B7685] hover:bg-[#F4F6FA] hover:text-[#191F28] transition-colors"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[#3366FF] text-white hover:bg-[#2255EE] transition-colors"
            >
              회원가입
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
