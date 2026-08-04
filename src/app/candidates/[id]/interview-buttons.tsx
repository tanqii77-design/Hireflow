"use client";
/**
 * 面试操作按钮 — Client Component
 *
 * 仅"已安排"状态的面试可操作：
 *   - 标记完成 → 状态变为 completed
 *   - 取消 → 状态变为 cancelled
 */
import { markInterviewCompleted, cancelInterview } from "./interview-actions";

export function InterviewButtons({
  interviewId,
  candidateId,
  status,
}: {
  interviewId: number;
  candidateId: number;
  status: string;
}) {
  // 只有 scheduled 状态可以操作
  if (status !== "scheduled") return null;

  return (
    <div className="flex gap-1 ml-auto flex-shrink-0">
      <form action={markInterviewCompleted}>
        <input type="hidden" name="interviewId" value={interviewId} />
        <input type="hidden" name="candidateId" value={candidateId} />
        <button
          type="submit"
          className="text-xs text-green-600 hover:bg-green-50 px-2 py-1 rounded transition-colors"
        >
          标记完成
        </button>
      </form>

      <form action={cancelInterview}>
        <input type="hidden" name="interviewId" value={interviewId} />
        <input type="hidden" name="candidateId" value={candidateId} />
        <button
          type="submit"
          className="text-xs text-gray-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
          onClick={(e) => {
            if (!confirm("确认取消这轮面试？")) {
              e.preventDefault();
            }
          }}
        >
          取消
        </button>
      </form>
    </div>
  );
}
