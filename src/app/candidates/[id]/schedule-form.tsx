"use client";
/**
 * 安排面试表单 — Client Component
 *
 * 点击「安排面试」→ 展开表单 → 填写 → 提交 → scheduleInterview Server Action
 */
import { useState } from "react";
import { scheduleInterview } from "./interview-actions";

export function ScheduleForm({ candidateId }: { candidateId: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          + 安排面试
        </button>
      ) : (
        <form
          action={scheduleInterview}
          className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">安排新面试</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              取消
            </button>
          </div>

          <input type="hidden" name="candidateId" value={candidateId} />

          {/* 面试官（必填） */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              面试官 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="interviewer"
              placeholder="例：张经理"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
              autoFocus
            />
          </div>

          {/* 面试类型 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              面试类型
            </label>
            <select
              name="interviewType"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="video">视频面试</option>
              <option value="phone">电话面试</option>
              <option value="onsite">现场面试</option>
            </select>
          </div>

          {/* 面试时间 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              面试时间
            </label>
            <input
              type="datetime-local"
              name="scheduledAt"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-0.5">选填，不填表示时间待定</p>
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              确认安排
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
