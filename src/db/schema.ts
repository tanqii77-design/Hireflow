/**
 * 数据库 Schema 定义
 * 5 张表：jobs / candidates / interviews / feedback / activity_logs
 */
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ===== 职位表 =====
export const jobs = sqliteTable("jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),           // 职位名称，如"前端开发实习生"
  description: text("description"),          // 职位简介
  status: text("status").notNull().default("open"), // open（招聘中）/ closed（已关闭）
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),       // 创建时间，SQLite 用 datetime('now')
});

// ===== 候选人表 =====
export const candidates = sqliteTable("candidates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),             // 姓名
  phone: text("phone"),                     // 电话
  email: text("email"),                     // 邮箱
  jobId: integer("job_id")
    .notNull()
    .references(() => jobs.id),             // 应聘职位（外键 → jobs.id）
  source: text("source"),                   // 来源：领英/内推/官网/BOSS直聘...
  status: text("status").notNull().default("screening"),
  // 状态：screening（筛选中）/ interviewing（面试中）/
  //       passed（通过）/ rejected（淘汰）/
  //       offered（已发Offer）/ hired（入职）
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ===== 面试表 =====
export const interviews = sqliteTable("interviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  candidateId: integer("candidate_id")
    .notNull()
    .references(() => candidates.id),       // 关联候选人（外键）
  roundNumber: integer("round_number").notNull().default(1), // 第几轮面试
  interviewer: text("interviewer").notNull(), // ★ 面试官名字（核心字段！算"谁欠反馈"靠它）
  interviewType: text("interview_type")
    .notNull()
    .default("video"),                       // 电话/视频/现场
  scheduledAt: text("scheduled_at"),         // 面试时间（ISO 8601 字符串）
  status: text("status").notNull().default("scheduled"),
  // scheduled（已安排）/ completed（已完成）/ cancelled（已取消）
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ===== 反馈表 =====
export const feedback = sqliteTable("feedback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  interviewId: integer("interview_id")
    .notNull()
    .references(() => interviews.id),       // ★ 关联面试轮次（核心关联！算"谁欠反馈"靠这个）
  rating: integer("rating").notNull(),       // 评分 1–5
  strengths: text("strengths"),              // 优点
  concerns: text("concerns"),               // 担忧点
  conclusion: text("conclusion")
    .notNull()
    .default("pending"),                    // pass（通过）/ fail（不通过）/ pending（待定）
  submittedBy: text("submitted_by"),        // 提交人（通常是面试官）
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ===== 操作日志表（🟡 优先砍） =====
// 记录候选人状态变更历史，MVP 可以先不做
export const activityLogs = sqliteTable("activity_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  candidateId: integer("candidate_id")
    .notNull()
    .references(() => candidates.id),
  action: text("action").notNull(),          // 做了什么操作
  description: text("description"),          // 操作描述
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});
