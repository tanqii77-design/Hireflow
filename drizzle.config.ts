import type { Config } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

// 加载 .env.local 中的环境变量
loadEnvConfig(process.cwd());

// 根据 DATABASE_URL 判断是本地还是远程
const dbUrl = process.env.DATABASE_URL || "sqlite:./hireflow.db";
const isRemote = dbUrl.startsWith("libsql://");

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: isRemote ? "turso" : "sqlite",
  dbCredentials: isRemote
    ? {
        // 远程 Turso：url + authToken
        url: dbUrl,
        authToken: process.env.TURSO_AUTH_TOKEN || "",
      }
    : {
        // 本地 SQLite：文件路径
        url: dbUrl.replace("sqlite:", ""),
      },
} satisfies Config;
