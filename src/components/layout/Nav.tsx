"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "대시보드" },
  { href: "/daily", label: "Daily Log" },
  { href: "/weekly", label: "Weekly Report" },
  { href: "/report/print", label: "출력하기" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="no-print fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-8">
      <span className="font-bold text-gray-900 text-lg mr-4">DesignBoard</span>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`text-sm font-medium transition-colors ${
            pathname === item.href
              ? "text-blue-600 border-b-2 border-blue-600 pb-0.5"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
