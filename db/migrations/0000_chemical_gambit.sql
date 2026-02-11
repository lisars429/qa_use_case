CREATE TABLE "project_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"step_name" text NOT NULL,
	"activity_type" text NOT NULL,
	"details" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
