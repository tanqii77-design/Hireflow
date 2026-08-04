"use server";
/**
 * 职位 Server Actions —— 创建、更新、删除
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import db from "@/db";
import { jobs, candidates } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createJob(formData: FormData) {
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || "";

  if (!title || !title.trim()) {
    redirect("/jobs/new?error=" + encodeURIComponent("标题不能为空"));
  }

  await db.insert(jobs).values({
    title: title.trim(),
    description: description.trim(),
  });

  revalidatePath("/jobs");
  redirect("/jobs");
}

export async function updateJob(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  const title = (formData.get("title") as string) || "";
  const description = (formData.get("description") as string) || "";
  const status = (formData.get("status") as string) || undefined;

  if (!title.trim()) {
    redirect(`/jobs/${id}/edit?error=` + encodeURIComponent("标题不能为空"));
  }

  const updates: Record<string, unknown> = {
    title: title.trim(),
    description: description.trim(),
  };
  if (status === "open" || status === "closed") {
    updates.status = status;
  }

  await db.update(jobs).set(updates).where(eq(jobs.id, id));

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}`);
  redirect("/jobs");
}

/**
 * 删除职位 — 带外键保护
 */
export async function deleteJob(formData: FormData) {
  const id = parseInt(formData.get("id") as string);

  // 检查该职位下是否有候选人（在 try 外，redirect 不会被误捕）
  const existingCandidates = await db
    .select()
    .from(candidates)
    .where(eq(candidates.jobId, id));
  const count = existingCandidates.length;

  if (count > 0) {
    const msg = `该职位下有 ${count} 位候选人，无法删除。可将职位状态改为"已关闭"，或先处理这些候选人`;
    redirect(`/jobs?error=` + encodeURIComponent(msg));
  }

  // 只把数据库操作包在 try 里
  try {
    await db.delete(jobs).where(eq(jobs.id, id));
  } catch (e: any) {
    redirect(`/jobs?error=` + encodeURIComponent(`删除失败：${e.message || "未知错误"}`));
  }

  revalidatePath("/jobs");
  redirect("/jobs");
}
