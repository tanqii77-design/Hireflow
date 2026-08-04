/**
 * 候选人详情页 — Server Component
 *
 * 展示：个人信息、当前状态、状态推进按钮、面试时间线（第5天完善）
 */
import Link from "next/link";
import db from "@/db";
import { candidates, jobs, interviews } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { StatusAdvanceButton } from "./status-button";

export const dynamic = "force-dynamic";

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cid = parseInt(id);
  if (isNaN(cid)) notFound();

  const [candidate] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.id, cid));
  if (!candidate) notFound();

  // 查关联职位
  const [job] = await db.select().from(jobs).where(eq(jobs.id, candidate.jobId));

  // 查面试记录（第5天后会有数据）
  const interviewList = await db
    .select()
    .from(interviews)
    .where(eq(interviews.candidateId, cid));

  // 状态流程定义
  const statusFlow: Record<string, { label: string; next: { label: string; value: string }[] }> = {
    screening: {
      label: "筛选中",
      next: [
        { label: "进入面试", value: "interviewing" },
        { label: "淘汰", value: "rejected" },
      ],
    },
    interviewing: {
      label: "面试中",
      next: [
        { label: "通过", value: "passed" },
        { label: "淘汰", value: "rejected" },
      ],
    },
    passed: {
      label: "已通过",
      next: [{ label: "发 Offer", value: "offered" }],
    },
    offered: {
      label: "已发Offer",
      next: [
        { label: "入职", value: "hired" },
        { label: "放弃", value: "rejected" },
      ],
    },
    rejected: { label: "已淘汰", next: [] },
    hired: { label: "已入职", next: [] },
  };

  const currentFlow = statusFlow[candidate.status] || {
    label: candidate.status,
    next: [],
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/candidates"
          className="text-sm text-gray-400 hover:text-indigo-600 transition-colors"
        >
          ← 返回候选人列表
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：个人信息 */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">{candidate.name}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  currentFlow.label === "已入职"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : currentFlow.label === "已淘汰"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                {currentFlow.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">电话</span>
                <p className="text-gray-700">{candidate.phone || "—"}</p>
              </div>
              <div>
                <span className="text-gray-400">邮箱</span>
                <p className="text-gray-700">{candidate.email || "—"}</p>
              </div>
              <div>
                <span className="text-gray-400">应聘职位</span>
                <p className="text-gray-700">
                  {job ? (
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      {job.title}
                    </Link>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
              <div>
                <span className="text-gray-400">来源</span>
                <p className="text-gray-700">{candidate.source || "—"}</p>
              </div>
            </div>
          </div>

          {/* 面试时间线（第5天完善） */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-700 mb-4">
              面试记录（{interviewList.length}）
            </h2>
            {interviewList.length === 0 ? (
              <p className="text-sm text-gray-400">
                暂无面试记录，面试安排功能将在第 5 天实现
              </p>
            ) : (
              <div className="space-y-3">
                {interviewList.map((iv: typeof interviews.$inferSelect) => (
                  <div
                    key={iv.id}
                    className="border border-gray-100 rounded-lg p-3 text-sm"
                  >
                    <span className="font-medium">
                      第{iv.roundNumber}轮 · {iv.interviewType}
                    </span>
                    <span className="text-gray-400 ml-2">
                      面试官：{iv.interviewer}
                    </span>
                    <span className="text-gray-400 ml-2">· {iv.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：状态操作 */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-3">推进状态</h3>
            {currentFlow.next.length > 0 ? (
              <div className="space-y-2">
                {currentFlow.next.map((n) => (
                  <StatusAdvanceButton
                    key={n.value}
                    candidateId={candidate.id}
                    status={n.value}
                    label={n.label}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">已是最终状态</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-2">
              创建时间
            </h3>
            <p className="text-sm text-gray-500">
              {new Date(candidate.createdAt).toLocaleDateString("zh-CN")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
