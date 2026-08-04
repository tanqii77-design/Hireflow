"use client";
/**
 * 状态推进按钮 — Client Component
 *
 * 支持 disabled 和 reason：被锁定时灰色不可点，下方显示原因
 */
import { advanceStatus } from "../actions";

export function StatusAdvanceButton({
  candidateId,
  status,
  label,
  disabled = false,
  reason = "",
}: {
  candidateId: number;
  status: string;
  label: string;
  disabled?: boolean;
  reason?: string;
}) {
  const isReject = status === "rejected";

  return (
    <form action={advanceStatus}>
      <input type="hidden" name="id" value={candidateId} />
      <input type="hidden" name="status" value={status} />
      <div>
        <button
          type="submit"
          disabled={disabled}
          className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            disabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : isReject
              ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
          }`}
        >
          {label}
        </button>
        {disabled && reason && (
          <p className="text-xs text-gray-400 mt-1 px-1">{reason}</p>
        )}
      </div>
    </form>
  );
}
