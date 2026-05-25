import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, applicationsTable, timelineTable } from "@workspace/db";
import { ListApplicationsQueryParams, GetApplicationParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/applications", async (req, res): Promise<void> => {
  try {
    const query = ListApplicationsQueryParams.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: query.error.message });
      return;
    }
    let apps = await db.select().from(applicationsTable).orderBy(desc(applicationsTable.id));
    if (query.data.status) {
      apps = apps.filter((app) => app.status === query.data.status);
    }
    console.log(`✅ Found ${apps.length} applications`);
    res.json(apps);
  } catch (error) {
    console.error("❌ GET /applications failed:", error);
    res.status(500).json({ error: "Database query failed", details: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/applications", async (req, res): Promise<void> => {
  try {
    const { company, role, status, location, workType, salaryMin, salaryMax, matchScore, jobUrl, notes, appliedDate, interviewDate, offerDeadline } = req.body;

    if (!company || !role) {
      res.status(400).json({ error: "company and role are required" });
      return;
    }

    const toInt = (v: any) => { const n = parseInt(v, 10); return isNaN(n) ? null : n; };
    const toStr = (v: any) => (v && String(v).trim() ? String(v).trim() : null);

    const [app] = await db.insert(applicationsTable).values({
      company: String(company),
      role: String(role),
      status: toStr(status) ?? "Wishlist",
      location: toStr(location),
      workType: toStr(workType),
      salaryMin: toInt(salaryMin),
      salaryMax: toInt(salaryMax),
      matchScore: toInt(matchScore),
      jobUrl: toStr(jobUrl),
      notes: toStr(notes),
      appliedDate: toStr(appliedDate),
      interviewDate: toStr(interviewDate),
      offerDeadline: toStr(offerDeadline),
    }).returning();

    try {
      await db.insert(timelineTable).values({ applicationId: app.id, status: app.status, note: "Application created" });
    } catch (timelineError) {
      console.warn("⚠️ Timeline insert failed:", timelineError);
    }

    console.log(`✅ Created: ${app.company} — ${app.role}`);
    res.status(201).json(app);
  } catch (error) {
    console.error("❌ POST /applications failed:", error);
    res.status(500).json({ error: "Could not create application", details: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/applications/:id", async (req, res): Promise<void> => {
  try {
    const params = GetApplicationParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
    const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, params.data.id));
    if (!app) { res.status(404).json({ error: "Application not found" }); return; }
    res.json(app);
  } catch (error) {
    console.error("❌ GET /applications/:id failed:", error);
    res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) });
  }
});

router.patch("/applications/:id", async (req, res): Promise<void> => {
  try {
    const params = GetApplicationParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

    const [existing] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, params.data.id));
    if (!existing) { res.status(404).json({ error: "Application not found" }); return; }

    const { company, role, status, location, workType, salaryMin, salaryMax, matchScore, jobUrl, notes, appliedDate, interviewDate, offerDeadline } = req.body;

    const toInt = (v: any) => { const n = parseInt(v, 10); return isNaN(n) ? null : n; };
    const toStr = (v: any) => (v && String(v).trim() ? String(v).trim() : null);

    const patch: Record<string, any> = { updatedAt: new Date() };
    if (company       !== undefined) patch.company       = String(company);
    if (role          !== undefined) patch.role          = String(role);
    if (status        !== undefined) patch.status        = String(status);
    if (location      !== undefined) patch.location      = toStr(location);
    if (workType      !== undefined) patch.workType      = toStr(workType);
    if (salaryMin     !== undefined) patch.salaryMin     = toInt(salaryMin);
    if (salaryMax     !== undefined) patch.salaryMax     = toInt(salaryMax);
    if (matchScore    !== undefined) patch.matchScore    = toInt(matchScore);
    if (jobUrl        !== undefined) patch.jobUrl        = toStr(jobUrl);
    if (notes         !== undefined) patch.notes         = toStr(notes);
    if (appliedDate   !== undefined) patch.appliedDate   = toStr(appliedDate);
    if (interviewDate !== undefined) patch.interviewDate = toStr(interviewDate);
    if (offerDeadline !== undefined) patch.offerDeadline = toStr(offerDeadline);

    const [updated] = await db.update(applicationsTable).set(patch).where(eq(applicationsTable.id, params.data.id)).returning();

    if (status && status !== existing.status) {
      try {
        await db.insert(timelineTable).values({ applicationId: updated.id, status, note: `Status changed to ${status}` });
      } catch (timelineError) {
        console.warn("⚠️ Timeline insert failed:", timelineError);
      }
    }

    res.json(updated);
  } catch (error) {
    console.error("❌ PATCH /applications failed:", error);
    res.status(500).json({ error: "Update failed", details: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/applications/:id/timeline", async (req, res): Promise<void> => {
  try {
    const params = GetApplicationParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
    const timeline = await db.select().from(timelineTable).where(eq(timelineTable.applicationId, params.data.id)).orderBy(desc(timelineTable.createdAt));
    res.json(timeline);
  } catch (error) {
    console.error("❌ GET timeline failed:", error);
    res.status(500).json({ error: "Failed to fetch timeline", details: error instanceof Error ? error.message : String(error) });
  }
});

router.delete("/applications/:id", async (req, res): Promise<void> => {
  try {
    const id = req.params.id;
    if (!id) { res.status(400).json({ error: "No ID provided" }); return; }
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) { res.status(400).json({ error: "Invalid ID" }); return; }

    await db.delete(timelineTable).where(eq(timelineTable.applicationId, numericId));
    await db.delete(applicationsTable).where(eq(applicationsTable.id, numericId));

    res.status(200).json({ message: "Deleted successfully", id: numericId });
  } catch (error) {
    console.error("❌ DELETE /applications failed:", error);
    res.status(500).json({ error: "Delete failed", details: error instanceof Error ? error.message : String(error) });
  }
});

export default router;