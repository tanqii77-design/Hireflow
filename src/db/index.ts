/**
 * 数据库连接管理
 * 本地开发用 better-sqlite3（文件数据库）
 * 生产环境用 Turso（通过 libsql/client）
 */
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

// 从 .env.local 读取数据库连接字符串（默认 sqlite:./hireflow.db）
const dbUrl = process.env.DATABASE_URL || "sqlite:./hireflow.db";

// 提取文件路径（去掉 "sqlite:" 前缀）
const sqlitePath = dbUrl.replace("sqlite:", "");

// 创建 SQLite 数据库连接
const sqlite = new Database(sqlitePath);

// 启用 WAL 模式（Write-Ahead Logging），提高并发写入性能
sqlite.pragma("journal_mode = WAL");

// 启用外键约束检查
sqlite.pragma("foreign_keys = ON");

// 创建 Drizzle ORM 实例，绑定 schema
export const db = drizzle(sqlite, { schema });

export default db;
