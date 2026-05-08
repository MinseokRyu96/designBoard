"use client";

import { MEMBER_COLOR_PALETTE } from "@/lib/member-colors";

interface MemberTabsProps {
  members: string[];
  selected: string;
  onChange: (member: string) => void;
}

export default function MemberTabs({ members, selected, onChange }: MemberTabsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {members.map((name, idx) => {
        const active = selected === name;
        const dotColor = MEMBER_COLOR_PALETTE[idx % MEMBER_COLOR_PALETTE.length].dot;
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
            <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
            {name}
          </button>
        );
      })}
    </div>
  );
}
