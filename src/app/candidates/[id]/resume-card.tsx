"use client";
/**
 * 候选人简历卡片 — 查看/编辑简历 + PDF 上传
 */
import { useState } from "react";
import { saveResume } from "./match-actions";
import { PdfUploader } from "@/components/pdf-uploader";

interface Props {
  candidateId: number;
  resumeText: string | null;
}

export function ResumeCard({ candidateId, resumeText }: Props) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(resumeText || "");

  const hasResume = !!(resumeText && resumeText.trim());

  return (
    <div>
      <h3 className="font-semibold text-gray-700 mb-3">📄 简历</h3>

      {!hasResume && !editing ? (
        <div>
          <p className="text-sm text-gray-400 mb-3">暂无简历</p>
          <div className="mb-3">
            <PdfUploader onTextExtracted={(t) => { setText(t); setEditing(true); }} />
          </div>
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            或手动输入简历 →
          </button>
        </div>
      ) : editing ? (
        <form
          action={saveResume}
          onSubmit={() => setEditing(false)}
          className="space-y-3"
        >
          <input type="hidden" name="candidateId" value={candidateId} />
          <div className="mb-2">
            <PdfUploader onTextExtracted={(t) => setText(t)} />
          </div>
          <textarea
            name="resumeText"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            placeholder="粘贴简历内容..."
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="neu-btn-primary bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              保存
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setText(resumeText || "");
              }}
              className="px-4 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      ) : (
        <div>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
            {resumeText}
          </pre>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                setEditing(true);
                setText(resumeText || "");
              }}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              编辑
            </button>
            {resumeText && (
              <form action={saveResume}>
                <input type="hidden" name="candidateId" value={candidateId} />
                <input type="hidden" name="resumeText" value="" />
                <button type="submit" className="text-sm text-gray-400 hover:text-red-600">
                  删除
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
