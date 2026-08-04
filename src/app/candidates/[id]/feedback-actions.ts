"use server";
/**
 * 反馈 Server Actions — 创建/更新反馈
 * 一个面试只允许一条反馈：已存在则更新，不存在则创建（upsert）
 */
import { revalidatePath } from "next/cache";
import db from "@/db";
import { feedback, interviews, candidates, jobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { assessInterview } from "@/lib/llm";

/**
 * 提交反馈（不存在则创建，存在则更新）
 */
export async function submitFeedback(formData: FormData) {
  const interviewId = parseInt(formData.get("interviewId") as string);
  const candidateId = parseInt(formData.get("candidateId") as string);
  const rating = parseInt(formData.get("rating") as string);
  const strengths = (formData.get("strengths") as string) || "";
  const concerns = (formData.get("concerns") as string) || "";
  const conclusion = (formData.get("conclusion") as string) || "pending";
  const submittedBy = (formData.get("submittedBy") as string) || "";

  // 校验必填
  if (!rating || rating < 1 || rating > 5) {
    // revalidate and redirect without error param for simplicity
    // The client form does its own validation
    return;
  }

  // 查是否已有反馈（upsert 逻辑）
  const [existing] = await db
    .select()
    .from(feedback)
    .where(eq(feedback.interviewId, interviewId));

  if (existing) {
    // 更新已有反馈
    await db
      .update(feedback)
      .set({
        rating,
        strengths: strengths.trim(),
        concerns: concerns.trim(),
        conclusion,
        submittedBy: submittedBy.trim(),
      })
      .where(eq(feedback.id, existing.id));
  } else {
    // 创建新反馈
    await db.insert(feedback).values({
      interviewId,
      rating,
      strengths: strengths.trim(),
      concerns: concerns.trim(),
      conclusion,
      submittedBy: submittedBy.trim(),
    });
  }

  revalidatePath(`/candidates/${candidateId}`);
}

/**
 * AI 面试评估 — 根据 TXT 面试记录生成反馈草稿
 * 返回 { rating, strengths, concerns, conclusion }，不写入数据库
 */
export async function aiAssessInterview(interviewId: number, transcript: string) {
  if (!transcript.trim()) {
    throw new Error("面试记录文本不能为空");
  }

  // 查面试信息
  const [iv] = await db.select().from(interviews).where(eq(interviews.id, interviewId));
  if (!iv) throw new Error("面试不存在");

  // 查候选人
  const [cand] = await db.select().from(candidates).where(eq(candidates.id, iv.candidateId));
  if (!cand) throw new Error("候选人不存在");

  // 查关联职位 JD
  const [job] = await db.select().from(jobs).where(eq(jobs.id, cand.jobId));
  const jobTitle = job?.title || "未知职位";
  const jobDescription = job?.description || "";

  // 调用 LLM
  return assessInterview(jobTitle, jobDescription, transcript);
}
