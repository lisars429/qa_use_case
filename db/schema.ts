import { pgTable, serial, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

// Single table to store all application data/activities
export const projectActivities = pgTable('project_activities', {
    id: serial('id').primaryKey(),
    sessionId: text('session_id'), // Track user sessions
    stepName: text('step_name').notNull(), // User requested column
    stepType: text('step_type'), // Type of step/operation
    activityType: text('activity_type').notNull(), // e.g., 'user_story', 'test_case', 'pipeline_step'
    payload: jsonb('payload'), // Structured data for the step
    details: jsonb('details').notNull(), // Stores the entity-specific data
    createdAt: timestamp('created_at').defaultNow(),
});
