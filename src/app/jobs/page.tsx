/**
 * 职位列表页 — 占位
 * 完整 CRUD 在第 2 天实现
 */
export default function JobsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">💼 职位管理</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          + 新建职位
        </button>
      </div>
      <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center text-gray-400">
        <p className="text-lg mb-2">🚧 职位管理建设中</p>
        <p className="text-sm">完整的职位 CRUD 将在第 2 天实现。</p>
      </div>
    </div>
  );
}
