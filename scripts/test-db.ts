
import 'dotenv/config';
import { db } from '../db';
import { projectActivities } from '../db/schema';

console.log('DEBUG: DATABASE_URL is:', process.env.DATABASE_URL ? 'Defined' : 'Undefined');
if (process.env.DATABASE_URL) {
    // Mask password for logging
    const maskedUrl = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
    console.log('DEBUG: Connection String:', maskedUrl);
}


async function main() {
    console.log('Testing database connection...');
    try {
        const result = await db.insert(projectActivities).values({
            stepName: 'test-verification',
            activityType: 'test',
            details: { message: 'Hello from verification script' },
            sessionId: 'test-session',
            stepType: 'verification',
            payload: { test: true },
        }).returning();

        console.log('✅ Successfully inserted test record:', result);
        process.exit(0);
    } catch (error) {
        console.error('❌ Database test failed:', error);
        process.exit(1);
    }
}

main();
