export const MEMBER_COLOR_PALETTE = [
  { dot: "bg-[#3366FF]", chip: "bg-[#EEF3FF]", text: "text-[#3366FF]" },
  { dot: "bg-[#FF4E6A]", chip: "bg-[#FFF0F2]", text: "text-[#FF4E6A]" },
  { dot: "bg-[#F5A623]", chip: "bg-[#FFF8EC]", text: "text-[#C87D00]" },
  { dot: "bg-[#00C896]", chip: "bg-[#E6FAF5]", text: "text-[#008A65]" },
  { dot: "bg-[#9B59B6]", chip: "bg-[#F5EEF8]", text: "text-[#7D3C98]" },
] as const;

export function getMemberColor(index: number) {
  return MEMBER_COLOR_PALETTE[index % MEMBER_COLOR_PALETTE.length];
}
