"use client";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
}

export default function DatePicker({ value, onChange, label }: DatePickerProps) {
  return (
    <div className="flex items-center gap-2">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
