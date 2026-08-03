/**
 * 首页 — 汇总看板（MVP 核心页面）
 *
 * 当前为第 1 天占位页面。完整看板在第 7 天实现，
 * 届时会展示：统计卡片 + 候选人进度总览 + 待反馈提醒。
 */
export default function HomePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📊 汇总看板</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "开放职位",
            value: "—",
            color: "bg-indigo-50 text-indigo-700",
          },
          {
            label: "面试中",
            value: "—",
            color: "bg-amber-50 text-amber-700",
          },
          {
            label: "待反馈",
            value: "—",
            color: "bg-red-50 text-red-700",
          },
          {
            label: "本月入职",
            value: "—",
            color: "bg-green-50 text-green-700",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`${stat.color} rounded-xl p-4 text-center shadow-sm`}
          >
            <div className="text-3xl font-bold">{stat.value}</div>
            <div className="text-sm mt-1 opacity-80">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 占位提示 */}
      <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center text-gray-400">
        <p className="text-lg mb-2">🚧 看板建设中</p>
        <p className="text-sm">
          完整看板将在第 7 天实现，届时将展示所有候选人的进度和反馈收集情况。
        </p>
      </div>
    </div>
  );
}
