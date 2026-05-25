import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  location: text("location"),
  workType: text("work_type"),
  status: text("status").notNull().default("Wishlist"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  matchScore: integer("match_score"),
  jobUrl: text("job_url"),
  notes: text("notes"),
  appliedDate: text("applied_date"),
  interviewDate: text("interview_date"),
  offerDeadline: text("offer_deadline"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
