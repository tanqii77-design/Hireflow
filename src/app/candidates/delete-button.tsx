"use client";
import { deleteCandidate } from "./actions";

export function DeleteButton({ candidateId }: { candidateId: number }) {
  return (
    <form action={deleteCandidate}>
      <input type="hidden" name="id" value={candidateId} />
      <button
        type="submit"
        className="text-sm text-gray-400 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
        onClick={(e) => {
          if (!confirm("确认删除该候选人？此操作不可撤销。")) {
            e.preventDefault();
          }
        }}
      >
        删除
      </button>
    </form>
  );
}
