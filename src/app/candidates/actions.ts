"use server";
/**
 * 候选人 Server Actions — 添加、更新状态、删除
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import db from "@/db";
import { candidates } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * 添加候选人
 */
export async function createCandidate(formData: FormData) {
  const name = (formData.get("name") as string) || "";
  const phone = (formData.get("phone") as string) || "";
  const email = (formData.get("email") as string) || "";
  const jobId = parseInt(formData.get("jobId") as string);
  const source = (formData.get("source") as string) || "";

  if (!name.trim()) {
    redirect("/candidates/new?error=姓名不能为空");
  }
  if (isNaN(jobId)) {
    redirect("/candidates/new?error=请选择应聘职位");
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

/**
 * 推进候选人状态
 * 状态流转：screening → interviewing → passed/rejected → offered → hired
 */
export async function advanceStatus(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  const newStatus = formData.get("status") as string;

  await db.update(candidates).set({ status: newStatus }).where(eq(candidates.id, id));

  revalidatePath("/candidates");
  revalidatePath(`/candidates/${id}`);
}

/**
 * 删除候选人
 */
export async function deleteCandidate(formData: FormData) {
  const id = parseInt(formData.get("id") as string);

  await db.delete(candidates).where(eq(candidates.id, id));

  revalidatePath("/candidates");
  redirect("/candidates");
}
