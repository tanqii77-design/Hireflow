/**
 * 新建候选人页 — Server Component
 * 读取所有开放职位供下拉选择
 */
import db from "@/db";
import { jobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NewCandidateForm } from "./new-form";

export default async function NewCandidatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  // 只显示开放中的职位
  const openJobs = await db.select().from(jobs).where(eq(jobs.status, "open"));

  return <NewCandidateForm error={error} jobs={openJobs} />;
}
