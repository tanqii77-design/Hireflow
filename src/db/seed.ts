/**
 * 演示数据脚本 — 幂等（标题存在则跳过）
 * npx tsx src/db/seed.ts
 */
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const dbUrl = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

async function getClient() {
  if (dbUrl?.startsWith("libsql://")) {
    const { createClient } = require("@libsql/client");
    return createClient({ url: dbUrl, authToken });
  }
  const Database = require("better-sqlite3");
  const path = (dbUrl || "sqlite:./hireflow.db").replace("sqlite:", "");
  return new Database(path);
}

async function seed() {
  const db = await getClient();
  const exec = (sql: string, params?: any[]) =>
    db.execute ? db.execute({ sql, args: params || [] }) : db.prepare(sql).run(...(params || []));
  const query = (sql: string, params?: any[]) =>
    db.execute
      ? db.execute({ sql, args: params || [] }).then((r: any) => r.rows)
      : Promise.resolve(db.prepare(sql).all(...(params || [])));

  console.log("🌱 开始填充演示数据...\n");

  // ===== 职位 =====
  const jobs = [
    {
      title: "后端开发实习生",
      description:
        "负责公司核心业务系统的后端开发与维护。参与需求分析、接口设计、数据库建模和代码实现。要求：熟悉 Java 或 Go 语言，了解 MySQL/Redis，有基本的 Linux 操作能力，良好的编程习惯和团队协作精神。加分项：了解 Spring Boot、Docker、微服务架构。",
      status: "open",
    },
    {
      title: "招聘实习生",
      description:
        "协助招聘团队完成社会招聘全流程。工作内容包括：发布职位、筛选简历、电话邀约、安排面试、候选人跟进、招聘数据统计。要求：人力资源或相关专业，沟通能力强，细致耐心。加分项：有招聘平台使用经验。",
      status: "open",
    },
    {
      title: "新媒体运营实习生",
      description:
        "负责公司微信公众号、小红书、抖音等新媒体平台的内容策划与运营。独立完成选题、撰稿、排版、发布和数据分析。要求：网感好，文字功底扎实，会使用剪映/PS 等工具。加分项：有自己运营的账号。",
      status: "closed",
    },
  ];

  const jobIds: number[] = [];
  for (const j of jobs) {
    const rows = await query("SELECT id FROM jobs WHERE title = ?", [j.title]);
    if (rows.length > 0) {
      console.log(`  ⏭️  职位已存在: ${j.title}`);
      jobIds.push(rows[0].id);
    } else {
      const r = await db.execute
        ? (await db.execute({ sql: "INSERT INTO jobs (title, description, status) VALUES (?, ?, ?)", args: [j.title, j.description, j.status] }))
        : db.prepare("INSERT INTO jobs (title, description, status) VALUES (?, ?, ?)").run(j.title, j.description, j.status);
      const id = db.execute ? Number(r.lastInsertRowid) : Number((r as any).lastInsertRowid);
      console.log(`  ✅ 创建职位: ${j.title} (id=${id})`);
      jobIds.push(id);
    }
  }

  // ===== 候选人 =====
  const candidatesData = [
    {
      name: "陈思远", phone: "13800001001", email: "siyuan.chen@example.com",
      jobId: jobIds[0], source: "官网", status: "interviewing",
      resumeText: "陈思远\n浙江大学 计算机科学与技术 本科 2026届\n\n技能：Java、Spring Boot、MySQL、Redis、Docker\n\n项目经历：\n- 校园二手交易平台后端开发：负责用户模块和商品模块的接口开发，使用 Spring Boot + MyBatis，日均调用量 2000+\n- 智能课表系统：参与数据库设计和 API 开发\n\n实习经历：\n- 某互联网公司 Java 开发实习生（3个月）：参与支付系统微服务拆分项目",
    },
    {
      name: "林晓雨", phone: "13800001002", email: "xiaoyu.lin@example.com",
      jobId: jobIds[1], source: "BOSS直聘", status: "passed",
      resumeText: "林晓雨\n浙江工商大学 人力资源管理 本科 2026届\n\n技能：招聘流程管理、面试技巧、Excel 数据分析\n\n实习经历：\n- 某知名企业 HR 实习生（4个月）：独立负责实习生岗位的全流程招聘，月均筛选简历 200+ 份，安排面试 50+ 场，成功入职 8 人\n- 参与校园招聘项目，负责高校宣讲会的组织与执行\n\n证书：企业人力资源管理师（四级）",
    },
    {
      name: "王浩然", phone: "13800001003", email: "haoran.wang@example.com",
      jobId: jobIds[0], source: "内推", status: "offered",
      resumeText: "王浩然\n杭州电子科技大学 软件工程 硕士 2026届\n\n技能：Go、Python、gRPC、Kubernetes、分布式系统\n\n项目经历：\n- 分布式消息队列（Go 实现）：支持发布/订阅模式，TPS 达到 5000+\n- 微服务监控平台：使用 Prometheus + Grafana，实现全链路追踪\n\n实习经历：\n- 某大厂后端开发实习生（6个月）：参与云原生中间件开发\n\n发表论文：基于深度学习的日志异常检测（CCF-C）",
    },
    {
      name: "赵雨婷", phone: "13800001004", email: "yuting.zhao@example.com",
      jobId: jobIds[2], source: "校招", status: "rejected",
      resumeText: "赵雨婷\n浙江传媒学院 网络与新媒体 本科 2026届\n\n技能：公众号运营、短视频剪辑、PS/AI 平面设计\n\n项目经历：\n- 个人抖音账号运营：3个月涨粉 2万，单条最高播放 50万\n- 校学生会宣传部部长：负责公众号运营，粉丝从 3000 增长到 8000\n\n实习经历：\n- 某 MCN 机构内容运营实习生",
    },
    {
      name: "张明远", phone: "13800001005", email: "mingyuan.zhang@example.com",
      jobId: jobIds[1], source: "官网", status: "hired",
      resumeText: "张明远\n浙江财经大学 人力资源管理 本科 2025届\n\n技能：招聘全流程、员工关系、薪酬核算、HRIS\n\n工作经历：\n- 某上市公司 HR 专员（1年）：负责技术部门的招聘和员工关系，年度招聘完成率 120%\n- 推动招聘流程优化，将平均招聘周期从 28 天缩短至 18 天\n\n证书：人力资源管理师（三级）、心理咨询师",
    },
    {
      name: "刘子涵", phone: "13800001006", email: "zihan.liu@example.com",
      jobId: jobIds[0], source: "BOSS直聘", status: "screening",
      resumeText: "刘子涵\n浙江工业大学 计算机科学与技术 本科 2026届\n\n技能：Python、Django、PostgreSQL、Linux\n\n项目经历：\n- 在线编程评测系统：支持 Python/Java 代码在线编译和评测\n- 校园失物招领小程序后端\n\n无实习经历，但参加过蓝桥杯省赛二等奖",
    },
  ];

  const candidateIds: number[] = [];
  for (const c of candidatesData) {
    const rows = await query("SELECT id FROM candidates WHERE name = ? AND email = ?", [c.name, c.email]);
    if (rows.length > 0) {
      console.log(`  ⏭️  候选人已存在: ${c.name}`);
      candidateIds.push(rows[0].id);
    } else {
      const r = await db.execute
        ? (await db.execute({
            sql: "INSERT INTO candidates (name, phone, email, job_id, source, status, resume_text) VALUES (?, ?, ?, ?, ?, ?, ?)",
            args: [c.name, c.phone, c.email, c.jobId, c.source, c.status, c.resumeText],
          }))
        : db.prepare("INSERT INTO candidates (name, phone, email, job_id, source, status, resume_text) VALUES (?, ?, ?, ?, ?, ?, ?)").run(c.name, c.phone, c.email, c.jobId, c.source, c.status, c.resumeText);
      const id = db.execute ? Number(r.lastInsertRowid) : Number((r as any).lastInsertRowid);
      console.log(`  ✅ 创建候选人: ${c.name} (id=${id}, ${c.status})`);
      candidateIds.push(id);
    }
  }

  // ===== 面试 =====
  // 需要 candidate id → 按姓名映射
  const candMap = new Map<string, number>();
  const allCands = await query("SELECT id, name FROM candidates");
  for (const c of allCands as any[]) candMap.set(c.name, c.id);

  const interviewsData = [
    // 陈思远: 1轮已完成(有反馈) + 1轮已安排
    { candidateName: "陈思远", round: 1, interviewer: "李明辉", type: "video", scheduledAt: "2026-08-07T10:00", status: "completed" },
    { candidateName: "陈思远", round: 2, interviewer: "王涛", type: "onsite", scheduledAt: "2026-08-12T14:00", status: "scheduled" },
    // 林晓雨: 2轮已完成(均有反馈)
    { candidateName: "林晓雨", round: 1, interviewer: "张丽华", type: "phone", scheduledAt: "2026-08-03T09:30", status: "completed" },
    { candidateName: "林晓雨", round: 2, interviewer: "陈总监", type: "video", scheduledAt: "2026-08-05T15:00", status: "completed" },
    // 王浩然: 3轮已完成(前2轮有反馈，第3轮故意留空 → 待反馈)
    { candidateName: "王浩然", round: 1, interviewer: "刘技术", type: "phone", scheduledAt: "2026-08-01T10:00", status: "completed" },
    { candidateName: "王浩然", round: 2, interviewer: "李明辉", type: "video", scheduledAt: "2026-08-04T11:00", status: "completed" },
    { candidateName: "王浩然", round: 3, interviewer: "赵总监", type: "onsite", scheduledAt: "2026-08-08T09:00", status: "completed" },
    // 赵雨婷: 1轮已取消
    { candidateName: "赵雨婷", round: 1, interviewer: "张丽华", type: "video", scheduledAt: "2026-07-28T14:00", status: "cancelled" },
    // 张明远: 2轮已完成(均有反馈)
    { candidateName: "张明远", round: 1, interviewer: "王涛", type: "phone", scheduledAt: "2026-07-15T10:00", status: "completed" },
    { candidateName: "张明远", round: 2, interviewer: "陈总监", type: "onsite", scheduledAt: "2026-07-20T14:00", status: "completed" },
  ];

  const interviewIds: { name: string; round: number; id: number }[] = [];
  for (const iv of interviewsData) {
    const cid = candMap.get(iv.candidateName);
    if (!cid) continue;
    const existing = await query("SELECT id FROM interviews WHERE candidate_id = ? AND round_number = ?", [cid, iv.round]);
    if (existing.length > 0) {
      interviewIds.push({ name: iv.candidateName, round: iv.round, id: existing[0].id });
    } else {
      const r = await db.execute
        ? (await db.execute({
            sql: "INSERT INTO interviews (candidate_id, round_number, interviewer, interview_type, scheduled_at, status) VALUES (?, ?, ?, ?, ?, ?)",
            args: [cid, iv.round, iv.interviewer, iv.type, iv.scheduledAt, iv.status],
          }))
        : db.prepare("INSERT INTO interviews (candidate_id, round_number, interviewer, interview_type, scheduled_at, status) VALUES (?, ?, ?, ?, ?, ?)").run(cid, iv.round, iv.interviewer, iv.type, iv.scheduledAt, iv.status);
      const id = db.execute ? Number(r.lastInsertRowid) : Number((r as any).lastInsertRowid);
      interviewIds.push({ name: iv.candidateName, round: iv.round, id });
    }
  }

  // ===== 反馈（王浩然第3轮故意不加反馈 → 待反馈）=====
  const feedbackData = [
    { candidateName: "陈思远", round: 1, rating: 3, strengths: "基础知识扎实，对 Spring Boot 框架有实际使用经验，沟通表达清晰", concerns: "缺乏大规模分布式系统经验，算法能力有待加强", submittedBy: "李明辉" },
    { candidateName: "林晓雨", round: 1, rating: 4, strengths: "沟通能力强，对招聘流程有实际操作经验，态度积极主动", concerns: "技术岗位招聘经验不足，薪资谈判技巧需提升", submittedBy: "张丽华" },
    { candidateName: "林晓雨", round: 2, rating: 5, strengths: "综合素质优秀，HR 专业技能扎实，有独立负责项目的潜力", concerns: "暂无", submittedBy: "陈总监" },
    { candidateName: "王浩然", round: 1, rating: 5, strengths: "技术功底深厚，硕士期间有高水平项目经验，学习能力强", concerns: "期望薪资偏高", submittedBy: "刘技术" },
    { candidateName: "王浩然", round: 2, rating: 5, strengths: "分布式系统理解深入，架构设计能力出色，沟通能力超出预期", concerns: "暂无", submittedBy: "李明辉" },
    // 王浩然第3轮故意不加
    { candidateName: "张明远", round: 1, rating: 4, strengths: "招聘经验丰富，有独立负责招聘全流程的能力", concerns: "在大型团队管理方面经验有限", submittedBy: "王涛" },
    { candidateName: "张明远", round: 2, rating: 5, strengths: "业务理解深刻，有数据驱动的招聘思维，综合素质优秀", concerns: "暂无", submittedBy: "陈总监" },
  ];

  for (const fb of feedbackData) {
    const iv = interviewIds.find(i => i.name === fb.candidateName && i.round === fb.round);
    if (!iv) continue;
    const existing = await query("SELECT id FROM feedback WHERE interview_id = ?", [iv.id]);
    if (existing.length > 0) continue;
    if (db.execute) {
      await db.execute({
        sql: "INSERT INTO feedback (interview_id, rating, strengths, concerns, submitted_by) VALUES (?, ?, ?, ?, ?)",
        args: [iv.id, fb.rating, fb.strengths, fb.concerns, fb.submittedBy],
      });
    } else {
      db.prepare("INSERT INTO feedback (interview_id, rating, strengths, concerns, submitted_by) VALUES (?, ?, ?, ?, ?)").run(iv.id, fb.rating, fb.strengths, fb.concerns, fb.submittedBy);
    }
  }
  console.log(`  ✅ 反馈已填充（王浩然第3轮故意留空作待反馈演示）`);

  // ===== AI 匹配记录 =====
  const matchData = [
    { candidateName: "陈思远", jobId: jobIds[0], score: 72, strengths: ["Java 基础扎实", "有 Spring Boot 实际经验", "沟通表达好"], concerns: ["无分布式经验", "算法能力待加强"], recommendation: "谨慎考虑" },
    { candidateName: "陈思远", jobId: jobIds[1], score: 35, strengths: [], concerns: ["非 HR 专业"], recommendation: "不推荐" },
    { candidateName: "林晓雨", jobId: jobIds[1], score: 88, strengths: ["HR 专业对口", "招聘实习经验丰富", "综合素质优秀"], concerns: [], recommendation: "推荐面试" },
    { candidateName: "林晓雨", jobId: jobIds[0], score: 20, strengths: [], concerns: ["非技术背景"], recommendation: "不推荐" },
    { candidateName: "王浩然", jobId: jobIds[0], score: 95, strengths: ["技术功底深厚", "硕士学历", "大厂实习"], concerns: ["期望薪资高"], recommendation: "推荐面试" },
    { candidateName: "王浩然", jobId: jobIds[1], score: 30, strengths: [], concerns: ["非 HR 背景"], recommendation: "不推荐" },
    { candidateName: "张明远", jobId: jobIds[1], score: 92, strengths: ["HR 经验丰富", "有数据驱动思维", "招聘全流程熟练"], concerns: [], recommendation: "推荐面试" },
    { candidateName: "刘子涵", jobId: jobIds[0], score: 55, strengths: ["Python 基础好", "有竞赛获奖"], concerns: ["无实习经验", "技术栈偏浅"], recommendation: "谨慎考虑" },
    { candidateName: "刘子涵", jobId: jobIds[1], score: 25, strengths: [], concerns: ["非 HR 背景"], recommendation: "不推荐" },
  ];

  for (const m of matchData) {
    const cid = candMap.get(m.candidateName);
    if (!cid) continue;
    const existing = await query("SELECT id FROM matches WHERE candidate_id = ? AND job_id = ?", [cid, m.jobId]);
    if (existing.length > 0) continue;
    if (db.execute) {
      await db.execute({
        sql: "INSERT INTO matches (candidate_id, job_id, score, strengths, concerns, recommendation) VALUES (?, ?, ?, ?, ?, ?)",
        args: [cid, m.jobId, m.score, JSON.stringify(m.strengths), JSON.stringify(m.concerns), m.recommendation],
      });
    } else {
      db.prepare("INSERT INTO matches (candidate_id, job_id, score, strengths, concerns, recommendation) VALUES (?, ?, ?, ?, ?, ?)").run(cid, m.jobId, m.score, JSON.stringify(m.strengths), JSON.stringify(m.concerns), m.recommendation);
    }
  }
  console.log(`  ✅ 匹配记录已填充`);

  // ===== 统计 =====
  console.log("\n数据统计:");
  const tables = ["jobs", "candidates", "interviews", "feedback", "matches", "activity_logs"];
  for (const t of tables) {
    const r = db.execute
      ? (await db.execute({ sql: `SELECT COUNT(*) as c FROM ${t}`, args: [] })).rows[0]
      : db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get();
    console.log(`  ${t}: ${r.c} 条`);
  }

  // 待反馈数
  const pendingR = db.execute
    ? (await db.execute({ sql: "SELECT COUNT(*) as c FROM interviews WHERE status = 'completed' AND id NOT IN (SELECT interview_id FROM feedback)", args: [] })).rows[0]
    : db.prepare("SELECT COUNT(*) as c FROM interviews WHERE status = 'completed' AND id NOT IN (SELECT interview_id FROM feedback)").get();
  console.log(`\n  待反馈: ${pendingR.c} 条（王浩然第3轮）`);

  console.log("\n 演示数据填充完成！");
}

seed().catch((e) => {
  console.error("❌ 填充失败:", e.message);
  process.exit(1);
});
