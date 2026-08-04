"use client";
/**
 * AI 适配度分析表单 + 结果展示
 */
import { useState } from "react";
import { PdfUploader } from "./pdf-uploader";

interface Job {
  id: number;
  title: string;
  status: string;
}

interface MatchResult {
  jobId: number;
  jobTitle: string;
  score: number;
  strengths: string[];
  concerns: string[];
  recommendation: string;
  error?: string;
}

export function MatchForm({
  jobs,
  hasApiKey,
}: {
  jobs: Job[];
  hasApiKey: boolean;
}) {
  const [resume, setResume] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleJob = (id: number) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () =>
    setSelectedIds(new Set(jobs.filter((j) => j.status === "open").map((j) => j.id)));
  const clearAll = () => setSelectedIds(new Set());

  const analyze = async () => {
    if (!resume.trim()) {
      setError("请输入简历内容");
      return;
    }
    if (selectedIds.size === 0) {
      setError("请至少选择一个职位");
      return;
    }
    setError("");
    setLoading(true);
    setResults(null);

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: resume.trim(),
          jobIds: [...selectedIds],
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setResults(data.results);
      } else {
        setError(data.error || "分析失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 左侧：输入区 */}
      <div className="lg:col-span-1 space-y-4">
        {/* 简历输入 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📄 简历内容
          </label>

          <div className="mb-3">
            <PdfUploader
              onTextExtracted={(text) => setResume(text)}
            />
          </div>

          <textarea
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            rows={14}
            placeholder="在此粘贴候选人的简历文本..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-400 mt-2">
            🔒 简历仅用于本次分析，不会保存到服务器或公开
          </p>
        </div>

        {/* 职位选择 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              💼 选择职位（{selectedIds.size}/{jobs.length}）
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-indigo-600 hover:text-indigo-700"
              >
                全选开放
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                清空
              </button>
            </div>
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {jobs.map((job) => (
              <label
                key={job.id}
                className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-gray-50 rounded px-1"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(job.id)}
                  onChange={() => toggleJob(job.id)}
                  className="text-indigo-600 rounded"
                />
                <span className="text-sm text-gray-700">{job.title}</span>
                <span
                  className={`text-xs ml-auto ${
                    job.status === "open" ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {job.status === "open" ? "招聘中" : "已关闭"}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 分析按钮 */}
        <button
          onClick={analyze}
          disabled={!hasApiKey || loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span> AI 分析中…
            </span>
          ) : (
            "🚀 开始分析"
          )}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* 右侧：结果区 */}
      <div className="lg:col-span-2">
        {results === null && !loading && (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-16 text-center text-gray-400">
            <p className="text-3xl mb-3">🤖</p>
            <p>粘贴简历并选择职位后，点击"开始分析"</p>
          </div>
        )}

        {results && results.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            无分析结果
          </div>
        )}

        {results && results.length > 0 && (
          <div className="space-y-4">
            {results.map((r) => (
              <div
                key={r.jobId}
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">
                    {r.jobTitle}
                  </h3>
                  {r.error ? (
                    <span className="text-xs text-red-500">分析失败</span>
                  ) : (
                    <RecommendationBadge recommendation={r.recommendation} />
                  )}
                </div>

                {r.error ? (
                  <p className="text-sm text-red-500">{r.error}</p>
                ) : (
                  <>
                    {/* 分数 + 进度条 */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl font-bold text-indigo-600">
                        {r.score}
                      </span>
                      <span className="text-sm text-gray-400">/ 100</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all ${
                            r.score >= 75
                              ? "bg-green-500"
                              : r.score >= 50
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${r.score}%` }}
                        />
                      </div>
                    </div>

                    {/* 优势 + 担忧 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-medium text-green-600">
                          👍 优势
                        </span>
                        <ul className="mt-1 space-y-1">
                          {r.strengths.map((s, i) => (
                            <li
                              key={i}
                              className="text-sm text-gray-600 flex gap-1"
                            >
                              <span className="text-green-400">•</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-amber-600">
                          ⚠️ 担忧点
                        </span>
                        <ul className="mt-1 space-y-1">
                          {r.concerns.map((c, i) => (
                            <li
                              key={i}
                              className="text-sm text-gray-600 flex gap-1"
                            >
                              <span className="text-amber-400">•</span> {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RecommendationBadge({ recommendation }: { recommendation: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    "推荐面试": {
      label: "推荐面试",
      cls: "bg-green-50 text-green-700 border-green-200",
    },
    "谨慎考虑": {
      label: "谨慎考虑",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
    },
    "不推荐": {
      label: "不推荐",
      cls: "bg-red-50 text-red-700 border-red-200",
    },
  };
  const m = map[recommendation] || {
    label: recommendation,
    cls: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${m.cls}`}
    >
      {m.label}
    </span>
  );
}
