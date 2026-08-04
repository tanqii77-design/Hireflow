"use client";
/**
 * 编辑职位表单 — Client Component
 *
 * 接收 Server Component 传来的职位数据作为初始值，
 * 提交时调用 updateJob Server Action。
 */
import { updateJob } from "../../actions";
import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";

interface Props {
  job: {
    id: number;
    title: string;
    description: string | null;
    status: string;
  };
  error?: string;
}

export function EditJobForm({ job, error }: Props) {
  return (
    <div className="max-w-lg mx-auto">
      <Breadcrumb
        items={[
          { label: "看板", href: "/" },
          { label: "职位", href: "/jobs" },
          { label: "编辑职位" },
        ]}
      />

      <h1 className="text-2xl font-bold mb-6">编辑职位</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      <form
        action={updateJob}
        className="neu-card p-6 space-y-5"
      >
        {/* 隐藏字段：告诉 Server Action 编辑的是哪个职位 */}
        <input type="hidden" name="id" value={job.id} />

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
            defaultValue={job.title}
            className="neu-inset w-full px-3 py-2 text-sm transition-shadow"
            required
            autoFocus
          />
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
            defaultValue={job.description || ""}
            className="neu-inset w-full px-3 py-2 text-sm transition-shadow resize-none"
          />
        </div>

        {/* 状态切换 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            状态
          </label>
          <select
            name="status"
            defaultValue={job.status}
            className="neu-inset w-full px-3 py-2 text-sm"
          >
            <option value="open">招聘中</option>
            <option value="closed">已关闭</option>
          </select>
        </div>

        {/* 按钮组 */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="neu-btn-primary bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            保存修改
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
