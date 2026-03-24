import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { session_id, page_path, page_title, duration_seconds } = body

        if (!session_id || !page_path) {
            return NextResponse.json({ ok: false }, { status: 400 })
        }

        // Try to get authenticated user from session cookie
        const userClient = await createClient()
        const { data: { user } } = await userClient.auth.getUser()

        // Use admin client to bypass RLS for insert
        const admin = await createAdminClient()
        await admin.from('user_page_views').insert({
            user_id: user?.id || null,
            user_email: user?.email || null,
            session_id,
            page_path,
            page_title: page_title || null,
            duration_seconds: Math.min(Math.max(Number(duration_seconds) || 0, 0), 3600),
        })

        return NextResponse.json({ ok: true })
    } catch {
        return NextResponse.json({ ok: false }, { status: 500 })
    }
}
