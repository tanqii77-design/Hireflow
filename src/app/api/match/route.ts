/**
 * POST /api/match — AI 简历适配度分析
 */
import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { jobs } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { evaluateMatch } from "@/lib/llm";

export async function POST(request: NextRequest) {
  if (!process.env.LLM_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "未配置 LLM_API_KEY 环境变量" },
      { status: 500 }
    );
  }

  let body: { resume?: string; jobIds?: number[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "请求格式错误" }, { status: 400 });
  }

  const { resume, jobIds } = body;
  if (!resume?.trim()) {
    return NextResponse.json({ ok: false, error: "简历内容不能为空" }, { status: 400 });
  }
  if (!jobIds?.length) {
    return NextResponse.json({ ok: false, error: "请至少选择一个职位" }, { status: 400 });
  }

  const targetJobs = await db.select().from(jobs).where(inArray(jobs.id, jobIds as number[]));
  if (targetJobs.length === 0) {
    return NextResponse.json({ ok: false, error: "未找到所选职位" }, { status: 400 });
  }

  const results = [];
  for (const job of targetJobs) {
    try {
      let result;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          result = await evaluateMatch(resume, job.title, job.description || "");
          break;
        } catch (e) {
          if (attempt === 1) throw e;
        }
      }
      results.push({ jobId: job.id, jobTitle: job.title, ...result! });
    } catch (e: any) {
      results.push({
        jobId: job.id,
        jobTitle: job.title,
        error: e.message || "分析失败",
        score: 0, strengths: [], concerns: [], recommendation: "",
      });
    }
  }

  return NextResponse.json({ ok: true, results });
}
