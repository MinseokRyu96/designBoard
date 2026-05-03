"use client";

import { MEMBER_ORDER, type MemberName } from "@/types";

const MEMBER_COLORS: Record<MemberName, string> = {
  류민석: "bg-[#3366FF]",
  계은영: "bg-[#FF4E6A]",
  한다영: "bg-[#F5A623]",
};

interface MemberTabsProps {
  selected: MemberName;
  onChange: (member: MemberName) => void;
}

export default function MemberTabs({ selected, onChange }: MemberTabsProps) {
  return (
    <div className="flex gap-2">
      {MEMBER_ORDER.map((name) => {
        const active = selected === name;
        return (
          <button
            key={name}
            onClick={() => onChange(name)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              active
                ? "bg-[#191F28] text-white shadow-sm"
                : "bg-white border border-[#E2E8F0] text-[#6B7685] hover:border-[#C0C8D4] hover:text-[#191F28]"
            }`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${MEMBER_COLORS[name]}`} />
            {name}
          </button>
        );
      })}
    </div>
  );
}
