/**
 * 候选人列表页 — Server Component
 */
import Link from "next/link";
import db from "@/db";
import { candidates, jobs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { DeleteButton } from "./delete-button";

export const dynamic = "force-dynamic";

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: filterStatus } = await searchParams;

  // 读取候选人，关联职位名称
  let query = db.select().from(candidates).orderBy(desc(candidates.createdAt));
  // 注意：Drizzle 的 SQLite join 在 Server Component 中需要特殊处理
  // 这里用最简单的方式：先查候选人，再逐个查职位名
  const allCandidates = await query;

  // 客户端筛选状态（SQLite 不支持复杂 join，用 JS filter 更简单可靠）
  const filtered = filterStatus
    ? allCandidates.filter(
        (c: typeof candidates.$inferSelect) => c.status === filterStatus
      )
    : allCandidates;

  // 批量获取职位名
  const jobIds = [...new Set(allCandidates.map((c: typeof candidates.$inferSelect) => c.jobId))] as number[];
  const jobMap = new Map<number, string>();
  for (const jid of jobIds) {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jid));
    if (job) jobMap.set(jid, job.title);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">👥 候选人管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            {allCandidates.length > 0
              ? `共 ${allCandidates.length} 位候选人`
              : "还没有候选人"}
          </p>
        </div>
        <Link
          href="/candidates/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          + 添加候选人
        </Link>
      </div>

      {/* 状态筛选标签 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { value: "", label: "全部" },
          { value: "screening", label: "筛选中" },
          { value: "interviewing", label: "面试中" },
          { value: "passed", label: "已通过" },
          { value: "rejected", label: "已淘汰" },
          { value: "offered", label: "已发Offer" },
        ].map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/candidates?status=${f.value}` : "/candidates"}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterStatus === f.value || (!filterStatus && !f.value)
                ? "bg-indigo-100 text-indigo-700"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* 空状态 */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-16 text-center">
          <div className="text-5xl mb-4">👤</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {allCandidates.length === 0
              ? "还没有候选人"
              : "该状态下没有候选人"}
          </h3>
          <p className="text-gray-400 mb-6">
            {allCandidates.length === 0
              ? "添加第一个候选人，开始管理面试流程"
              : "换个筛选条件试试"}
          </p>
          {allCandidates.length === 0 && (
            <Link
              href="/candidates/new"
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors inline-block"
            >
              添加第一个候选人 →
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  姓名
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  应聘职位
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  来源
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">
                  状态
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c: typeof candidates.$inferSelect) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <Link
                      href={`/candidates/${c.id}`}
                      className="font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                    >
                      {c.name}
                    </Link>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {c.email || c.phone || "无联系方式"}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">
                    {jobMap.get(c.jobId) || "—"}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">
                    {c.source || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/candidates/${c.id}`}
                      className="text-sm text-gray-500 hover:text-indigo-600 px-2 py-1 transition-colors"
                    >
                      详情
                    </Link>
                    <DeleteButton candidateId={c.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * 状态标签组件
 */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    screening: { label: "筛选中", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    interviewing: { label: "面试中", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    passed: { label: "已通过", cls: "bg-green-50 text-green-700 border-green-200" },
    rejected: { label: "已淘汰", cls: "bg-red-50 text-red-700 border-red-200" },
    offered: { label: "已发Offer", cls: "bg-purple-50 text-purple-700 border-purple-200" },
    hired: { label: "已入职", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  };
  const m = map[status] || { label: status, cls: "bg-gray-100 text-gray-500 border-gray-200" };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${m.cls}`}>
      {m.label}
    </span>
  );
}
