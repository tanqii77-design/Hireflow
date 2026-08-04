/**
 * 新建候选人页 — 两步流程（AI 自动建档 + 手动添加）
 */
import db from "@/db";
import { jobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NewCandidateFlow } from "./new-flow";

export default async function NewCandidatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const openJobs = await db.select().from(jobs).where(eq(jobs.status, "open"));
  const hasApiKey = !!process.env.LLM_API_KEY;

  return <NewCandidateFlow error={error} jobs={openJobs} hasApiKey={hasApiKey} />;
}
