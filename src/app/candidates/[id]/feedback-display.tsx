/**
 * 反馈摘要展示
 * 显示：星级评分、优缺点摘要、提交人
 */
export interface FeedbackData {
  id: number;
  rating: number;
  strengths: string | null;
  concerns: string | null;
  submittedBy: string | null;
}

export function FeedbackDisplay({ fb }: { fb: FeedbackData }) {
  return (
    <div className="mt-3 bg-white border border-gray-200 rounded-lg p-3 space-y-2">
      {/* 评分 */}
      <div className="flex items-center gap-2">
        <span className="text-amber-400 text-sm">
          {"★".repeat(fb.rating)}
          <span className="text-gray-300">
            {"★".repeat(5 - fb.rating)}
          </span>
        </span>
        <span className="text-xs text-gray-400">{fb.rating}/5</span>
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
