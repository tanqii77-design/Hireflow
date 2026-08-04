"use client";
/**
 * 删除按钮 — Client Component
 *
 * 必须标记 "use client"，因为用了 onClick 和 confirm()，
 * 这些都是浏览器 JavaScript，服务端无法执行。
 *
 * 点击 → 弹确认框 → 用户确认 → 提交 form → deleteJob Server Action 执行
 */
import { deleteJob } from "./actions";

export function DeleteButton({ jobId }: { jobId: number }) {
  return (
    <form action={deleteJob}>
      {/* 隐藏字段：把 jobId 传给 Server Action */}
      <input type="hidden" name="id" value={jobId} />

      <button
        type="submit"
        className="text-sm text-gray-600 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
        onClick={(e) => {
          // 浏览器原生确认框：用户点"取消"就不提交
          if (!confirm("确认删除这个职位？此操作不可撤销。")) {
            e.preventDefault();
          }
        }}
      >
        删除
      </button>
    </form>
  );
}
