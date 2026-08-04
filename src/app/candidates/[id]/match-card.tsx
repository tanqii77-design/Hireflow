"use client";
/**
 * AI 匹配卡片 — 显示匹配记录 + 对新职位执行匹配
 */
import { useState } from "react";
import { matchCandidate } from "./match-actions";

interface Job {
  id: number;
  title: string;
}

interface MatchRecord {
  id: number;
  jobId: number;
  jobTitle: string;
  score: number;
  strengths: string[];
  concerns: string[];
  recommendation: string;
  createdAt: string;
}

interface Props {
  candidateId: number;
  hasResume: boolean;
  openJobs: Job[];
  matchRecords: MatchRecord[];
}

export function MatchCard({
  candidateId,
  hasResume,
  openJobs,
  matchRecords,
}: Props) {
  const [matchingJobId, setMatchingJobId] = useState<number | null>(null);
  const [matchError, setMatchError] = useState("");

  async function doMatch(jobId: number) {
    setMatchingJobId(jobId);
    setMatchError("");
    try {
      const formData = new FormData();
      formData.set("candidateId", String(candidateId));
      formData.set("jobId", String(jobId));
      await matchCandidate(formData);
    } catch (e: any) {
      setMatchError(e.message || "匹配失败");
    } finally {
      setMatchingJobId(null);
    }
  }

  return (
    <div>
      <h3 className="font-semibold text-gray-700 mb-3">💼 职位匹配</h3>

      {/* 匹配按钮区 */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2">
          选择职位进行 AI 适配度分析
        </p>
        {openJobs.length === 0 ? (
          <p className="text-sm text-gray-400">暂无开放职位</p>
        ) : (
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {openJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between py-1"
              >
                <span className="text-sm text-gray-700">{job.title}</span>
                <button
                  onClick={() => doMatch(job.id)}
                  disabled={!hasResume || matchingJobId !== null}
                  className="text-xs text-indigo-600 hover:text-indigo-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                  title={!hasResume ? "请先添加候选人简历" : ""}
                >
                  {matchingJobId === job.id ? (
                    <span className="animate-spin inline-block">⏳</span>
                  ) : (
                    "⚡ 匹配"
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
        {!hasResume && (
          <p className="text-xs text-gray-400 mt-2">💡 请先添加候选人简历后再进行匹配</p>
        )}
      </div>

      {matchError && (
        <p className="text-xs text-red-500 mb-3">{matchError}</p>
      )}

      {/* 匹配记录 */}
      {matchRecords.length > 0 ? (
        <div className="space-y-3 border-t border-gray-100 pt-3">
          {matchRecords.map((m) => (
            <div key={m.id} className="text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-700">{m.jobTitle}</span>
                <RecommendationBadge recommendation={m.recommendation} />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg font-bold text-indigo-600">
                  {m.score}
                </span>
                <span className="text-xs text-gray-400">/ 100</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      m.score >= 75
                        ? "bg-green-500"
                        : m.score >= 50
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${m.score}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-green-600">👍 {m.strengths.join("；")}</span>
                </div>
                <div>
                  <span className="text-amber-600">⚠️ {m.concerns.join("；")}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(m.createdAt).toLocaleString("zh-CN")}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">
          还没有匹配记录
        </p>
      )}
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
      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${m.cls}`}
    >
      {m.label}
    </span>
  );
}
