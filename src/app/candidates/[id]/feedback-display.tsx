/**
 * 反馈摘要展示 — Server Component
 *
 * 当反馈已存在时，展示只读的反馈卡片
 * 包含：星级评分、结论标签、优缺点摘要、提交人
 */
export interface FeedbackData {
  id: number;
  rating: number;
  strengths: string | null;
  concerns: string | null;
  conclusion: string;
  submittedBy: string | null;
}

export function FeedbackDisplay({ fb }: { fb: FeedbackData }) {
  const conclusionMap: Record<string, { label: string; cls: string }> = {
    pass: { label: "通过", cls: "bg-green-50 text-green-700 border-green-200" },
    fail: {
      label: "不通过",
      cls: "bg-red-50 text-red-700 border-red-200",
    },
    pending: {
      label: "待定",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
    },
  };
  const c = conclusionMap[fb.conclusion] || {
    label: fb.conclusion,
    cls: "bg-gray-100 text-gray-500 border-gray-200",
  };

  return (
    <div className="mt-3 bg-white border border-gray-200 rounded-lg p-3 space-y-2">
      {/* 评分 + 结论 */}
      <div className="flex items-center gap-2">
        <span className="text-amber-400 text-sm">
          {"★".repeat(fb.rating)}
          <span className="text-gray-300">
            {"★".repeat(5 - fb.rating)}
          </span>
        </span>
        <span className="text-xs text-gray-400">{fb.rating}/5</span>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium border ${c.cls}`}
        >
          {c.label}
        </span>
      </div>

      {/* 优点 */}
      {fb.strengths && (
        <div className="text-xs">
          <span className="text-green-600 font-medium">👍 优点：</span>
          <span className="text-gray-600">{fb.strengths}</span>
        </div>
      )}

      {/* 担忧点 */}
      {fb.concerns && (
        <div className="text-xs">
          <span className="text-amber-600 font-medium">⚠️ 担忧：</span>
          <span className="text-gray-600">{fb.concerns}</span>
        </div>
      )}

      {/* 提交人 */}
      {fb.submittedBy && (
        <div className="text-xs text-gray-400">提交人：{fb.submittedBy}</div>
      )}
    </div>
  );
}
