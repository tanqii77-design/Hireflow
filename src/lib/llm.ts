/**
 * 共享 LLM 调用模块
 * 被 /api/match 和 candidate match-actions 共用
 */

const LLM_API_KEY = process.env.LLM_API_KEY || "";
const LLM_BASE_URL = process.env.LLM_BASE_URL || "https://api.deepseek.com";
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

export interface MatchResult {
  score: number;
  strengths: string[];
  concerns: string[];
  recommendation: string;
}

/**
 * 调用 LLM 评估候选人与职位的适配度
 */
export async function evaluateMatch(
  resume: string,
  jobTitle: string,
  jobDescription: string
): Promise<MatchResult> {
  if (!LLM_API_KEY) {
    throw new Error("未配置 LLM_API_KEY 环境变量");
  }

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

  // 解析 JSON（可能被 markdown 包裹）
  let jsonStr = content.trim();
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) jsonStr = jsonMatch[0];

  const parsed = JSON.parse(jsonStr);

  return {
    score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : [],
    concerns: Array.isArray(parsed.concerns) ? parsed.concerns.slice(0, 3) : [],
    recommendation: ["推荐面试", "谨慎考虑", "不推荐"].includes(parsed.recommendation)
      ? parsed.recommendation
      : "谨慎考虑",
  };
}

// ===== 面试评估 prompt =====

const INTERVIEW_PROMPT = `你是一位资深 HR 面试官。根据职位 JD 和面试记录，给出结构化的面试反馈草稿。

返回严格 JSON（不要 markdown、不要解释）：
{
  "rating": 1-5,
  "strengths": "候选人的优势、亮点（用适合填入反馈表单的自然语言表述，2-4句话）",
  "concerns": "需要关注的问题、风险点（用适合填入反馈表单的自然语言表述，2-4句话）",
  "conclusion": "pass" | "fail" | "pending"
}

评分标准：5=强烈推荐 / 4=推荐 / 3=待定 / 2=有顾虑 / 1=不推荐。
请基于面试记录中的实际表现给出客观评价。`;

export interface InterviewAssessment {
  rating: number;
  strengths: string;
  concerns: string;
  conclusion: string;
}

/**
 * AI 面试评估 — 根据面试记录文本生成反馈草稿
 */
export async function assessInterview(
  jobTitle: string,
  jobDescription: string,
  transcript: string
): Promise<InterviewAssessment> {
  if (!LLM_API_KEY) {
    throw new Error("未配置 LLM_API_KEY 环境变量");
  }

  const userMsg = `【职位名称】${jobTitle}\n【职位 JD】${jobDescription || "无 JD 描述"}\n\n【面试记录】\n${transcript}`;

  const res = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [
        { role: "system", content: INTERVIEW_PROMPT },
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

  let jsonStr = content.trim();
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) jsonStr = jsonMatch[0];

  const parsed = JSON.parse(jsonStr);

  return {
    rating: Math.max(1, Math.min(5, Number(parsed.rating) || 3)),
    strengths: typeof parsed.strengths === "string" ? parsed.strengths : "",
    concerns: typeof parsed.concerns === "string" ? parsed.concerns : "",
    conclusion: ["pass", "fail", "pending"].includes(parsed.conclusion)
      ? parsed.conclusion
      : "pending",
  };
}
