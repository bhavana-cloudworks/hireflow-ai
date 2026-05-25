CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"company" text NOT NULL,
	"role" text NOT NULL,
	"location" text,
	"work_type" text,
	"status" text DEFAULT 'Wishlist' NOT NULL,
	"salary_min" integer,
	"salary_max" integer,
	"match_score" integer,
	"job_url" text,
	"notes" text,
	"applied_date" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeline_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"status" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "timeline_entries" ADD CONSTRAINT "timeline_entries_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;