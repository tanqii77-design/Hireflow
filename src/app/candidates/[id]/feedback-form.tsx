"use client";
/**
 * 反馈表单 — Client Component
 *
 * 点击"填写反馈"或"编辑反馈" → 展开表单
 * 星级评分由用户点击选择，5 颗星可交互
 */
import { useState } from "react";
import { submitFeedback } from "./feedback-actions";

interface Props {
  interviewId: number;
  candidateId: number;
  interviewer: string;
  existing?: {
    id: number;
    rating: number;
    strengths: string | null;
    concerns: string | null;
    conclusion: string;
    submittedBy: string | null;
  } | null;
}

export function FeedbackForm({
  interviewId,
  candidateId,
  interviewer,
  existing,
}: Props) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existing?.rating || 0);
  const isEdit = !!existing;

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            isEdit
              ? "text-indigo-600 hover:bg-indigo-50"
              : "text-amber-600 hover:bg-amber-50 font-medium"
          }`}
        >
          {isEdit ? "编辑反馈" : "✏️ 填写反馈"}
        </button>
      ) : (
        <form
          action={submitFeedback}
          className="mt-3 bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {isEdit ? "编辑反馈" : "填写反馈"}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              收起
            </button>
          </div>

          <input type="hidden" name="interviewId" value={interviewId} />
          <input type="hidden" name="candidateId" value={candidateId} />
          {/* 评分通过 hidden input 提交 */}
          <input type="hidden" name="rating" value={rating} />

          {/* 星级评分 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              评分 <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl transition-colors ${
                    star <= rating
                      ? "text-amber-400"
                      : "text-gray-300 hover:text-amber-300"
                  }`}
                >
                  ★
                </button>
              ))}
              {rating > 0 && (
                <span className="text-sm text-gray-500 ml-2 self-center">
                  {rating} / 5
                </span>
              )}
            </div>
          </div>

          {/* 优点 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              优点
            </label>
            <textarea
              name="strengths"
              rows={2}
              defaultValue={existing?.strengths || ""}
              placeholder="候选人的优势、亮点..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* 担忧点 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              担忧点
            </label>
            <textarea
              name="concerns"
              rows={2}
              defaultValue={existing?.concerns || ""}
              placeholder="需要关注的问题、风险..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* 结论 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              结论 <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-3">
              {[
                { value: "pass", label: "✅ 通过" },
                { value: "fail", label: "❌ 不通过" },
                { value: "pending", label: "⏸ 待定" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-1.5 text-sm cursor-pointer"
                >
                  <input
                    type="radio"
                    name="conclusion"
                    value={opt.value}
                    defaultChecked={
                      existing
                        ? existing.conclusion === opt.value
                        : opt.value === "pending"
                    }
                    className="text-indigo-600"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* 提交人 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              提交人
            </label>
            <input
              type="text"
              name="submittedBy"
              defaultValue={existing?.submittedBy || interviewer}
              placeholder="填写你的名字"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* 按钮 */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={rating === 0}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isEdit ? "更新反馈" : "提交反馈"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
