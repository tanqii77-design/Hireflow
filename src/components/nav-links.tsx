"use client";
/**
 * 导航链接 — Client Component
 *
 * 需要用 usePathname() 获取当前路径来高亮当前页，
 * 因此必须标记 "use client"。
 */
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "看板", icon: "📊" },
  { href: "/jobs", label: "职位", icon: "💼" },
  { href: "/candidates", label: "候选人", icon: "👥" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1">
      {links.map((link) => {
        // 精确匹配或子路径匹配（/jobs 和 /jobs/new 都算在"职位"下）
        const isActive =
          link.href === "/"
            ? pathname === "/"
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="text-base">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
