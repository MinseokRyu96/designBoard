import type { TaskStatus } from "@/types";

const styles: Record<TaskStatus, string> = {
  진행중: "bg-blue-100 text-blue-700",
  완료: "bg-green-100 text-green-700",
  보류: "bg-gray-100 text-gray-500",
};

export default function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium print-status ${styles[status]}`}>
      [{status}]
    </span>
  );
}
