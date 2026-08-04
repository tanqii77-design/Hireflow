/**
 * 职位 API — GET 列表 & POST 创建
 *
 * GET  /api/jobs       返回所有职位（按创建时间倒序）
 * POST /api/jobs       创建新职位 { title, description }
 */
import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { jobs } from "@/db/schema";
import { desc } from "drizzle-orm";

// GET — 获取职位列表
export async function GET() {
  // 从数据库查询所有职位，按创建时间倒序（最新的在前）
  const allJobs = await db
    .select()
    .from(jobs)
    .orderBy(desc(jobs.createdAt));

  return NextResponse.json({ ok: true, data: allJobs });
}

// POST — 创建新职位
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description } = body;

  // 校验：职位名称不能为空
  if (!title || !title.trim()) {
    return NextResponse.json(
      { ok: false, error: "职位名称不能为空" },
      { status: 400 }
    );
  }

  // 插入数据库 — Drizzle 自动生成 SQL INSERT 语句
  const [job] = await db
    .insert(jobs)
    .values({
      title: title.trim(),
      description: description?.trim() || "",
    })
    .returning(); // ← 返回刚插入的那一行数据

  return NextResponse.json({ ok: true, data: job }, { status: 201 });
}
