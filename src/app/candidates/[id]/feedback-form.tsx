"use client";
/**
 * 反馈表单 — 含 AI 面试评估（TXT 面试记录 → AI 生成草稿）
 */
import { useState, useRef } from "react";
import { submitFeedback } from "./feedback-actions";
import { aiAssessInterview } from "./feedback-actions";

interface Props {
  interviewId: number;
  candidateId: number;
  interviewer: string;
  existing?: {
    id: number;
    rating: number;
    strengths: string | null;
    concerns: string | null;
    submittedBy: string | null;
  } | null;
  hasApiKey?: boolean;
}

export function FeedbackForm({
  interviewId,
  candidateId,
  interviewer,
  existing,
  hasApiKey = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existing?.rating || 0);
  const [strengths, setStrengths] = useState(existing?.strengths || "");
  const [concerns, setConcerns] = useState(existing?.concerns || "");

  // AI 评估状态
  const [txtFile, setTxtFile] = useState<File | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = !!existing;

  async function handleAIAssess() {
    if (!txtFile) return;
    setAiLoading(true);
    setAiError("");
    try {
      const text = await txtFile.text();
      if (!text.trim()) { setAiError("文件内容为空"); return; }

      const result = await aiAssessInterview(interviewId, text.trim());

      // 自动填入表单
      setRating(result.rating);
      setStrengths(result.strengths);
      setConcerns(result.concerns);
    } catch (e: any) {
      setAiError(e.message || "AI 分析失败");
    } finally {
      setAiLoading(false);
    }
  }

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
          {isEdit ? "编辑反馈" : "填写反馈"}
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
            <button type="button" onClick={() => setOpen(false)} className="text-gray-600 hover:text-gray-600 text-sm">
              收起
            </button>
          </div>

          <input type="hidden" name="interviewId" value={interviewId} />
          <input type="hidden" name="candidateId" value={candidateId} />
          <input type="hidden" name="rating" value={rating} />
          <input type="hidden" name="strengths" value={strengths} />
          <input type="hidden" name="concerns" value={concerns} />

          {/* AI 面试评估 */}
          <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-indigo-700">AI 面试评估</span>
              {!hasApiKey && (
                <span className="text-xs text-gray-600">（未配置 API Key，可手动填写）</span>
              )}
            </div>
            <p className="text-xs text-gray-600 mb-2">
              上传面试记录（TXT），AI 将结合岗位 JD 生成反馈草稿，提交前请人工核对
            </p>

            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".txt"
                className="hidden"
                onChange={(e) => setTxtFile(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs bg-white border border-gray-300 rounded px-3 py-1 hover:bg-gray-50 transition-colors"
              >
                选择 TXT
              </button>
              {txtFile && (
                <span className="text-xs text-gray-600">{txtFile.name}</span>
              )}
              <button
                type="button"
                onClick={handleAIAssess}
                disabled={!txtFile || aiLoading || !hasApiKey}
                className="text-xs bg-indigo-600 text-white rounded px-3 py-1 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {aiLoading ? (
                  <span className="flex items-center gap-1">
                    <span className="animate-spin">⏳</span> 分析中…
                  </span>
                ) : (
                  "AI 生成反馈"
                )}
              </button>
            </div>
            {aiError && <p className="text-xs text-red-500 mt-2">{aiError}</p>}
          </div>

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
                  aria-label={`${star} 星`}
                  className={`text-2xl transition-colors ${
                    star <= rating ? "text-amber-400" : "text-gray-300 hover:text-amber-300"
                  }`}
                >
                  ★
                </button>
              ))}
              {rating > 0 && <span className="text-sm text-gray-600 ml-2 self-center">{rating} / 5</span>}
            </div>
          </div>

          {/* 优点 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">优点</label>
            <textarea
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              rows={2}
              placeholder="候选人的优势、亮点..."
              className="neu-inset w-full px-3 py-2 text-sm resize-none"
            />
          </div>

          {/* 担忧点 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">担忧点</label>
            <textarea
              value={concerns}
              onChange={(e) => setConcerns(e.target.value)}
              rows={2}
              placeholder="需要关注的问题、风险..."
              className="neu-inset w-full px-3 py-2 text-sm resize-none"
            />
          </div>

          {/* 提交人 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">提交人</label>
            <input
              type="text"
              name="submittedBy"
              defaultValue={existing?.submittedBy || interviewer}
              placeholder="填写你的名字"
              className="neu-inset w-full px-3 py-2 text-sm"
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
