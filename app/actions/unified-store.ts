'use server'

import { db } from '@/db'
import { projectActivities } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'

export async function saveActivity(
    stepName: string,
    activityType: string,
    details: any,
    options?: {
        sessionId?: string
        stepType?: string
        payload?: any
    }
) {
    try {
        const result = await db.insert(projectActivities).values({
            stepName,
            activityType,
            details,
            sessionId: options?.sessionId,
            stepType: options?.stepType,
            payload: options?.payload,
        }).returning()

        return { success: true, data: result[0] }
    } catch (error) {
        console.error('Failed to save activity:', error)
        return { success: false, error: 'Failed to save activity' }
    }
}

export async function getActivities(activityType?: string) {
    try {
        let query = db.select().from(projectActivities).orderBy(desc(projectActivities.createdAt))

        if (activityType) {
            // @ts-ignore
            query = query.where(eq(projectActivities.activityType, activityType))
        }

        const result = await query
        return { success: true, data: result }
    } catch (error) {
        console.error('Failed to get activities:', error)
        return { success: false, error: 'Failed to get activities' }
    }
}
