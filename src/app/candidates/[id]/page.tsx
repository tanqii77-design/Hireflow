/**
 * 候选人详情页 — Server Component
 *
 * 展示：个人信息、状态推进、面试时间线（已实现）、安排面试表单
 */
import Link from "next/link";
import db from "@/db";
import { candidates, jobs, interviews, feedback, matches } from "@/db/schema";
import { eq, asc, inArray, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { StatusAdvanceButton } from "./status-button";
import { ScheduleForm } from "./schedule-form";
import { InterviewButtons } from "./interview-buttons";
import { FeedbackDisplay, type FeedbackData } from "./feedback-display";
import { FeedbackForm } from "./feedback-form";
import { Breadcrumb } from "@/components/breadcrumb";
import { ResumeCard } from "./resume-card";
import { MatchCard } from "./match-card";

export const dynamic = "force-dynamic";

export default async function CandidateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const cid = parseInt(id);
  if (isNaN(cid)) notFound();

  const [candidate] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.id, cid));
  if (!candidate) notFound();

  // 查关联职位
  const [job] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, candidate.jobId));

  // 查面试记录，按轮次排序
  const interviewList = await db
    .select()
    .from(interviews)
    .where(eq(interviews.candidateId, cid))
    .orderBy(asc(interviews.roundNumber));

  // 批量查所有面试的反馈（一条面试最多一条反馈）
  const interviewIds = interviewList.map((iv: typeof interviews.$inferSelect) => iv.id);
  const feedbackList =
    interviewIds.length > 0
      ? await db
          .select()
          .from(feedback)
          .where(inArray(feedback.interviewId, interviewIds))
      : [];

  // 构建 interviewId → feedback 的映射，方便在时间线里快速查找
  const feedbackMap = new Map<number, FeedbackData>(
    feedbackList.map((fb: typeof feedback.$inferSelect) => [fb.interviewId, fb as FeedbackData])
  );

  // 查匹配记录（按时间倒序）
  const matchRecords = await db
    .select()
    .from(matches)
    .where(eq(matches.candidateId, cid))
    .orderBy(desc(matches.createdAt));

  // 查开放职位（供匹配按钮使用）
  const openJobs = await db.select().from(jobs).where(eq(jobs.status, "open"));

  // 匹配记录补充职位名
  const matchJobIds = [...new Set(matchRecords.map((m: typeof matches.$inferSelect) => m.jobId))] as number[];
  const matchJobMap = new Map<number, string>();
  for (const mjid of matchJobIds) {
    const [mj] = await db.select().from(jobs).where(eq(jobs.id, mjid));
    if (mj) matchJobMap.set(mjid, mj.title);
  }

  const matchRecordsWithTitle = matchRecords.map((m: typeof matches.$inferSelect) => ({
    id: m.id,
    jobId: m.jobId,
    jobTitle: matchJobMap.get(m.jobId) || `职位#${m.jobId}`,
    score: m.score,
    strengths: m.strengths ? JSON.parse(m.strengths) : [],
    concerns: m.concerns ? JSON.parse(m.concerns) : [],
    recommendation: m.recommendation,
    createdAt: m.createdAt,
  }));

  // 状态流程定义（"进入面试"已改为自动触发，不显示为按钮）
  const statusFlow: Record<
    string,
    { label: string; next: { label: string; value: string }[] }
  > = {
    screening: {
      label: "筛选中",
      next: [
        // "进入面试"已移除——安排面试时自动触发
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

  // ===== 业务规则：计算状态推进的锁定条件 =====
  const completedInterviews = interviewList.filter(
    (iv: typeof interviews.$inferSelect) => iv.status === "completed"
  );
  const hasCompletedInterview = completedInterviews.length > 0;
  // 所有已完成的面试是否都已填写反馈
  const allCompletedHaveFeedback = completedInterviews.every(
    (iv: typeof interviews.$inferSelect) => feedbackMap.has(iv.id)
  );
  const hasAnyInterview = interviewList.length > 0;

  /**
   * 判断某个目标状态是否需要锁定
   * 返回 { locked: boolean, reason: string }
   */
  function getLock(targetStatus: string): {
    locked: boolean;
    reason: string;
  } {
    // 发 Offer（passed → offered）：必须至少有一轮完成 + 所有完成面试已填反馈
    if (targetStatus === "offered") {
      if (!hasCompletedInterview) {
        return {
          locked: true,
          reason: "请先完成至少一轮面试后再发 Offer",
        };
      }
      if (!allCompletedHaveFeedback) {
        return {
          locked: true,
          reason: "请先为所有已完成的面试填写反馈后再发 Offer",
        };
      }
      return { locked: false, reason: "" };
    }

    // 淘汰（→ rejected）：如果有面试记录，需要至少一轮已完成+已反馈
    if (targetStatus === "rejected") {
      if (hasAnyInterview) {
        if (!hasCompletedInterview) {
          return {
            locked: true,
            reason: "请先完成至少一轮面试后再淘汰",
          };
        }
        if (!allCompletedHaveFeedback) {
          return {
            locked: true,
            reason: "请先为已完成的面试填写反馈后再淘汰",
          };
        }
      }
      return { locked: false, reason: "" };
    }

    // 其他状态（通过、入职、放弃、初筛淘汰）：不设限
    return { locked: false, reason: "" };
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "看板", href: "/" },
          { label: "候选人", href: "/candidates" },
          { label: candidate.name },
        ]}
      />

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm max-w-lg">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：个人信息 + 面试时间线 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 个人信息卡片 */}
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

          {/* 面试时间线 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">
                📅 面试记录（{interviewList.length}）
              </h2>
              <ScheduleForm candidateId={candidate.id} />
            </div>

            {interviewList.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">暂无面试记录</p>
                <p className="text-xs mt-1">
                  点击"安排面试"按钮添加第一轮面试
                </p>
              </div>
            ) : (
              /* 时间线 */
              <div className="relative pl-6 border-l-2 border-indigo-100 space-y-4">
                {interviewList.map(
                  (iv: typeof interviews.$inferSelect) => {
                    const isCompleted = iv.status === "completed";
                    const isCancelled = iv.status === "cancelled";
                    const fb: FeedbackData | undefined = feedbackMap.get(iv.id); // 该面试的反馈

                    return (
                      <div key={iv.id} className="relative">
                        {/* 时间线圆点 */}
                        <div
                          className={`absolute -left-[25px] w-3.5 h-3.5 rounded-full border-2 bg-white ${
                            isCompleted
                              ? "border-green-500 bg-green-50"
                              : isCancelled
                              ? "border-gray-300 bg-gray-100"
                              : "border-blue-500 bg-blue-50"
                          }`}
                        />

                        <div
                          className={`rounded-lg border p-3 text-sm ${
                            isCancelled ? "opacity-50 bg-gray-50" : "bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* 轮次 + 类型图标 */}
                            <span className="font-semibold text-gray-800 text-sm">
                              第{iv.roundNumber}轮 ·{" "}
                              {iv.interviewType === "video"
                                ? "🎥 视频"
                                : iv.interviewType === "phone"
                                ? "📞 电话"
                                : "🏢 现场"}
                            </span>

                            {/* 状态标签 */}
                            <InterviewStatusBadge status={iv.status} />

                            {/* 反馈状态 */}
                            {fb ? (
                              <span className="text-xs text-green-600 font-medium">
                                ✓ 已反馈
                              </span>
                            ) : isCompleted ? (
                              <span className="text-xs text-amber-600 font-medium">
                                ⚠ 待反馈
                              </span>
                            ) : null}

                            {/* 操作按钮 */}
                            <InterviewButtons
                              interviewId={iv.id}
                              candidateId={candidate.id}
                              status={iv.status}
                            />
                          </div>

                          <div className="flex gap-4 mt-1.5 text-gray-500 text-xs">
                            <span>面试官：{iv.interviewer}</span>
                            {iv.scheduledAt ? (
                              <span>
                                {new Date(iv.scheduledAt).toLocaleString(
                                  "zh-CN",
                                  {
                                    month: "numeric",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            ) : (
                              <span className="text-gray-400">时间待定</span>
                            )}
                          </div>

                          {/* 反馈区域 */}
                          {fb ? (
                            /* 有反馈 → 展示摘要 + 编辑入口 */
                            <div>
                              <FeedbackDisplay fb={fb} />
                              <FeedbackForm
                                interviewId={iv.id}
                                candidateId={candidate.id}
                                interviewer={iv.interviewer}
                                existing={fb}
                              />
                            </div>
                          ) : isCompleted ? (
                            /* 已完成但没反馈 → 显示填写入口 */
                            <div className="mt-2">
                              <FeedbackForm
                                interviewId={iv.id}
                                candidateId={candidate.id}
                                interviewer={iv.interviewer}
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：简历 + AI 匹配 + 状态操作 */}
        <div className="space-y-4">
          <ResumeCard
            candidateId={candidate.id}
            resumeText={candidate.resumeText ?? null}
          />

          <MatchCard
            candidateId={candidate.id}
            hasResume={!!(candidate.resumeText?.trim())}
            openJobs={openJobs}
            matchRecords={matchRecordsWithTitle}
          />

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-3">推进状态</h3>
            {currentFlow.next.length > 0 ? (
              <div className="space-y-3">
                {currentFlow.next.map((n) => {
                  const lock = getLock(n.value);
                  return (
                    <StatusAdvanceButton
                      key={n.value}
                      candidateId={candidate.id}
                      status={n.value}
                      label={n.label}
                      disabled={lock.locked}
                      reason={lock.reason}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400">已是最终状态</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-2">创建时间</h3>
            <p className="text-sm text-gray-500">
              {new Date(candidate.createdAt).toLocaleDateString("zh-CN")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 面试状态标签
 */
function InterviewStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "scheduled":
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          已安排
        </span>
      );
    case "completed":
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
          已完成
        </span>
      );
    case "cancelled":
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
          已取消
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
          {status}
        </span>
      );
  }
}
