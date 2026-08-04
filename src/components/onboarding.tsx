import Link from "next/link";

/**
 * 4 步流程定义
 */
const STEPS = [
  { num: 1, title: "创建职位", desc: "添加正在招聘的岗位", href: "/jobs/new" },
  { num: 2, title: "添加候选人", desc: "录入候选人基本信息", href: "/candidates/new" },
  { num: 3, title: "安排面试", desc: "指定面试官和时间", href: null },
  { num: 4, title: "填写反馈", desc: "面试后提交结构化评价", href: null },
];

/**
 * 空状态新手引导 — 大卡片 + 5 步流程
 */
export function EmptyOnboarding() {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl p-8 mb-8">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          欢迎使用 HireFlow
        </h2>
        <p className="text-sm text-gray-600">
          按照下面的流程，管理面试全流程
        </p>
      </div>

      {/* 5 步流程卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {STEPS.map((step) => {
          const card = (
            <div
              key={step.num}
              className={`neu-card p-4 text-center ${
                step.href
                  ? "hover:shadow-md hover:border-indigo-200 transition-shadow"
                  : "opacity-70"
              }`}
            >
              <div className="text-xs font-bold text-indigo-600 mb-1">
                第{step.num}步
              </div>
              <div className="text-sm font-semibold text-gray-800">
                {step.title}
              </div>
              <div className="text-xs text-gray-600 mt-1">{step.desc}</div>
            </div>
          );

          return step.href ? (
            <Link key={step.num} href={step.href}>
              {card}
            </Link>
          ) : (
            card
          );
        })}
      </div>

      {/* 醒目的开始按钮 */}
      <div className="text-center">
        <Link
          href="/jobs/new"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl text-base font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          创建第一个职位 →
        </Link>
      </div>
    </div>
  );
}

/**
 * 有数据时的紧凑流程条（一行小字 + 步骤编号）
 */
export function ProcessFlow() {
  return (
    <div className="flex items-center gap-1 text-xs text-gray-600 mb-6 flex-wrap">
      <span className="mr-1">流程：</span>
      {STEPS.map((step, i) => (
        <span key={step.num} className="flex items-center gap-1">
          {step.href ? (
            <Link
              href={step.href}
              className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
            >
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">
                {step.num}
              </span>
              <span>{step.title}</span>
            </Link>
          ) : (
            <span className="flex items-center gap-1 text-gray-600">
              <span className="w-6 h-6 rounded-full bg-gray-100 text-xs font-bold flex items-center justify-center">
                {step.num}
              </span>
              <span>{step.title}</span>
            </span>
          )}
          {i < STEPS.length - 1 && <span className="text-gray-300">→</span>}
        </span>
      ))}
    </div>
  );
}
