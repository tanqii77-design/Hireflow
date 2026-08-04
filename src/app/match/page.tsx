/**
 * AI 适配度分析页 — Server Component
 */
import Link from "next/link";
import db from "@/db";
import { jobs } from "@/db/schema";
import { Breadcrumb } from "@/components/breadcrumb";
import { MatchForm } from "./match-form";

export const dynamic = "force-dynamic";

export default async function MatchPage() {
  const allJobs = await db.select().from(jobs);
  const hasApiKey = !!process.env.LLM_API_KEY;

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "看板", href: "/" },
          { label: "AI 适配度分析" },
        ]}
      />

      <h1 className="text-2xl font-bold mb-2">🤖 AI 适配度分析</h1>
      <p className="text-sm text-gray-500 mb-6">
        粘贴候选人简历，AI 自动评估与各职位的适配度
      </p>

      {!hasApiKey && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-4 mb-6 text-sm">
          ⚠️ 未配置 API Key。请在 <code className="bg-amber-100 px-1 rounded">.env.local</code>{" "}
          中设置 <code className="bg-amber-100 px-1 rounded">LLM_API_KEY</code>，
          并重启开发服务器。
        </div>
      )}

      {allJobs.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-16 text-center text-gray-400">
          <p className="text-lg mb-2">暂无职位</p>
          <p className="text-sm">
            请先
            <Link href="/jobs/new" className="text-indigo-600 mx-1">
              创建职位
            </Link>
            ，AI 需要职位的 JD 作为评估依据
          </p>
        </div>
      ) : (
        <MatchForm jobs={allJobs} hasApiKey={hasApiKey} />
      )}
    </div>
  );
}
