"use client";
/**
 * 状态推进按钮 — Client Component
 *
 * 点击 → 提交 form → advanceStatus Server Action 执行
 */
import { advanceStatus } from "../actions";

export function StatusAdvanceButton({
  candidateId,
  status,
  label,
}: {
  candidateId: number;
  status: string;
  label: string;
}) {
  // 不同操作的颜色
  const colorMap: Record<string, string> = {
    interviewing: "bg-blue-600 hover:bg-blue-700",
    passed: "bg-green-600 hover:bg-green-700",
    rejected: "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200",
    offered: "bg-purple-600 hover:bg-purple-700",
    hired: "bg-emerald-600 hover:bg-emerald-700",
  };

  const color =
    colorMap[status] || "bg-indigo-600 hover:bg-indigo-700 text-white";

  return (
    <form action={advanceStatus}>
      <input type="hidden" name="id" value={candidateId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          status === "rejected"
            ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
            : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
        }`}
      >
        {label}
      </button>
    </form>
  );
}
