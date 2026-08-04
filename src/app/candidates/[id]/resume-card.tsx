"use client";
/**
 * 候选人简历卡片 — 查看/编辑简历 + PDF 上传 + PDF 原件预览
 */
import { useState, useRef, useEffect } from "react";
import { saveResume } from "./match-actions";
import { PdfUploader } from "@/components/pdf-uploader";

interface Props {
  candidateId: number;
  resumeText: string | null;
  hasResumeFile?: boolean;
  resumeFileName?: string | null;
}

export function ResumeCard({
  candidateId,
  resumeText,
  hasResumeFile = false,
  resumeFileName = null,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(resumeText || "");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const hasResume = !!(resumeText && resumeText.trim());
  const pdfUrl = `/api/candidates/${candidateId}/resume`;

  return (
    <div>
      <h3 className="font-semibold text-gray-700 mb-3">简历</h3>

      {!hasResume && !hasResumeFile && !editing ? (
        <div>
          <p className="text-sm text-gray-600 mb-3">暂无简历</p>
          <div className="mb-3">
            <PdfUploader onTextExtracted={(t) => { setText(t); setEditing(true); }} onFileChange={setPdfFile} />
          </div>
          <button onClick={() => setEditing(true)} className="text-sm text-indigo-600 hover:text-indigo-700">
            或手动输入简历 →
          </button>
        </div>
      ) : editing ? (
        <form action={saveResume} onSubmit={() => setEditing(false)} className="space-y-3">
          <input type="hidden" name="candidateId" value={candidateId} />
          <input type="hidden" name="pdfFile" value="" />
          <div className="mb-2">
            <PdfUploader onTextExtracted={(t) => setText(t)} onFileChange={setPdfFile} />
          </div>
          <textarea
            name="resumeText"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            className="neu-inset w-full px-3 py-2 text-xs font-mono resize-none"
            placeholder="粘贴简历内容..."
          />
          <div className="flex gap-2">
            <button type="submit" className="neu-btn-primary bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              保存
            </button>
            <button type="button" onClick={() => { setEditing(false); setText(resumeText || ""); }} className="px-4 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
              取消
            </button>
          </div>
        </form>
      ) : (
        <div>
          {hasResumeFile && (
            <div className="mb-2">
              <button
                onClick={() => setShowPdfPreview(true)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                查看 PDF 原件{resumeFileName ? `（${resumeFileName}）` : ""}
              </button>
            </div>
          )}
          {hasResume && (
            <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
              {resumeText}
            </pre>
          )}
          <div className="flex gap-2 mt-3">
            <button onClick={() => { setEditing(true); setText(resumeText || ""); }} className="text-sm text-indigo-600 hover:text-indigo-700">
              编辑
            </button>
            {(hasResume || hasResumeFile) && (
              <form action={saveResume}>
                <input type="hidden" name="candidateId" value={candidateId} />
                <input type="hidden" name="resumeText" value="" />
                <button type="submit" className="text-sm text-gray-600 hover:text-red-600">
                  删除
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* PDF 预览模态框 */}
      {showPdfPreview && (
        <PdfPreviewModal pdfUrl={pdfUrl} onClose={() => setShowPdfPreview(false)} />
      )}
    </div>
  );
}

/** PDF 预览弹窗 — 渲染 PDF 为图片，支持翻页 */
function PdfPreviewModal({ pdfUrl, onClose }: { pdfUrl: string; onClose: () => void }) {
  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const res = await fetch(pdfUrl);
        if (!res.ok) { setError("无法加载 PDF"); setLoading(false); return; }

        const buffer = await res.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: buffer }).promise;

        const imgs: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvas, viewport }).promise;
          imgs.push(canvas.toDataURL("image/png"));
        }
        setPages(imgs);
      } catch {
        setError("PDF 加载失败");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">PDF 原件预览</h3>
          <button onClick={onClose} aria-label="关闭" className="text-gray-600 hover:text-gray-600 text-xl">×</button>
        </div>

        {loading && <p className="text-center text-gray-600 py-8"><span className="animate-spin mr-2">⏳</span>加载中…</p>}
        {error && <p className="text-center text-red-500 py-8">{error}</p>}

        {pages.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-3 text-sm">
              <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-30">← 上一页</button>
              <span className="text-gray-600">{currentPage + 1} / {pages.length}</span>
              <button onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))} disabled={currentPage === pages.length - 1} className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-30">下一页 →</button>
            </div>
            <div className="bg-gray-100 rounded-lg flex justify-center p-2">
              <img src={pages[currentPage]} alt={`第${currentPage + 1}页`} className="max-w-full h-auto rounded" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
