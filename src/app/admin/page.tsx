"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Profile {
  id: string;
  name: string;
  username: string;
  email: string;
  status: "pending" | "approved";
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();

    const params = new URLSearchParams(window.location.search);
    if (params.get("approved") === "1") {
      showToast("승인 완료되었습니다.");
      router.replace("/admin");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadUsers() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.status === 401) { router.push("/login"); return; }
    if (res.status === 403) { router.push("/"); return; }
    const data = await res.json();
    if (Array.isArray(data)) setUsers(data);
    setLoading(false);
  }

  async function approve(userId: string) {
    setApproving(userId);
    const res = await fetch("/api/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status: "approved" } : u));
      showToast("승인 완료되었습니다.");
    }
    setApproving(null);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const pending = users.filter((u) => u.status === "pending");
  const approved = users.filter((u) => u.status === "approved");

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-xl font-bold text-[#191F28] mb-1">멤버 관리</h1>
      <p className="text-sm text-[#6B7685] mb-8">가입 신청을 검토하고 멤버를 승인하세요.</p>

      {loading ? (
        <p className="text-sm text-[#A0AAB4]">불러오는 중...</p>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-[#FF9500] uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF9500]" />
                승인 대기 {pending.length}건
              </h2>
              <div className="space-y-3">
                {pending.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    action={
                      <button
                        onClick={() => approve(u.id)}
                        disabled={approving === u.id}
                        className="px-4 py-1.5 text-sm font-medium bg-[#3366FF] text-white rounded-lg hover:bg-[#2255EE] transition-colors disabled:opacity-50"
                      >
                        {approving === u.id ? "승인 중..." : "승인"}
                      </button>
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {pending.length === 0 && (
            <div className="mb-8 p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-sm text-[#16A34A]">
              대기 중인 가입 신청이 없습니다.
            </div>
          )}

          {approved.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-[#A0AAB4] uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#A0AAB4]" />
                승인된 멤버 {approved.length}명
              </h2>
              <div className="space-y-2">
                {approved.map((u) => (
                  <UserRow key={u.id} user={u} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#191F28] text-white text-sm px-5 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function UserRow({ user, action }: { user: Profile; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white border border-[#E2E8F0] rounded-xl">
      <div>
        <p className="text-sm font-semibold text-[#191F28]">
          {user.name}
          <span className="ml-2 text-xs font-normal text-[#A0AAB4]">@{user.username}</span>
        </p>
        <p className="text-xs text-[#6B7685] mt-0.5">{user.email}</p>
        <p className="text-xs text-[#C0C8D4] mt-0.5">
          {new Date(user.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })} 가입 신청
        </p>
      </div>
      {action ?? (
        <span className="text-xs text-[#16A34A] font-medium bg-[#F0FDF4] px-2.5 py-1 rounded-full border border-[#BBF7D0]">승인됨</span>
      )}
    </div>
  );
}
