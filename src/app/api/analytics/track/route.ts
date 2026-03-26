import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { session_id, page_path, page_title, duration_seconds } = body

        if (!session_id || !page_path) {
            return NextResponse.json({ ok: false }, { status: 400 })
        }

        const userClient = await createClient()
        const { data: { user } } = await userClient.auth.getUser()

        const admin = await createAdminClient()

        // Fetch full_name from profiles if user is authenticated
        let user_name: string | null = null
        if (user?.id) {
            const { data: profile } = await admin
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single()
            user_name = profile?.full_name ||
                user.user_metadata?.full_name ||
                user.user_metadata?.first_name ||
                user.email?.split('@')[0] ||
                null
        }

        await admin.from('user_page_views').insert({
            user_id: user?.id || null,
            user_email: user?.email || null,
            user_name,
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
