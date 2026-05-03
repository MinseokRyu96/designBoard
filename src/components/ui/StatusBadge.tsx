import type { TaskStatus } from "@/types";

const styles: Record<TaskStatus, { bg: string; dot: string; text: string }> = {
  진행중: { bg: "bg-[#EEF3FF]", dot: "bg-[#3366FF]", text: "text-[#3366FF]" },
  완료:   { bg: "bg-[#EDFAF3]", dot: "bg-[#0BB15A]", text: "text-[#0A8C46]" },
  보류:   { bg: "bg-[#F4F6FA]", dot: "bg-[#A0AAB4]", text: "text-[#6B7685]" },
};

export default function StatusBadge({ status }: { status: TaskStatus }) {
  const s = styles[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium print-status ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {status}
    </span>
  );
}
