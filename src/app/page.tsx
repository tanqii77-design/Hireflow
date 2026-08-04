/**
 * 首页 — 汇总看板
 *
 * 统计卡片 + 待反馈清单 + 候选人进度总览
 */
import Link from "next/link";
import db from "@/db";
import { jobs, candidates, interviews, feedback, matches } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { EmptyOnboarding, ProcessFlow } from "@/components/onboarding";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // ===== 统计数据 =====

  // 开放职位数
  const openJobs = await db
    .select()
    .from(jobs)
    .where(eq(jobs.status, "open"));

  // 面试中的候选人数
  const interviewingCandidates = await db
    .select()
    .from(candidates)
    .where(eq(candidates.status, "interviewing"));

  // 已入职数
  const hiredCandidates = await db
    .select()
    .from(candidates)
    .where(eq(candidates.status, "hired"));

  // ===== 待反馈：面试 completed 但没有 feedback 记录 =====
  // 1. 找出所有 completed 的面试
  const completedInterviews = await db
    .select()
    .from(interviews)
    .where(eq(interviews.status, "completed"));

  // 2. 找出所有已存在的反馈
  const interviewIds = completedInterviews.map(
    (iv: typeof interviews.$inferSelect) => iv.id
  );
  const allFeedback =
    interviewIds.length > 0
      ? await db
          .select()
          .from(feedback)
          .where(inArray(feedback.interviewId, interviewIds))
      : [];

  // 3. 有反馈的面试 ID 集合
  const fedInterviewIds = new Set(
    allFeedback.map((fb: typeof feedback.$inferSelect) => fb.interviewId)
  );

  // 4. 待反馈 = completed 但不在反馈集合里
  const pendingFeedback = completedInterviews.filter(
    (iv: typeof interviews.$inferSelect) => !fedInterviewIds.has(iv.id)
  );

  // ===== 待反馈需要候选人名 + 职位信息 =====
  // 批量获取候选人
  const pendingCandidateIds = [
    ...new Set(
      pendingFeedback.map(
        (iv: typeof interviews.$inferSelect) => iv.candidateId
      )
    ),
  ] as number[];
  const pendingCandidates =
    pendingCandidateIds.length > 0
      ? await db
          .select()
          .from(candidates)
          .where(inArray(candidates.id, pendingCandidateIds))
      : [];

  const candidateMap = new Map<number, typeof candidates.$inferSelect>(
    pendingCandidates.map((c: typeof candidates.$inferSelect) => [c.id, c])
  );

  // 批量获取职位名
  const jobIds = [
    ...new Set(
      pendingCandidates.map((c: typeof candidates.$inferSelect) => c.jobId)
    ),
  ] as number[];
  const pendingJobs =
    jobIds.length > 0
      ? await db.select().from(jobs).where(inArray(jobs.id, jobIds as number[]))
      : [];
  const jobMap = new Map<number, typeof jobs.$inferSelect>(
    pendingJobs.map((j: typeof jobs.$inferSelect) => [j.id, j])
  );

  // ===== 最近候选人 =====
  const recentCandidates = await db
    .select()
    .from(candidates)
    .orderBy(desc(candidates.createdAt))
    .limit(8);

  // 批量获取他们的职位名
  const recentJobIds = [
    ...new Set(
      recentCandidates.map(
        (c: typeof candidates.$inferSelect) => c.jobId
      )
    ),
  ] as number[];
  const recentJobs =
    recentJobIds.length > 0
      ? await db
          .select()
          .from(jobs)
          .where(inArray(jobs.id, recentJobIds as number[]))
      : [];
  const recentJobMap = new Map<number, typeof jobs.$inferSelect>(
    recentJobs.map((j: typeof jobs.$inferSelect) => [j.id, j])
  );

  // AI 匹配统计
  const matchCount = (await db.select().from(matches)).length;

  // 是否为空系统
  const hasData = openJobs.length > 0 || recentCandidates.length > 0;

  // ===== 渲染 =====
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-balance">汇总看板</h1>

      {/* ===== 空状态：新手引导 ===== */}
      {!hasData && <EmptyOnboarding />}

      {/* ===== 统计卡片 ===== */}
      {matchCount > 0 && (
        <p className="text-xs text-purple-600 mb-3">
           已 AI 匹配 {matchCount} 次
        </p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="开放职位"
          value={openJobs.length}
          color="bg-indigo-50 text-indigo-700"
        />
        <StatCard
          label="面试中"
          value={interviewingCandidates.length}
          color="bg-amber-50 text-amber-700"
        />
        <StatCard
          label="待反馈"
          value={pendingFeedback.length}
          color={
            pendingFeedback.length > 0
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }
        />
        <StatCard
          label="已入职"
          value={hiredCandidates.length}
          color="bg-green-50 text-green-700"
        />
      </div>

      {/* ===== 二级入口卡片 ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Link
          href="/jobs"
          className="group neu-card p-5 hover:shadow-lg transition-shadow transition-transform"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-xl" aria-hidden="true">
                💼
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">职位管理</h3>
                <p className="text-sm text-gray-600">
                  {openJobs.length} 个职位开放中
                </p>
              </div>
            </div>
            <span className="text-indigo-500 group-hover:translate-x-1 transition-transform text-lg">
              →
            </span>
          </div>
        </Link>

        <Link
          href="/candidates"
          className="group neu-card p-5 hover:shadow-lg transition-shadow transition-transform"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-xl" aria-hidden="true">
                👥
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">候选人管理</h3>
                <p className="text-sm text-gray-600">
                  共 {recentCandidates.length} 位候选人
                  {interviewingCandidates.length > 0 &&
                    ` · ${interviewingCandidates.length} 位面试中`}
                </p>
              </div>
            </div>
            <span className="text-indigo-500 group-hover:translate-x-1 transition-transform text-lg">
              →
            </span>
          </div>
        </Link>
      </div>

      {/* ===== 有数据时：紧凑流程条 ===== */}
      {hasData && <ProcessFlow />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ===== 待反馈清单 ===== */}
        <div className="neu-card p-5">
          <h2 className="font-semibold text-gray-700 mb-4">
            待反馈（{pendingFeedback.length}）
          </h2>
          {pendingFeedback.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2"></p>
              <p className="text-sm text-gray-600">全部反馈已收齐</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {pendingFeedback.map(
                (iv: typeof interviews.$inferSelect) => {
                  const c = candidateMap.get(iv.candidateId);
                  const j = c ? jobMap.get(c.jobId) : undefined;
                  return (
                    <Link
                      key={iv.id}
                      href={`/candidates/${iv.candidateId}`}
                      className="block border border-red-100 rounded-lg p-3 hover:bg-red-50/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800 text-sm">
                          {c?.name || "未知候选人"}
                        </span>
                        <span className="text-xs text-red-500 font-medium">
                          欠反馈
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        第{iv.roundNumber}轮 · 面试官：{iv.interviewer}
                        {j && <span> · {j.title}</span>}
                      </div>
                    </Link>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* ===== 最近候选人 ===== */}
        <div className="neu-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">
              <span aria-hidden="true">👥 </span>最近候选人
            </h2>
            <Link
              href="/candidates"
              className="text-sm text-indigo-600 hover:text-indigo-700 px-2 py-1"
            >
              查看全部 →
            </Link>
          </div>
          {recentCandidates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-600">暂无候选人</p>
              <Link
                href="/candidates/new"
                className="text-sm text-indigo-600 hover:text-indigo-700 mt-1 inline-block"
              >
                添加第一个 →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentCandidates.map(
                (c: typeof candidates.$inferSelect) => {
                  const j = recentJobMap.get(c.jobId);
                  return (
                    <Link
                      key={c.id}
                      href={`/candidates/${c.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                    >
                      <div>
                        <span className="font-medium text-gray-800 text-sm">
                          {c.name}
                        </span>
                        <span className="text-xs text-gray-600 ml-2">
                          {j?.title || "—"}
                        </span>
                      </div>
                      <DashboardStatusBadge status={c.status} />
                    </Link>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** 统计卡片 */
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`${color} rounded-xl p-4 text-center shadow-sm`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm mt-1 opacity-80">{label}</div>
    </div>
  );
}

/** 候选人状态标签（和候选人列表页配色一致） */
function DashboardStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    screening: {
      label: "筛选中",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
    },
    interviewing: {
      label: "面试中",
      cls: "bg-blue-50 text-blue-700 border-blue-200",
    },
    passed: {
      label: "已通过",
      cls: "bg-green-50 text-green-700 border-green-200",
    },
    rejected: {
      label: "已淘汰",
      cls: "bg-red-50 text-red-700 border-red-200",
    },
    offered: {
      label: "已发Offer",
      cls: "bg-purple-50 text-purple-700 border-purple-200",
    },
    hired: {
      label: "已入职",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
  };
  const m = map[status] || {
    label: status,
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
