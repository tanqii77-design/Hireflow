import Link from "next/link";

/**
 * HireFlow Logo — 粗对勾 + 圆角方形，传递"招聘决策"意象
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
        {/* 圆角方形背景 */}
        <rect x="2" y="2" width="24" height="24" rx="6" fill="#6366f1" />
        {/* 粗对勾 */}
        <path
          d="M8 14.5l3.5 3.5 8.5-8"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-bold text-lg text-indigo-600 group-hover:text-indigo-700 transition-colors">
        HireFlow
      </span>
    </Link>
  );
}
