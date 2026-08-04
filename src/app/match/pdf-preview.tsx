"use client";
/**
 * PDF 预览 — 渲染 PDF 页面为图片，支持翻页
 */
import { useState, useEffect, useCallback } from "react";

interface Props {
  file: File | null;
  textPreview?: string;
}

export function PdfPreview({ file, textPreview }: Props) {
  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const renderPdf = useCallback(async (f: File) => {
    setLoading(true);
    setError("");
    setPages([]);
    setCurrentPage(0);

    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const arrayBuffer = await f.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

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
    } catch (e: any) {
      setError("无法渲染 PDF 预览");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (file) {
      renderPdf(file);
    } else {
      setPages([]);
      setCurrentPage(0);
    }
  }, [file, renderPdf]);

  // 文本预览（无 PDF 时）
  if (!file) {
    if (textPreview && textPreview.trim()) {
      return (
        <div className="bg-gray-50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
          <div className="text-xs text-gray-400 mb-2">文本预览</div>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
            {textPreview}
          </pre>
        </div>
      );
    }
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-400">
        <p className="text-2xl mb-2">📄</p>
        <p className="text-sm">上传 PDF 或粘贴简历后预览</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center text-indigo-600">
        <span className="animate-spin inline-block mr-2">⏳</span>
        正在渲染预览…
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-400">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (pages.length === 0) return null;

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400">
          PDF 预览 · {pages.length} 页
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="px-3 py-1 text-xs rounded border border-gray-300 hover:bg-white disabled:opacity-30 transition-colors"
          >
            ← 上一页
          </button>
          <span className="text-xs text-gray-500">
            {currentPage + 1} / {pages.length}
          </span>
          <button
            onClick={() =>
              setCurrentPage((p) => Math.min(pages.length - 1, p + 1))
            }
            disabled={currentPage === pages.length - 1}
            className="px-3 py-1 text-xs rounded border border-gray-300 hover:bg-white disabled:opacity-30 transition-colors"
          >
            下一页 →
          </button>
        </div>
      </div>
      <div className="flex justify-center bg-white rounded border border-gray-200 overflow-auto">
        <img
          src={pages[currentPage]}
          alt={`第 ${currentPage + 1} 页`}
          className="max-w-full h-auto"
        />
      </div>
    </div>
  );
}
