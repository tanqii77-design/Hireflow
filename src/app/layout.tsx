/**
 * 根布局 — 所有页面共享的外壳
 * 包含：导航栏 + 页面内容区域
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HireFlow — 面试管理工具",
  description: "管理面试安排与反馈收集的开源工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900 min-h-screen`}
      >
        {/* 顶部导航栏 */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            {/* 品牌名 */}
            <Link
              href="/"
              className="font-bold text-lg text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              HireFlow
            </Link>

            {/* 导航链接 */}
            <div className="flex items-center gap-6 text-sm">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                看板
              </Link>
              <Link
                href="/jobs"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                职位
              </Link>
              <Link
                href="/candidates"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                候选人
              </Link>
            </div>
          </div>
        </nav>

        {/* 页面内容 */}
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
