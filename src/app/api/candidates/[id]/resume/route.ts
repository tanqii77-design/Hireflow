/**
 * GET /api/candidates/[id]/resume — 返回 PDF 简历原件
 */
import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { candidates } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cid = parseInt(id);

  const [candidate] = await db
    .select({ resumeFile: candidates.resumeFile, resumeFileName: candidates.resumeFileName })
    .from(candidates)
    .where(eq(candidates.id, cid));

  if (!candidate?.resumeFile) {
    return NextResponse.json({ error: "无 PDF 文件" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new NextResponse(candidate.resumeFile as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${candidate.resumeFileName || "resume.pdf"}"`,
    },
  });
}
