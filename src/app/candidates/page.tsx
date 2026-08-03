/**
 * 候选人列表页 — 占位
 * 完整 CRUD 在第 4 天实现
 */
export default function CandidatesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">👥 候选人管理</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          + 添加候选人
        </button>
      </div>
      <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center text-gray-400">
        <p className="text-lg mb-2">🚧 候选人管理建设中</p>
        <p className="text-sm">完整的候选人 CRUD 将在第 4 天实现。</p>
      </div>
    </div>
  );
}
