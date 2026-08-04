/**
 * POST /api/match — AI 简历适配度分析
 *
 * 接收 { resume, jobIds }，对每个职位调用一次 LLM，
 * 返回适配度评分、优势、担忧点、建议。
 */
import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { jobs } from "@/db/schema";
import { inArray } from "drizzle-orm";

const LLM_API_KEY = process.env.LLM_API_KEY || "";
const LLM_BASE_URL =
  process.env.LLM_BASE_URL || "https://api.deepseek.com";
const LLM_MODEL = process.env.LLM_MODEL || "deepseek-chat";

const SYSTEM_PROMPT = `你是一位资深 HR 面试官。根据候选人简历和职位 JD，评估适配度。

返回严格 JSON，不要 markdown、不要解释：
{
  "score": 0-100,
  "strengths": ["优势1", "优势2"],
  "concerns": ["担忧1", "担忧2"],
  "recommendation": "推荐面试" | "谨慎考虑" | "不推荐"
}

评分标准：80+ 高度匹配 / 60-79 可面试 / 40-59 有差距 / 40- 不推荐。
每个 strengths/concerns 数组至少 1 条、最多 3 条。`;

async function callLLM(
  resume: string,
  jobTitle: string,
  jobDescription: string
): Promise<{
  score: number;
  strengths: string[];
  concerns: string[];
  recommendation: string;
}> {
  const userMsg = `【候选人简历】\n${resume}\n\n【职位名称】${jobTitle}\n【职位 JD】${jobDescription || "无 JD 描述"}`;

  const res = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMsg },
      ],
      temperature: 0.3,
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM API 错误 ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";

  // 尝试解析 JSON（可能被 markdown 包裹）
  let jsonStr = content.trim();
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) jsonStr = jsonMatch[0];

  const parsed = JSON.parse(jsonStr);

  return {
    score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
    strengths: Array.isArray(parsed.strengths)
      ? parsed.strengths.slice(0, 3)
      : [],
    concerns: Array.isArray(parsed.concerns)
      ? parsed.concerns.slice(0, 3)
      : [],
    recommendation: ["推荐面试", "谨慎考虑", "不推荐"].includes(
      parsed.recommendation
    )
      ? parsed.recommendation
      : "谨慎考虑",
  };
}

export async function POST(request: NextRequest) {
  if (!LLM_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "未配置 LLM_API_KEY 环境变量" },
      { status: 500 }
    );
  }

  let body: { resume?: string; jobIds?: number[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "请求格式错误" },
      { status: 400 }
    );
  }

  const { resume, jobIds } = body;
  if (!resume || !resume.trim()) {
    return NextResponse.json(
      { ok: false, error: "简历内容不能为空" },
      { status: 400 }
    );
  }
  if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
    return NextResponse.json(
      { ok: false, error: "请至少选择一个职位" },
      { status: 400 }
    );
  }

  // 读对应职位
  const targetJobs = await db
    .select()
    .from(jobs)
    .where(inArray(jobs.id, jobIds as number[]));

  if (targetJobs.length === 0) {
    return NextResponse.json(
      { ok: false, error: "未找到所选职位" },
      { status: 400 }
    );
  }

  // 逐个职位调用 LLM
  const results = [];
  for (const job of targetJobs) {
    try {
      let result;
      // 重试一次
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          result = await callLLM(resume, job.title, job.description || "");
          break;
        } catch (e) {
          if (attempt === 1) throw e; // 第二次也失败就抛出
        }
      }
      results.push({
        jobId: job.id,
        jobTitle: job.title,
        ...result!,
      });
    } catch (e: any) {
      results.push({
        jobId: job.id,
        jobTitle: job.title,
        error: e.message || "分析失败",
        score: 0,
        strengths: [],
        concerns: [],
        recommendation: "",
      });
    }
  }

  return NextResponse.json({ ok: true, results });
}
