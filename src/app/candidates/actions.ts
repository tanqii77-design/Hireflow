"use server";
/**
 * 候选人 Server Actions — 添加、更新状态、删除
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import db from "@/db";
import { candidates, interviews } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createCandidate(formData: FormData) {
  const name = (formData.get("name") as string) || "";
  const phone = (formData.get("phone") as string) || "";
  const email = (formData.get("email") as string) || "";
  const jobId = parseInt(formData.get("jobId") as string);
  const source = (formData.get("source") as string) || "";

  if (!name.trim()) {
    redirect("/candidates/new?error=" + encodeURIComponent("姓名不能为空"));
  }
  if (isNaN(jobId)) {
    redirect("/candidates/new?error=" + encodeURIComponent("请选择应聘职位"));
  }

  await db.insert(candidates).values({
    name: name.trim(),
    phone: phone.trim(),
    email: email.trim(),
    jobId,
    source: source.trim() || "其他",
  });

  revalidatePath("/candidates");
  revalidatePath(`/jobs/${jobId}`);
  redirect("/candidates");
}

export async function advanceStatus(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  const newStatus = formData.get("status") as string;

  await db
    .update(candidates)
    .set({ status: newStatus })
    .where(eq(candidates.id, id));

  revalidatePath("/candidates");
  revalidatePath(`/candidates/${id}`);
}

/**
 * 删除候选人 — 带外键保护
 */
export async function deleteCandidate(formData: FormData) {
  const id = parseInt(formData.get("id") as string);

  // 检查该候选人是否有面试记录（在 try 外）
  const existingInterviews = await db
    .select()
    .from(interviews)
    .where(eq(interviews.candidateId, id));
  const count = existingInterviews.length;

  if (count > 0) {
    redirect(
      "/candidates?error=" + encodeURIComponent("该候选人存在面试记录，无法删除。可先取消所有面试后再试")
    );
  }

  // 只把数据库操作包在 try 里
  try {
    await db.delete(candidates).where(eq(candidates.id, id));
  } catch (e: any) {
    redirect(`/candidates?error=` + encodeURIComponent(`删除失败：${e.message || "未知错误"}`));
  }

  revalidatePath("/candidates");
  redirect("/candidates");
}
