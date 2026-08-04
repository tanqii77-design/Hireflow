"use client";
/**
 * 新建候选人 — 两步流程（Step 1: 上传 + AI 分析 → Step 2: 核对 + 创建）
 */
import { useState } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { PdfUploader } from "@/components/pdf-uploader";
import { CheckCircle2, ThumbsUp } from "lucide-react";
import { createCandidateWithAI, analyzeResume } from "../actions-ai";
import { createCandidate } from "../actions";
import type { CandidateInfo, MatchResult } from "@/lib/llm";

interface Job {
  id: number;
  title: string;
  description: string | null;
}

interface Props {
  error?: string;
  jobs: Job[];
  hasApiKey: boolean;
}

interface AnalysisResult {
  info: CandidateInfo;
  matches: (MatchResult & { jobId: number; jobTitle: string })[];
}

export function NewCandidateFlow({ error, jobs, hasApiKey }: Props) {
  // Step 1 state
  const [resume, setResume] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState("");

  // Step 2 state
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [summary, setSummary] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<number>(jobs[0]?.id || 0);
  const [source, setSource] = useState("AI 自动建档");
  const [creating, setCreating] = useState(false);

  const [showManual, setShowManual] = useState(false);

  // Step 1 → AI 分析
  async function handleAnalyze() {
    if (!resume.trim()) { setAiError("请输入简历内容"); return; }
    setAnalyzing(true);
    setAiError("");
    try {
      const result = await analyzeResume(resume);
      setAnalysis(result);

      // 预填表单
      setName(result.info.name);
      setPhone(result.info.phone);
      setEmail(result.info.email);
      setSummary(result.info.summary);

      // 默认选评分最高的职位
      if (result.matches.length > 0) {
        const best = result.matches.reduce((a, b) => (a.score > b.score ? a : b));
        setSelectedJobId(best.jobId);
      }
    } catch (e: any) {
      setAiError(e.message || "AI 分析失败");
    } finally {
      setAnalyzing(false);
    }
  }

  // Step 2 → 创建候选人
  async function handleCreate() {
    setCreating(true);
    try {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("phone", phone);
      formData.set("email", email);
      formData.set("jobId", String(selectedJobId));
      formData.set("source", source);
      formData.set("resumeText", resume);
      if (pdfFile) formData.set("pdfFile", pdfFile);
      formData.set("matchResults", JSON.stringify(analysis?.matches || []));
      await createCandidateWithAI(formData);
      // redirect happens server-side
    } catch {
      setAiError("创建失败，请重试");
      setCreating(false);
    }
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "看板", href: "/" },
          { label: "候选人", href: "/candidates" },
          { label: analysis ? "核对信息" : "新建候选人" },
        ]}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">{error}</div>
      )}

      {/* ===== 未分析状态：Step 1 ===== */}
      {!analysis && !showManual && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">新建候选人</h1>
            {hasApiKey && (
              <button onClick={() => setShowManual(true)} className="text-sm text-gray-600 hover:text-gray-600">
                手动添加 →
              </button>
            )}
          </div>

          {hasApiKey && jobs.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 简历上传 */}
              <div className="neu-card p-6">
                <h2 className="font-semibold text-gray-700 mb-4">上传简历</h2>
                <div className="mb-4">
                  <PdfUploader
                    onTextExtracted={(t) => setResume(t)}
                    onFileChange={(f) => setPdfFile(f)}
                  />
                </div>
                <textarea
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                  rows={14}
                  placeholder="PDF 提取的文字会出现在这里，也可以手动粘贴简历..."
                  className="neu-inset w-full px-3 py-2 text-sm resize-none"
                />
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing || !resume.trim()}
                  className="neu-btn-primary bg-indigo-600 text-white w-full py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {analyzing ? "正在分析…" : "开始分析"}
                </button>
                {aiError && <p className="text-xs text-red-500 mt-2">{aiError}</p>}
              </div>

              {/* 说明 */}
              <div className="neu-card p-6 flex flex-col justify-center text-center text-gray-600">
                <p className="text-5xl mb-4"></p>
                <p className="text-lg font-medium text-gray-600 mb-2">AI 自动建档</p>
                <p className="text-sm">上传简历后，AI 将自动：</p>
                <ul className="text-sm mt-2 space-y-1">
                  <li><CheckCircle2 className="w-4 h-4 inline-block text-green-500 mr-1" aria-hidden="true" />抽取姓名、电话、邮箱</li>
                  <li><CheckCircle2 className="w-4 h-4 inline-block text-green-500 mr-1" aria-hidden="true" />匹配所有招聘中职位</li>
                  <li><CheckCircle2 className="w-4 h-4 inline-block text-green-500 mr-1" aria-hidden="true" />生成适配度分析</li>
                </ul>
                <p className="text-xs text-gray-600 mt-4">核对后创建候选人</p>
              </div>
            </div>
          ) : (
            <div className="neu-card p-12 text-center text-gray-600">
              {!hasApiKey && (
                <>
                  <p className="text-lg mb-2">未配置 AI API Key</p>
                  <button onClick={() => setShowManual(true)} className="text-indigo-600 text-sm mt-2">
                    手动添加候选人 →
                  </button>
                </>
              )}
              {jobs.length === 0 && (
                <p>请先创建职位后再添加候选人</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== 手动模式 ===== */}
      {showManual && !analysis && (
        <ManualForm jobs={jobs} error={error} />
      )}

      {/* ===== Step 2：核对 + 创建 ===== */}
      {analysis && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">核对信息并创建</h1>
            <button onClick={() => setAnalysis(null)} className="text-sm text-gray-600 hover:text-gray-600">
              ← 返回修改简历
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左：基本信息表单 */}
            <div className="neu-card p-6 space-y-4">
              <h3 className="font-semibold text-gray-700"> 基本信息</h3>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="姓名 *"
                className="neu-inset w-full px-3 py-2 text-sm"
                required
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="电话"
                className="neu-inset w-full px-3 py-2 text-sm"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="邮箱"
                className="neu-inset w-full px-3 py-2 text-sm"
              />
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="简历亮点"
                rows={3}
                className="neu-inset w-full px-3 py-2 text-sm resize-none"
              />
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(parseInt(e.target.value))}
                className="neu-inset w-full px-3 py-2 text-sm"
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="来源"
                className="neu-inset w-full px-3 py-2 text-sm"
              />

              <button
                onClick={handleCreate}
                disabled={creating || !name.trim()}
                className="neu-btn-primary bg-indigo-600 text-white w-full py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {creating ? "正在创建…" : "确认创建"}
              </button>
            </div>

            {/* 中+右：匹配结果 */}
            <div className="lg:col-span-2 neu-card p-6">
              <h3 className="font-semibold text-gray-700 mb-4">
                AI 匹配结果（{analysis.matches.length} 个职位）
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
                {analysis.matches.map((m) => (
                  <div
                    key={m.jobId}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedJobId === m.jobId
                        ? "border-indigo-400 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedJobId(m.jobId)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{m.jobTitle}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs border ${
                          m.recommendation === "推荐面试"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : m.recommendation === "谨慎考虑"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {m.recommendation}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-indigo-600">{m.score}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${m.score >= 75 ? "bg-green-500" : m.score >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${m.score}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 space-y-0.5">
                      {m.strengths[0] && <div><ThumbsUp className="w-4 h-4 inline-block mr-1" aria-hidden="true" />{m.strengths[0]}</div>}
                      {m.concerns[0] && <div>{m.concerns[0]}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** 手动添加表单（AI 不可用时） */
function ManualForm({ jobs, error }: { jobs: Job[]; error?: string }) {
  return (
    <div className="max-w-lg mx-auto">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">{error}</div>
      )}
      <form action={createCandidate} className="neu-card p-6 space-y-5">
        <h2 className="font-semibold text-gray-700">手动添加候选人</h2>
        <input type="text" name="name" placeholder="姓名 *" className="neu-inset w-full px-3 py-2 text-sm" required />
        <input type="text" name="phone" placeholder="电话" className="neu-inset w-full px-3 py-2 text-sm" />
        <input type="email" name="email" placeholder="邮箱" className="neu-inset w-full px-3 py-2 text-sm" />
        <select name="jobId" className="neu-inset w-full px-3 py-2 text-sm">
          <option value="">请选择职位</option>
          {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        <select name="source" className="neu-inset w-full px-3 py-2 text-sm">
          <option value="">来源</option>
          <option>BOSS直聘</option><option>猎聘</option><option>内推</option><option>官网</option><option>其他</option>
        </select>
        <button type="submit" className="neu-btn-primary bg-indigo-600 text-white w-full py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700">
          添加候选人
        </button>
      </form>
    </div>
  );
}
