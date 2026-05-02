import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/layout/Nav";

export const metadata: Metadata = {
  title: "DesignBoard — 디자인팀 업무 관리",
  description: "디자인팀 3인 업무 기록·계획·보고 통합 관리",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Nav />
        <main className="pt-16 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
