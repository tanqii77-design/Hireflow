/**
 * 职位详情页 — Server Component
 *
 * 显示职位信息和该职位下的候选人列表
 * 候选人列表目前为空，第 4 天实现候选人功能后会填满
 */
import Link from "next/link";
import db from "@/db";
import { jobs, candidates, matches } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Breadcrumb } from "@/components/breadcrumb";
import { notFound } from "next/navigation";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jobId = parseInt(id);

  if (isNaN(jobId)) notFound();

  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
  if (!job) notFound();

  // 查该职位下的所有候选人
  const jobCandidates = await db
    .select()
    .from(candidates)
    .where(eq(candidates.jobId, jobId));

  // 查该职位的匹配记录
  const jobMatches = await db
    .select()
    .from(matches)
    .where(eq(matches.jobId, jobId))
    .orderBy(desc(matches.createdAt));

  // 构建候选人 ID→姓名映射
  const matchCandidateIds = [...new Set(jobMatches.map((m: typeof matches.$inferSelect) => m.candidateId))] as number[];
  const matchCandidateMap = new Map<number, string>();
  for (const cid of matchCandidateIds) {
    const [c] = await db.select().from(candidates).where(eq(candidates.id, cid));
    if (c) matchCandidateMap.set(cid, c.name);
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "看板", href: "/" },
          { label: "职位", href: "/jobs" },
          { label: job.title },
        ]}
      />

      {/* 职位头部信息 */}
      <div className="neu-card p-6 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
              job.status === "open"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-gray-100 text-gray-500 border border-gray-200"
            }`}
          >
            {job.status === "open" ? "招聘中" : "已关闭"}
          </span>
        </div>

        {job.description ? (
          <p className="text-gray-500">{job.description}</p>
        ) : (
          <p className="text-gray-300 italic">暂无简介</p>
        )}

        <p className="text-xs text-gray-400 mt-4">
          创建于 {new Date(job.createdAt).toLocaleDateString("zh-CN")}
        </p>

        <div className="flex gap-3 mt-4">
          <Link
            href={`/jobs/${job.id}/edit`}
            className="text-sm text-indigo-600 hover:text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            编辑职位
          </Link>
        </div>
      </div>

      {/* AI 匹配候选人 */}
      <div className="neu-card p-6 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">
          🤖 AI 匹配候选人（{jobMatches.length}）
        </h2>
        {jobMatches.length === 0 ? (
          <p className="text-sm text-gray-400">
            还没有候选人匹配该职位
          </p>
        ) : (
          <div className="divide-y divide-gray-50">
            {jobMatches.map((m: typeof matches.$inferSelect) => (
              <div
                key={m.id}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-4 flex-1">
                  <Link
                    href={`/candidates/${m.candidateId}`}
                    className="font-medium text-gray-800 hover:text-indigo-600 transition-colors min-w-[80px]"
                  >
                    {matchCandidateMap.get(m.candidateId) || `候选人#${m.candidateId}`}
                  </Link>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm font-bold text-indigo-600 w-8">
                      {m.score}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-[120px]">
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
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                      m.recommendation === "推荐面试"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : m.recommendation === "谨慎考虑"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {m.recommendation}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(m.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 候选人列表 */}
      <div className="neu-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">
            候选人（{jobCandidates.length}）
          </h2>
          <Link
            href={`/candidates/new`}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            + 添加候选人
          </Link>
        </div>
        {jobCandidates.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">👤</p>
            <p className="text-sm">该职位暂无候选人</p>
            <Link
              href="/candidates/new"
              className="text-sm text-indigo-600 hover:text-indigo-700 mt-1 inline-block"
            >
              添加第一个候选人 →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {jobCandidates.map((c: typeof candidates.$inferSelect) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <Link
                    href={`/candidates/${c.id}`}
                    className="font-medium text-gray-800 hover:text-indigo-600 transition-colors"
                  >
                    {c.name}
                  </Link>
                  <span className="text-sm text-gray-400 ml-2">
                    {c.source || ""}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                    c.status === "screening"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : c.status === "interviewing"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : c.status === "passed"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : c.status === "rejected"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : c.status === "offered"
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : c.status === "hired"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-gray-100 text-gray-500 border-gray-200"
                  }`}
                >
                  {c.status === "screening"
                    ? "筛选中"
                    : c.status === "interviewing"
                    ? "面试中"
                    : c.status === "passed"
                    ? "已通过"
                    : c.status === "rejected"
                    ? "已淘汰"
                    : c.status === "offered"
                    ? "已发Offer"
                    : c.status === "hired"
                    ? "已入职"
                    : c.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
