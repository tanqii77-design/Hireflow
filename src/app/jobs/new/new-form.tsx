"use client";
/**
 * 新建职位表单 — Client Component
 *
 * 提交时调用 createJob Server Action
 */
import { createJob } from "../actions";
import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";

export function NewJobForm({ error }: { error?: string }) {
  return (
    <div className="max-w-lg mx-auto">
      <Breadcrumb
        items={[
          { label: "看板", href: "/" },
          { label: "职位", href: "/jobs" },
          { label: "新建职位" },
        ]}
      />

      <h1 className="text-2xl font-bold mb-6">新建职位</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
          ⚠️ {error}
        </div>
      )}

      <form
        action={createJob}
        className="neu-card p-6 space-y-5"
      >
        {/* 职位名称 */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            职位名称 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            placeholder="例：前端开发实习生"
            className="neu-inset w-full px-3 py-2 text-sm transition-shadow"
            required
            autoFocus
          />
          <p className="text-xs text-gray-400 mt-1">
            必填，职位名称会显示在列表和候选人卡片中
          </p>
        </div>

        {/* 职位简介 */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            职位简介
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="简要描述这个职位的工作内容..."
            className="neu-inset w-full px-3 py-2 text-sm transition-shadow resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">选填，简要描述工作内容</p>
        </div>

        {/* 按钮组 */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="neu-btn-primary bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            创建职位
          </button>
          <Link
            href="/jobs"
            className="px-6 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            取消
          </Link>
        </div>
      </form>
    </div>
  );
}
