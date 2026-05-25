import { Router } from "express";
import { db, applicationsTable } from "@workspace/db";
import { count, eq, sql, desc } from "drizzle-orm";

const router = Router();

// 1. Keep your original general dashboard route
router.get("/dashboard", async (req, res) => {
  try {
    const totalRes = await db.select({ value: count() }).from(applicationsTable);
    const totalApplications = totalRes[0]?.value || 0;
    const interviewRes = await db.select({ value: count() }).from(applicationsTable).where(eq(applicationsTable.status, "Interviewing"));
    const activeInterviews = interviewRes[0]?.value || 0;
    const offerRes = await db.select({ value: count() }).from(applicationsTable).where(eq(applicationsTable.status, "Offer"));
    const offersSecured = offerRes[0]?.value || 0;
    const successRate = totalApplications > 0 ? Math.round((offersSecured / totalApplications) * 100) : 0;

    res.json({ totalApplications, activeInterviews, offersSecured, successRate });
  } catch (error) {
    res.status(500).json({ error: "Failed to compile dashboard analytics payload." });
  }
});

// 2. ADDED: Route for Stats Cards
router.get("/dashboard/stats", async (req, res) => {
  try {
    const all = await db.select().from(applicationsTable);
    res.json({
      totalApplications: all.length,
      interviews: all.filter(a => a.status === "Interviewing").length,
      offers: all.filter(a => a.status === "Offer").length,
      avgResponseTimeDays: 4
    });
  } catch (e) { res.status(500).json({ error: "Stats failed" }); }
});

// 3. ADDED: Route for Funnel Chart
router.get("/dashboard/funnel", async (req, res) => {
  try {
    const stages = ["Wishlist", "Applied", "Interviewing", "Offer", "Rejected"];
    const funnel = await Promise.all(stages.map(async (stage) => {
      const resCount = await db.select({ val: count() }).from(applicationsTable).where(eq(applicationsTable.status, stage));
      return { stage, count: Number(resCount[0].val) };
    }));
    res.json(funnel);
  } catch (e) { res.status(500).json({ error: "Funnel failed" }); }
});

// 4. ADDED: Route for Timeline Chart
router.get("/dashboard/timeline", async (req, res) => {
  try {
    const result = await db.select({
      date: sql<string>`TO_CHAR(${applicationsTable.createdAt}, 'YYYY-MM-DD')`,
      count: count(),
    }).from(applicationsTable).groupBy(sql`TO_CHAR(${applicationsTable.createdAt}, 'YYYY-MM-DD')`);
    res.json(result);
  } catch (e) { res.status(500).json({ error: "Timeline failed" }); }
});

// 5. ADDED: Route for Top Roles Chart
router.get("/dashboard/top-roles", async (req, res) => {
  try {
    const result = await db.select({ role: applicationsTable.role, count: count() })
      .from(applicationsTable).groupBy(applicationsTable.role).orderBy(desc(count())).limit(5);
    res.json(result);
  } catch (e) { res.status(500).json({ error: "Roles failed" }); }
});

export default router;