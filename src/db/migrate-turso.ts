/**
 * Turso 数据库建表脚本
 *
 * drizzle-kit push 在连接远程 Turso 时偶尔卡住，
 * 这个脚本直接用 @libsql/client 执行 CREATE TABLE，
 * 绕过 drizzle-kit，效果一样。
 *
 * 使用：npx tsx src/db/migrate-turso.ts
 */
import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { resolve } from "path";

// 加载 .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const dbUrl = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!dbUrl || !dbUrl.startsWith("libsql://")) {
  console.log("❌ DATABASE_URL 不是 libsql:// 开头，跳过远程建表");
  process.exit(1);
}

const client = createClient({ url: dbUrl, authToken });

async function migrate() {
  console.log(`🚀 连接 Turso: ${dbUrl}`);

  // 执行建表 SQL（和 schema.ts 定义的表结构一致）
  const sql = `
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      job_id INTEGER NOT NULL REFERENCES jobs(id),
      source TEXT,
      resume_text TEXT,
      status TEXT NOT NULL DEFAULT 'screening',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    ALTER TABLE candidates ADD COLUMN resume_text TEXT;

    CREATE TABLE IF NOT EXISTS interviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER NOT NULL REFERENCES candidates(id),
      round_number INTEGER NOT NULL DEFAULT 1,
      interviewer TEXT NOT NULL,
      interview_type TEXT NOT NULL DEFAULT 'video',
      scheduled_at TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      interview_id INTEGER NOT NULL REFERENCES interviews(id),
      rating INTEGER NOT NULL,
      strengths TEXT,
      concerns TEXT,
      conclusion TEXT NOT NULL DEFAULT 'pending',
      submitted_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER NOT NULL REFERENCES candidates(id),
      job_id INTEGER NOT NULL REFERENCES jobs(id),
      score INTEGER NOT NULL,
      strengths TEXT,
      concerns TEXT,
      recommendation TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER NOT NULL REFERENCES candidates(id),
      action TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `;

  // Turso 不支持一次执行多条 SQL，逐条执行
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    try {
      await client.execute(stmt + ";");
    } catch (e: any) {
      // 表已存在 / 列已存在就跳过
      if (
        e.message &&
        (e.message.includes("already exists") ||
          e.message.includes("duplicate column"))
      ) {
        console.log(`  ⏭️  已存在，跳过`);
      } else {
        console.log(`  ❌ 错误: ${e.message}`);
      }
    }
  }

  // 验证：列出所有表
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  console.log(`\n✅ 云端数据库表列表:`);
  tables.rows.forEach((r: any) => console.log(`  📦 ${r.name}`));

  console.log(`\n🎉 Turso 建表完成！`);
}

migrate().catch((e) => {
  console.error("建表失败:", e.message);
  process.exit(1);
});
