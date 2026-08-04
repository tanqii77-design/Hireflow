"use server";
/**
 * 面试 Server Actions — 安排、标记完成、取消
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import db from "@/db";
import { interviews } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

/**
 * 安排新面试
 * 轮次自动计算：当前已有面试数 + 1
 */
export async function scheduleInterview(formData: FormData) {
  const candidateId = parseInt(formData.get("candidateId") as string);
  const interviewer = (formData.get("interviewer") as string) || "";
  const interviewType = (formData.get("interviewType") as string) || "video";
  const scheduledAt = (formData.get("scheduledAt") as string) || "";

  // 校验：面试官必填
  if (!interviewer.trim()) {
    redirect(
      `/candidates/${candidateId}?error=面试官姓名不能为空`
    );
  }

  // 计算轮次：查当前候选人的面试数 + 1
  const existing = await db
    .select()
    .from(interviews)
    .where(eq(interviews.candidateId, candidateId))
    .orderBy(asc(interviews.roundNumber));

  const nextRound =
    existing.length > 0 ? existing[existing.length - 1].roundNumber + 1 : 1;

  await db.insert(interviews).values({
    candidateId,
    roundNumber: nextRound,
    interviewer: interviewer.trim(),
    interviewType,
    scheduledAt: scheduledAt || null,
  });

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
 * 取消面试
 */
export async function cancelInterview(formData: FormData) {
  const interviewId = parseInt(formData.get("interviewId") as string);
  const candidateId = parseInt(formData.get("candidateId") as string);

  await db
    .update(interviews)
    .set({ status: "cancelled" })
    .where(eq(interviews.id, interviewId));

  revalidatePath(`/candidates/${candidateId}`);
}
