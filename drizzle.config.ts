import type { Config } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

// 加载 .env.local 中的环境变量
loadEnvConfig(process.cwd());

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  // 本地开发：better-sqlite3 文件路径
  dbCredentials: {
    url: "./hireflow.db",
  },
} satisfies Config;
