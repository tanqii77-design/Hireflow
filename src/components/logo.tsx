import Link from "next/link";

/**
 * HireFlow Logo — 人形 + 流程箭头极简组合
 */
export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        className="flex-shrink-0"
        role="img"
      >
        <title>HireFlow Logo</title>
        {/* 人形头部 */}
        <circle cx="14" cy="8" r="4" fill="#6366f1" />
        {/* 人形身体 */}
        <path d="M5 24c0-4.5 4-8 9-8s9 3.5 9 8" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
        {/* 对勾标记 */}
        <path d="M8 17l3 3 9-6" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-bold text-lg text-indigo-600 group-hover:text-indigo-700 transition-colors">
        HireFlow
      </span>
    </Link>
  );
}
