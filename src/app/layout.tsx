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
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-gray-900 min-h-screen`}
      >
        {/* 顶部导航栏 */}
        <div className="sticky top-0 z-50 py-3">
          <nav className="neu-card mx-auto max-w-6xl px-4 h-14 flex items-center justify-between rounded-xl">
            <Link
              href="/"
              className="font-bold text-lg text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              HireFlow
            </Link>
          </nav>
        </div>

        {/* 页面内容 */}
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
