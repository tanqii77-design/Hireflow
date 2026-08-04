"use client";
/**
 * 安排面试表单 — 弹窗版本
 *
 * 点击按钮 → 弹出居中模态框 → 填写 → 提交后自动关闭
 */
import { useState } from "react";
import { Modal } from "@/components/modal";
import { scheduleInterview } from "./interview-actions";

export function ScheduleForm({ candidateId }: { candidateId: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 触发按钮 */}
      <button
        onClick={() => setOpen(true)}
        className="neu-btn-primary bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
      >
        + 安排面试
      </button>

      {/* 弹窗 */}
      <Modal open={open} onClose={() => setOpen(false)} title="安排面试">
        <form
          action={scheduleInterview}
          onSubmit={() => setOpen(false)}
          className="space-y-4"
        >
          <input type="hidden" name="candidateId" value={candidateId} />

          {/* 面试官（必填） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              面试官 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="interviewer"
              placeholder="例：张经理"
              className="neu-inset w-full px-3 py-2 text-sm"
              required
              autoFocus
            />
          </div>

          {/* 面试类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              面试类型
            </label>
            <select
              name="interviewType"
              className="neu-inset w-full px-3 py-2 text-sm"
            >
              <option value="video">视频面试</option>
              <option value="phone">电话面试</option>
              <option value="onsite">现场面试</option>
            </select>
          </div>

          {/* 面试时间 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              面试时间
            </label>
            <input
              type="datetime-local"
              name="scheduledAt"
              className="neu-inset w-full px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-600 mt-1">选填，不填表示时间待定</p>
          </div>

          {/* 按钮组 */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              确认安排
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
