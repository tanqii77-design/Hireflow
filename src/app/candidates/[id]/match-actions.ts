"use server";
/**
 * 候选人 AI 匹配 Server Actions — 保存简历、执行匹配
 */
import { revalidatePath } from "next/cache";
import db from "@/db";
import { candidates, matches, jobs } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { evaluateMatch } from "@/lib/llm";

/**
 * 保存/更新候选人简历文本
 */
export async function saveResume(formData: FormData) {
  const candidateId = parseInt(formData.get("candidateId") as string);
  const resumeText = (formData.get("resumeText") as string) || "";
  const pdfFile = formData.get("pdfFile") as File | null;

  // 构建更新对象
  const updates: Record<string, unknown> = {
    resumeText: resumeText.trim(),
  };

  // 有 PDF 文件 → 读二进制 + 存文件名
  if (pdfFile && pdfFile instanceof File && pdfFile.size > 0) {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    updates.resumeFile = buffer;
    updates.resumeFileName = pdfFile.name;
  }

  // 如果传了空的 resumeText 且没有 PDF → 清除简历（删除操作走 resume-card 里的单独逻辑）
  await db
    .update(candidates)
    .set(updates)
    .where(eq(candidates.id, candidateId));

  revalidatePath(`/candidates/${candidateId}`);
}

/**
 * 执行单个候选人与单个职位的 AI 匹配
 */
export async function matchCandidate(formData: FormData) {
  const candidateId = parseInt(formData.get("candidateId") as string);
  const jobId = parseInt(formData.get("jobId") as string);

  // 读取候选人简历
  const [candidate] = await db
    .select({ resumeText: candidates.resumeText })
    .from(candidates)
    .where(eq(candidates.id, candidateId));

  if (!candidate?.resumeText?.trim()) {
    throw new Error("请先添加候选人简历");
  }

  // 读取职位 JD
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
  if (!job) throw new Error("职位不存在");

  // 调用 LLM
  let result;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      result = await evaluateMatch(
        candidate.resumeText,
        job.title,
        job.description || ""
      );
      break;
    } catch (e) {
      if (attempt === 1) throw e;
    }
  }

  if (!result) throw new Error("AI 分析失败");

  // upsert: 同一 candidateId+jobId 已存在则更新，否则插入
  const [existing] = await db
    .select()
    .from(matches)
    .where(
      and(eq(matches.candidateId, candidateId), eq(matches.jobId, jobId))
    );

  if (existing) {
    await db
      .update(matches)
      .set({
        score: result.score,
        strengths: JSON.stringify(result.strengths),
        concerns: JSON.stringify(result.concerns),
        recommendation: result.recommendation,
      })
      .where(eq(matches.id, existing.id));
  } else {
    await db.insert(matches).values({
      candidateId,
      jobId,
      score: result.score,
      strengths: JSON.stringify(result.strengths),
      concerns: JSON.stringify(result.concerns),
      recommendation: result.recommendation,
    });
  }

  revalidatePath(`/candidates/${candidateId}`);
}
