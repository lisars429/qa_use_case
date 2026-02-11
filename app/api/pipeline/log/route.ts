import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { session_id, step_type, payload } = body

        if (!session_id || !step_type || !payload) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const query = `
      INSERT INTO pipeline_steps (session_id, step_type, payload)
      VALUES ($1, $2, $3)
      RETURNING *
    `
        const values = [session_id, step_type, JSON.stringify(payload)]

        const result = await pool.query(query, values)

        return NextResponse.json(result.rows[0], { status: 201 })
    } catch (error) {
        console.error('Database error:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
