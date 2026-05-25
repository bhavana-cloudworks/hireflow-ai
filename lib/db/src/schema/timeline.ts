import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { applicationsTable } from "./applications";

export const timelineTable = pgTable("timeline_entries", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id")
    .notNull()
    .references(() => applicationsTable.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTimelineSchema = createInsertSchema(timelineTable).omit({
  id: true,
  createdAt: true,
});
export type InsertTimeline = z.infer<typeof insertTimelineSchema>;
export type TimelineEntry = typeof timelineTable.$inferSelect;
