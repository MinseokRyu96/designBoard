"use client";

import { MEMBER_ORDER, type MemberName } from "@/types";

interface MemberTabsProps {
  selected: MemberName;
  onChange: (member: MemberName) => void;
}

export default function MemberTabs({ selected, onChange }: MemberTabsProps) {
  return (
    <div className="flex gap-1 border-b border-gray-200">
      {MEMBER_ORDER.map((name) => (
        <button
          key={name}
          onClick={() => onChange(name)}
          className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            selected === name
              ? "text-blue-600 border-blue-600"
              : "text-gray-500 border-transparent hover:text-gray-800"
          }`}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
