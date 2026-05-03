"use client";

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: "top" | "bottom";
}

export default function Tooltip({ text, children, position = "top" }: TooltipProps) {
  return (
    <div className="relative group/tooltip">
      {children}
      <span
        className={`
          absolute left-1/2 -translate-x-1/2 whitespace-nowrap
          text-[11px] font-medium bg-[#191F28] text-white px-2 py-1 rounded-lg
          opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-150
          pointer-events-none z-30
          ${position === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"}
        `}
      >
        {text}
      </span>
    </div>
  );
}
