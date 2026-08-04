"use server";
/**
 * 职位 Server Actions —— 创建、更新、删除
 *
 * "use server" 告诉 Next.js：这个文件里的函数只在服务端运行，
 * 但可以直接被客户端组件调用，像调普通函数一样。
 *
 * revalidatePath() 的作用：告诉 Next.js "这个路径的数据变了，重新渲染"
 * 这样列表页会自动拿到最新数据，不需要手动刷新浏览器。
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import db from "@/db";
import { jobs } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * 创建新职位
 * @param formData — 表单自动传入，FormData 包含所有 input 的 name/value
 */
export async function createJob(formData: FormData) {
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || "";

  // 校验：标题不能为空
  if (!title || !title.trim()) {
    // redirect 到新建页并带上错误信息
    redirect("/jobs/new?error=标题不能为空");
  }

  // 插入数据库
  await db.insert(jobs).values({
    title: title.trim(),
    description: description.trim(),
  });

  // 让列表页重新从数据库拿数据
  revalidatePath("/jobs");

  // 跳回列表页
  redirect("/jobs");
}

/**
 * 更新职位
 */
export async function updateJob(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  const title = (formData.get("title") as string) || "";
  const description = (formData.get("description") as string) || "";
  const status = (formData.get("status") as string) || undefined;

  if (!title.trim()) {
    redirect(`/jobs/${id}/edit?error=标题不能为空`);
  }

  // 构建更新对象
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
 * 删除职位
 */
export async function deleteJob(formData: FormData) {
  const id = parseInt(formData.get("id") as string);

  await db.delete(jobs).where(eq(jobs.id, id));

  revalidatePath("/jobs");
  redirect("/jobs");
}
