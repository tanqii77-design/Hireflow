/**
 * 职位详情页 — Server Component
 *
 * 显示职位信息和该职位下的候选人列表
 * 候选人列表目前为空，第 4 天实现候选人功能后会填满
 */
import Link from "next/link";
import db from "@/db";
import { jobs, candidates } from "@/db/schema";
import { eq } from "drizzle-orm";
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

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/jobs"
          className="text-sm text-gray-400 hover:text-indigo-600 transition-colors"
        >
          ← 返回职位列表
        </Link>
      </div>

      {/* 职位头部信息 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
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

      {/* 候选人列表（第 4 天后会有数据） */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-700 mb-4">
          候选人（{jobCandidates.length}）
        </h2>
        {jobCandidates.length === 0 ? (
          <p className="text-sm text-gray-400">
            暂无候选人，候选人管理功能将在第 4 天实现
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {jobCandidates.map((c: typeof candidates.$inferSelect) => (
              <li key={c.id} className="py-3">
                <span className="font-medium text-gray-800">{c.name}</span>
                <span className="text-sm text-gray-400 ml-3">{c.email}</span>
                <span className="text-sm text-gray-400 ml-2">
                  · {c.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
