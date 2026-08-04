/**
 * 数据库清理脚本 — 清空所有表数据，保留表结构
 * 按外键依赖顺序：先删子表，再删父表
 * npx tsx src/db/cleanup.ts
 */
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const dbUrl = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

async function cleanup() {
  // 根据连接方式选择客户端
  let client: any;

  if (dbUrl?.startsWith("libsql://")) {
    const { createClient } = require("@libsql/client");
    client = createClient({ url: dbUrl, authToken });
    console.log(`🔗 连接云端: ${dbUrl}`);
  } else {
    const Database = require("better-sqlite3");
    const path = (dbUrl || "sqlite:./hireflow.db").replace("sqlite:", "");
    client = new Database(path);
    console.log(`🔗 连接本地: ${path}`);
  }

  // 按外键依赖顺序删除（先子表后父表）
  const tables = [
    "feedback",
    "matches",
    "activity_logs",
    "interviews",
    "candidates",
    "jobs",
  ];

  for (const table of tables) {
    const result = await (client.execute
      ? client.execute(`DELETE FROM ${table}`)
      : client.prepare(`DELETE FROM ${table}`).run());

    const count = client.execute
      ? (await client.execute(`SELECT COUNT(*) as c FROM ${table}`)).rows[0].c
      : client.prepare(`SELECT COUNT(*) as c FROM ${table}`).get().c;

    // After DELETE, verify
    const verify = client.execute
      ? (await client.execute(`SELECT COUNT(*) as c FROM ${table}`)).rows[0].c
      : client.prepare(`SELECT COUNT(*) as c FROM ${table}`).get().c;

    console.log(`  🧹 ${table}: ${verify} 条（已清空）`);
  }

  console.log("\n✅ 所有表已清空，表结构保留");
}

cleanup().catch((e) => {
  console.error("❌ 清理失败:", e.message);
  process.exit(1);
});
