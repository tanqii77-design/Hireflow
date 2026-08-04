"use client";
/**
 * AI 匹配卡片 — 职位列表 + 匹配按钮
 * 匹配结果展示已移到父组件
 */
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { matchCandidate } from "./match-actions";

interface Job {
  id: number;
  title: string;
}

interface Props {
  candidateId: number;
  hasResume: boolean;
  openJobs: Job[];
}

export function MatchCard({ candidateId, hasResume, openJobs }: Props) {
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
      <h3 className="font-semibold text-gray-700 mb-3">选择职位匹配</h3>

      {openJobs.length === 0 ? (
        <p className="text-sm text-gray-600">暂无开放职位</p>
      ) : (
        <div className="space-y-1 max-h-52 overflow-y-auto">
          {openJobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-gray-700">{job.title}</span>
              <button
                onClick={() => doMatch(job.id)}
                disabled={!hasResume || matchingJobId !== null}
                className="text-xs text-indigo-600 hover:text-indigo-700 disabled:text-gray-300 disabled:cursor-not-allowed px-2 py-1"
                title={!hasResume ? "请先添加候选人简历" : ""}
              >
                {matchingJobId === job.id ? (
                  <Loader2 className="animate-spin w-4 h-4 inline-block" aria-hidden="true" />
                ) : (
                  "匹配"
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {!hasResume && (
        <p className="text-xs text-gray-600 mt-2">请先添加候选人简历后再进行匹配</p>
      )}
      {matchError && (
        <p className="text-xs text-red-500 mt-2">{matchError}</p>
      )}
    </div>
  );
}
