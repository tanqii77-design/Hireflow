"use client";
/**
 * PDF 简历上传 — 本地提取文字 + OCR 扫描件识别
 *
 * 流程：pdfjs 文本提取 → 结果空/短 → 渲染 canvas → tesseract.js OCR
 * 全程浏览器本地，文件不上传服务器。
 */
import { useState, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  onTextExtracted: (text: string) => void;
  onFileChange?: (file: File | null) => void;
}

export function PdfUploader({ onTextExtracted, onFileChange }: Props) {
  const [status, setStatus] = useState("");   // "" | "extracting" | "ocr" | "done"
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
        setError("请选择 PDF 文件");
        return;
      }

      setFileName(file.name);
      setStatus("extracting");
      setError("");
      onFileChange?.(file);

      try {
        // ===== 1. pdfjs 文本提取 =====
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const arrayBuffer = await file.arrayBuffer();
        let pdf;
        try {
          pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        } catch {
          setError("无法解析该 PDF 文件，文件可能已损坏或加密");
          setStatus("");
          return;
        }

        const texts: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items
            .map((item: any) => item.str)
            .join(" ");
          texts.push(pageText);
        }

        const fullText = texts.join("\n\n").trim();

        // ===== 2. 文本足够 → 直接返回 =====
        if (fullText.length >= 20) {
          onTextExtracted(fullText);
          setStatus("done");
          return;
        }

        // ===== 3. 文本空/短 → 进入 OCR =====
        setStatus("ocr");

        const tesseract = await import("tesseract.js");

        const ocrTexts: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);

          // 渲染页面到 canvas（2x 清晰度）
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvas, viewport }).promise;

          // OCR 识别（中文 + 英文）
          const { data } = await tesseract.recognize(canvas, "chi_sim+eng");
          if (data.text.trim()) {
            ocrTexts.push(data.text.trim());
          }
        }

        const ocrText = ocrTexts.join("\n\n").trim();

        if (ocrText.length >= 10) {
          onTextExtracted(ocrText);
          setStatus("done");
        } else {
          setError("OCR 未能识别出文字，可能是图片清晰度不足，请手动粘贴简历内容");
          setStatus("");
        }
      } catch (e: any) {
        setError("OCR 识别失败，请手动粘贴简历内容");
        setStatus("");
      }
    },
    [onTextExtracted]
  );

  const handleFile = (file: File | null) => {
    if (file) processFile(file);
  };

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
          dragging
            ? "border-indigo-400 bg-indigo-50"
            : "border-gray-300 hover:border-indigo-300"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
        />

        {status === "extracting" ? (
          <div className="flex items-center justify-center gap-2 text-indigo-600 py-2">
            <Loader2 className="animate-spin w-4 h-4 inline" aria-hidden="true" />
            <span className="text-sm">正在提取简历文字…</span>
          </div>
        ) : status === "ocr" ? (
          <div className="flex items-center justify-center gap-2 text-indigo-600 py-2">
            <Loader2 className="animate-spin w-4 h-4 inline" aria-hidden="true" />
            <span className="text-sm">
              PDF 没有文字层，正在 OCR 识别（首次需下载语言包约 10MB）…
            </span>
          </div>
        ) : fileName ? (
          <div className="text-sm text-gray-600 py-2">
             <span className="font-medium">{fileName}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFileName("");
                setStatus("");
              }}
              className="ml-2 text-gray-600 hover:text-gray-600 text-xs"
            >
              移除
            </button>
          </div>
        ) : (
          <div className="py-2">
            <span className="text-indigo-600 text-sm font-medium">
              上传 PDF 简历
            </span>
            <span className="text-gray-600 text-sm"> 或拖拽到此处</span>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-amber-600 mt-2">{error}</p>
      )}
    </div>
  );
}
