/**
 * 单个职位 API — GET 详情 & PUT 更新状态
 *
 * GET  /api/jobs/[id]       返回职位详情 + 该职位下的候选人
 * PUT  /api/jobs/[id]       更新职位（切换开/关状态、修改标题等）
 */
import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { jobs, candidates } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET — 获取职位详情（含关联的候选人列表）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const jobId = parseInt(id);

  if (isNaN(jobId)) {
    return NextResponse.json({ ok: false, error: "无效的职位 ID" }, { status: 400 });
  }

  // 查职位
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));

  if (!job) {
    return NextResponse.json({ ok: false, error: "职位不存在" }, { status: 404 });
  }

  // 查该职位下的所有候选人（后续第 4 天会用到）
  const jobCandidates = await db
    .select()
    .from(candidates)
    .where(eq(candidates.jobId, jobId));

  return NextResponse.json({
    ok: true,
    data: { ...job, candidates: jobCandidates },
  });
}

// PUT — 更新职位（切换状态或修改信息）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const jobId = parseInt(id);
  const body = await request.json();

  if (isNaN(jobId)) {
    return NextResponse.json({ ok: false, error: "无效的职位 ID" }, { status: 400 });
  }

  // 构建更新对象：只更新 body 里传了的字段
  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.status !== undefined) updates.status = body.status; // open 或 closed

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, error: "没有要更新的字段" }, { status: 400 });
  }

  const [updated] = await db
    .update(jobs)
    .set(updates)
    .where(eq(jobs.id, jobId))
    .returning();

  if (!updated) {
    return NextResponse.json({ ok: false, error: "职位不存在" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: updated });
}
