/**
 * 职位列表页
 *
 * 这是 Server Component（默认就是），可以直接调用数据库，
 * 不经过 API，数据在服务端渲染好再发给浏览器。
 */
import Link from "next/link";
import db from "@/db";
import { jobs, candidates, interviews, feedback, matches } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { DeleteButton } from "./delete-button";
import { Breadcrumb } from "@/components/breadcrumb";
import { Briefcase } from "lucide-react";

// 告诉 Next.js 这个页面每次请求都重新渲染（不缓存）
export const dynamic = "force-dynamic";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  // 直接从数据库读所有职位，按创建时间倒序
  const allJobs = await db.select().from(jobs).orderBy(desc(jobs.createdAt));

  // 批量获取所有候选人和面试数据，计算每个职位的统计
  const allCandidates = await db.select().from(candidates);
  const allInterviews = await db.select().from(interviews);
  const allFeedback = await db.select().from(feedback);
  const allMatches = await db.select().from(matches);

  // 为每个职位计算统计
  const fedInterviewIds = new Set(
    allFeedback.map((fb: typeof feedback.$inferSelect) => fb.interviewId)
  );

  function getJobStats(jobId: number) {
    const jobCandidates = allCandidates.filter(
      (c: typeof candidates.$inferSelect) => c.jobId === jobId
    );
    const candidateIds = new Set(jobCandidates.map((c: typeof candidates.$inferSelect) => c.id));

    // 该职位下的面试
    const jobInterviews = allInterviews.filter(
      (iv: typeof interviews.$inferSelect) => candidateIds.has(iv.candidateId)
    );

    const interviewing = jobCandidates.filter(
      (c: typeof candidates.$inferSelect) => c.status === "interviewing"
    ).length;
    const hired = jobCandidates.filter(
      (c: typeof candidates.$inferSelect) => c.status === "hired"
    ).length;

    // 待反馈：该职位下 completed 但无反馈的面试数
    const pendingFeedback = jobInterviews.filter(
      (iv: typeof interviews.$inferSelect) =>
        iv.status === "completed" && !fedInterviewIds.has(iv.id)
    ).length;

    const matched = allMatches.filter(
      (m: typeof matches.$inferSelect) => m.jobId === jobId
    ).length;

    return { total: jobCandidates.length, interviewing, pendingFeedback, hired, matched };
  }

  return (
    <div>
      <Breadcrumb items={[{ label: "看板", href: "/" }, { label: "职位" }]} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-balance">职位管理</h1>
          <p className="text-sm text-gray-600 mt-1">
            {allJobs.length > 0
              ? `共 ${allJobs.length} 个职位`
              : "还没有职位，创建一个吧"}
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="neu-btn-primary bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          + 新建职位
        </Link>
      </div>

      {/* 空状态：没有任何职位时显示 */}
      {allJobs.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-16 text-center">
          <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-4" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            还没有职位
          </h3>
          <p className="text-gray-600 mb-6">
            创建第一个职位后，就可以开始添加候选人了
          </p>
          <Link
            href="/jobs/new"
            className="neu-btn-primary bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors inline-block"
          >
            创建第一个职位 →
          </Link>
        </div>
      ) : (
        /* 职位卡片列表 */
        <div className="grid gap-4">
          {allJobs.map((job: typeof jobs.$inferSelect) => (
            <div
              key={job.id}
              className="neu-card p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                {/* 左侧：职位信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors truncate"
                    >
                      {job.title}
                    </Link>
                    {/* 状态标签：open=绿色, closed=灰色 */}
                    <StatusBadge status={job.status} />
                  </div>

                  {job.description ? (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {job.description}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1 italic">
                      暂无简介
                    </p>
                  )}

                  {/* 关键数据统计 */}
                  {(() => {
                    const s = getJobStats(job.id);
                    return (
                      <div className="flex gap-3 mt-3 text-xs text-gray-600 flex-wrap">
                        <span>候选人 {s.total}</span>
                        {s.interviewing > 0 && (
                          <span className="text-blue-600">
                            面试中 {s.interviewing}
                          </span>
                        )}
                        {s.pendingFeedback > 0 && (
                          <span className="text-red-500">
                            待反馈 {s.pendingFeedback}
                          </span>
                        )}
                        {s.matched > 0 && (
                          <span className="text-purple-600">
                            已匹配 {s.matched} 人
                          </span>
                        )}
                        {s.hired > 0 && (
                          <span className="text-green-600">
                            已入职 {s.hired}
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  <p className="text-xs text-gray-600 mt-2">
                    创建于{" "}
                    {new Date(job.createdAt).toLocaleDateString("zh-CN")}
                  </p>
                </div>

                {/* 右侧：操作按钮 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/jobs/${job.id}/edit`}
                    className="text-sm text-gray-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    编辑
                  </Link>
                  {/* 删除按钮是 Client Component，因为有 confirm 弹窗 */}
                  <DeleteButton jobId={job.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 状态标签组件
 * open → 绿色 "招聘中"
 * closed → 灰色 "已关闭"
 */
function StatusBadge({ status }: { status: string }) {
  const isOpen = status === "open";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isOpen
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-gray-100 text-gray-600 border border-gray-200"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isOpen ? "bg-green-500" : "bg-gray-400"
        }`}
      />
      {isOpen ? "招聘中" : "已关闭"}
    </span>
  );
}
