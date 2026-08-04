/**
 * 数据库连接管理
 *
 * 根据 DATABASE_URL 的前缀自动选择连接方式：
 *   libsql://...  → Turso 云数据库（生产环境）
 *   sqlite:./...  → better-sqlite3 本地文件（开发环境）
 *
 * 两种数据库都是 SQLite，只是连接方式不同，
 * SQL 语法完全兼容，代码不需要任何其他改动。
 */
import * as schema from "./schema";

function createDb() {
  const dbUrl = process.env.DATABASE_URL || "sqlite:./hireflow.db";

  // ===== Turso 云数据库（生产环境） =====
  if (dbUrl.startsWith("libsql://")) {
    const { drizzle } = require("drizzle-orm/libsql");
    const { createClient } = require("@libsql/client");

    // createClient 需要 url 和 authToken
    const client = createClient({
      url: dbUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    return drizzle(client, { schema });
  }

  // ===== 本地 SQLite（开发环境） =====
  const { drizzle } = require("drizzle-orm/better-sqlite3");
  const Database = require("better-sqlite3");

  const sqlitePath = dbUrl.replace("sqlite:", "");
  const sqlite = new Database(sqlitePath);
  sqlite.pragma("journal_mode = WAL");    // 提高写入性能
  sqlite.pragma("foreign_keys = ON");     // 启用外键约束

  return drizzle(sqlite, { schema });
}

export const db = createDb();
export default db;
