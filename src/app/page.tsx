import Link from "next/link";

const features = [
  {
    title: "Daily Log",
    desc: "오늘의 업무 진행 내용, 이슈, 인사이트를 기록합니다.",
    href: "/daily",
    icon: "📋",
  },
  {
    title: "Weekly Report",
    desc: "차주 예정 업무를 등록하고 주간 현황을 확인합니다.",
    href: "/weekly",
    icon: "📅",
  },
  {
    title: "보고서 출력",
    desc: "버튼 하나로 팀 전체 업무를 대표 보고서로 자동 생성합니다.",
    href: "/report/print",
    icon: "🖨️",
  },
];

const today = new Date().toLocaleDateString("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
});

export default function DashboardPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="text-sm text-gray-500 mb-1">{today}</p>
        <h1 className="text-3xl font-bold text-gray-900">DesignBoard</h1>
        <p className="text-gray-500 mt-2">디자인팀 업무 관리 · 류민석 · 계은영 · 한다영</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {features.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="block p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all group"
          >
            <div className="text-3xl mb-3">{f.icon}</div>
            <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {f.title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{f.desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 p-5 bg-blue-50 border border-blue-100 rounded-xl">
        <p className="text-sm text-blue-700 font-medium">핵심 플로우</p>
        <div className="flex items-center gap-3 mt-3 flex-wrap text-sm text-gray-700">
          {["차주 계획 등록", "주간 실행", "일일 기록", "인사이트 축적", "자동 보고 출력"].map(
            (step, i, arr) => (
              <span key={step} className="flex items-center gap-3">
                <span className="font-medium">{step}</span>
                {i < arr.length - 1 && <span className="text-gray-400">→</span>}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}
