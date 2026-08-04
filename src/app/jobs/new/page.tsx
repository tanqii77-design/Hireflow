/**
 * 新建职位页 — Server Component
 *
 * 接收 searchParams（URL 参数），传给客户端表单
 */
import { NewJobForm } from "./new-form";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <NewJobForm error={error} />;
}
