ALTER TABLE "project_activities" ADD COLUMN "session_id" text;--> statement-breakpoint
ALTER TABLE "project_activities" ADD COLUMN "step_type" text;--> statement-breakpoint
ALTER TABLE "project_activities" ADD COLUMN "payload" jsonb;