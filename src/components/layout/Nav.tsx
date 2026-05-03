"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "대시보드" },
  { href: "/daily", label: "Daily Log" },
  { href: "/weekly", label: "Weekly" },
  { href: "/report/print", label: "보고서" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="no-print fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-[#E2E8F0] flex items-center px-8 gap-0">
      <Link href="/" className="mr-8 flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg bg-[#3366FF] flex items-center justify-center text-white text-xs font-bold">D</span>
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
    </nav>
  );
}
