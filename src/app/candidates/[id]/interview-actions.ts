"use server";
/**
 * 面试 Server Actions — 安排、标记完成、取消 + 自动状态流转
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import db from "@/db";
import { interviews, candidates } from "@/db/schema";
import { eq, asc, or } from "drizzle-orm";

/**
 * 安排新面试
 * 轮次自动计算 + 如果候选人是 screening 状态 → 自动升级为 interviewing
 */
export async function scheduleInterview(formData: FormData) {
  const candidateId = parseInt(formData.get("candidateId") as string);
  const interviewer = (formData.get("interviewer") as string) || "";
  const interviewType = (formData.get("interviewType") as string) || "video";
  const scheduledAt = (formData.get("scheduledAt") as string) || "";

  if (!interviewer.trim()) {
    redirect(`/candidates/${candidateId}?error=` + encodeURIComponent("面试官姓名不能为空"));
  }

  // 计算轮次
  const existing = await db
    .select()
    .from(interviews)
    .where(eq(interviews.candidateId, candidateId))
    .orderBy(asc(interviews.roundNumber));
  const nextRound =
    existing.length > 0 ? existing[existing.length - 1].roundNumber + 1 : 1;

  // 插入面试
  await db.insert(interviews).values({
    candidateId,
    roundNumber: nextRound,
    interviewer: interviewer.trim(),
    interviewType,
    scheduledAt: scheduledAt || null,
  });

  // ★ 自动流转：screening → interviewing
  const [candidate] = await db
    .select({ status: candidates.status })
    .from(candidates)
    .where(eq(candidates.id, candidateId));
  if (candidate?.status === "screening") {
    await db
      .update(candidates)
      .set({ status: "interviewing" })
      .where(eq(candidates.id, candidateId));
  }

  revalidatePath(`/candidates/${candidateId}`);
  redirect(`/candidates/${candidateId}`);
}

/**
 * 标记面试为"已完成"
 */
export async function markInterviewCompleted(formData: FormData) {
  const interviewId = parseInt(formData.get("interviewId") as string);
  const candidateId = parseInt(formData.get("candidateId") as string);

  await db
    .update(interviews)
    .set({ status: "completed" })
    .where(eq(interviews.id, interviewId));

  revalidatePath(`/candidates/${candidateId}`);
}

/**
 * 取消面试 + 自动退回
 * 取消后如果该候选人没有任何 scheduled/completed 的面试 → interviewing 退回 screening
 */
export async function cancelInterview(formData: FormData) {
  const interviewId = parseInt(formData.get("interviewId") as string);
  const candidateId = parseInt(formData.get("candidateId") as string);

  // 取消面试
  await db
    .update(interviews)
    .set({ status: "cancelled" })
    .where(eq(interviews.id, interviewId));

  // ★ 自动退回：如果没有活跃面试，interviewing → screening
  const [candidate] = await db
    .select({ status: candidates.status })
    .from(candidates)
    .where(eq(candidates.id, candidateId));

  if (candidate?.status === "interviewing") {
    // 检查是否还有 scheduled 或 completed 的面试
    const activeInterviews = await db
      .select()
      .from(interviews)
      .where(
        or(
          eq(interviews.status, "scheduled"),
          eq(interviews.status, "completed")
        )
      );

    const hasActiveForCandidate = activeInterviews.some(
      (iv: typeof interviews.$inferSelect) => iv.candidateId === candidateId
    );

    if (!hasActiveForCandidate) {
      await db
        .update(candidates)
        .set({ status: "screening" })
        .where(eq(candidates.id, candidateId));
    }
  }

  revalidatePath(`/candidates/${candidateId}`);
}
