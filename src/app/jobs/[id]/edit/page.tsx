/**
 * 编辑职位页 — Server Component
 *
 * 服务端直接从数据库读取职位数据，
 * 然后传给客户端表单组件渲染。
 *
 * 这样就不需要 API 路由了：
 * 读取 → Server Component 直接查库
 * 写入 → Client Component 调 Server Action
 */
import db from "@/db";
import { jobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { EditJobForm } from "./edit-form";

export default async function EditJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const jobId = parseInt(id);
  const { error } = await searchParams;

  if (isNaN(jobId)) {
    notFound();
  }

  // 直接从数据库读，不经过 API
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));

  if (!job) {
    notFound();
  }

  // 把查到的数据传给客户端表单
  return <EditJobForm job={job} error={error} />;
}
