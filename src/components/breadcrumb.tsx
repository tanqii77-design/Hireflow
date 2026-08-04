import Link from "next/link";

/**
 * 面包屑导航
 *
 * 用法：
 * <Breadcrumb items={[
 *   { label: "看板", href: "/" },
 *   { label: "候选人", href: "/candidates" },
 *   { label: "王磊" },  // 最后一项无 href，灰色加粗
 * ]} />
 */
interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="mb-6 text-sm">
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 && <span className="text-gray-300 mx-1.5">/</span>}
          {item.href ? (
            <Link
              href={item.href}
              className="text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-400 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
