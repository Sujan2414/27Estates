import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const MIGRATIONS: { id: string; sql: string }[] = [
    {
        id: 'add_floor_details',
        sql: 'ALTER TABLE properties ADD COLUMN IF NOT EXISTS floor_details jsonb;',
    },
    {
        id: 'add_parking_count',
        sql: 'ALTER TABLE properties ADD COLUMN IF NOT EXISTS parking_count integer;',
    },
]

async function runSQL(sql: string): Promise<{ ok: boolean; error?: string }> {
    // Try Supabase pg-meta endpoint (available on self-hosted / JioBase)
    const res = await fetch(`${SUPABASE_URL}/pg/query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'apikey': SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({ query: sql }),
    })

    if (res.ok) return { ok: true }

    const text = await res.text()
    return { ok: false, error: `${res.status}: ${text}` }
}

export async function POST() {
    const results: { id: string; status: string; error?: string }[] = []

    for (const migration of MIGRATIONS) {
        const { ok, error } = await runSQL(migration.sql)
        results.push({ id: migration.id, status: ok ? 'applied' : 'failed', error })
    }

    const allOk = results.every(r => r.status === 'applied')
    return NextResponse.json({ success: allOk, results }, { status: allOk ? 200 : 500 })
}

export async function GET() {
    // Check which columns exist
    const checks = await Promise.all(
        MIGRATIONS.map(async (m) => {
            const columnName = m.id.replace('add_', '')
            const res = await fetch(
                `${SUPABASE_URL}/pg/columns?table_id=properties&name=${columnName}`,
                {
                    headers: {
                        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                        'apikey': SERVICE_ROLE_KEY,
                    },
                }
            )
            return { id: m.id, exists: res.ok }
        })
    )
    return NextResponse.json({ columns: checks })
}
