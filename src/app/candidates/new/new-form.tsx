"use client";
/**
 * 新建候选人表单 — Client Component
 */
import { createCandidate } from "../actions";
import Link from "next/link";

interface Job {
  id: number;
  title: string;
}

export function NewCandidateForm({
  error,
  jobs,
}: {
  error?: string;
  jobs: Job[];
}) {
  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link
          href="/candidates"
          className="text-sm text-gray-400 hover:text-indigo-600 transition-colors"
        >
          ← 返回候选人列表
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">添加候选人</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
          ⚠️ {error}
        </div>
      )}

      {jobs.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-3 mb-6 text-sm">
          ⚠️ 当前没有开放中的职位，请先
          <Link href="/jobs/new" className="underline mx-1">
            创建职位
          </Link>
          ，再添加候选人。
        </div>
      )}

      <form
        action={createCandidate}
        className="bg-white rounded-xl border border-gray-200 p-6 space-y-5"
      >
        {/* 姓名 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            姓名 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="name"
            placeholder="例：张三"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
            autoFocus
          />
        </div>

        {/* 电话 + 邮箱 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              电话
            </label>
            <input
              type="text"
              name="phone"
              placeholder="例：13800138000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              邮箱
            </label>
            <input
              type="email"
              name="email"
              placeholder="例：zhangsan@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 应聘职位 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            应聘职位 <span className="text-red-400">*</span>
          </label>
          <select
            name="jobId"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          >
            <option value="">请选择职位</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>

        {/* 来源 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            来源
          </label>
          <select
            name="source"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">请选择</option>
            <option value="BOSS直聘">BOSS直聘</option>
            <option value="猎聘">猎聘</option>
            <option value="内推">内推</option>
            <option value="官网">官网</option>
            <option value="校招">校招</option>
            <option value="其他">其他</option>
          </select>
        </div>

        {/* 按钮 */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            添加候选人
          </button>
          <Link
            href="/candidates"
            className="px-6 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            取消
          </Link>
        </div>
      </form>
    </div>
  );
}
