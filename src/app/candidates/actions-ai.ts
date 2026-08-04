"use server";
/**
 * AI 智能建档 Server Action
 * 上传简历 → AI 分析 → 创建候选人 + 保存 PDF + 批量匹配
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import db from "@/db";
import { candidates, matches, jobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { evaluateMatch, extractCandidateInfo } from "@/lib/llm";

export async function createCandidateWithAI(formData: FormData) {
  const name = (formData.get("name") as string) || "";
  const phone = (formData.get("phone") as string) || "";
  const email = (formData.get("email") as string) || "";
  const jobId = parseInt(formData.get("jobId") as string);
  const source = (formData.get("source") as string) || "";
  const resumeText = (formData.get("resumeText") as string) || "";
  const pdfFile = formData.get("pdfFile") as File | null;
  const matchResultsJson = (formData.get("matchResults") as string) || "[]";

  if (!name.trim()) {
    redirect("/candidates/new?error=姓名不能为空");
  }
  if (isNaN(jobId)) {
    redirect("/candidates/new?error=请选择应聘职位");
  }

  // 构建更新对象
  const updates: Record<string, unknown> = {
    name: name.trim(),
    phone: phone.trim(),
    email: email.trim(),
    jobId,
    source: source.trim() || "AI 智能建档",
    resumeText: resumeText.trim(),
  };

  // PDF 文件存储
  if (pdfFile && pdfFile instanceof File && pdfFile.size > 0) {
    const arrayBuffer = await pdfFile.arrayBuffer();
    updates.resumeFile = Buffer.from(arrayBuffer);
    updates.resumeFileName = pdfFile.name;
  }

  const [newCandidate] = await db
    .insert(candidates)
    .values(updates as any)
    .returning();

  // 批量写入匹配结果
  let matchResults: any[] = [];
  try {
    matchResults = JSON.parse(matchResultsJson);
  } catch {}

  for (const mr of matchResults) {
    await db.insert(matches).values({
      candidateId: newCandidate.id,
      jobId: mr.jobId,
      score: mr.score,
      strengths: JSON.stringify(mr.strengths || []),
      concerns: JSON.stringify(mr.concerns || []),
      recommendation: mr.recommendation || "谨慎考虑",
    });
  }

  revalidatePath("/candidates");
  redirect(`/candidates/${newCandidate.id}`);
}

/**
 * AI 分析简历 — 抽取信息 + 匹配所有招聘中职位
 * 返回 { info, matches } 供客户端展示
 */
export async function analyzeResume(resume: string) {
  if (!resume.trim()) throw new Error("简历内容不能为空");

  const openJobs = await db.select().from(jobs).where(eq(jobs.status, "open"));
  if (openJobs.length === 0) throw new Error("没有招聘中的职位");

  const [info, matchResults] = await Promise.all([
    extractCandidateInfo(resume),
    Promise.all(
      openJobs.map(async (job: typeof jobs.$inferSelect) => {
        const result = await evaluateMatch(resume, job.title, job.description || "");
        return { ...result, jobId: job.id, jobTitle: job.title };
      })
    ),
  ]);

  return { info, matches: matchResults };
}
