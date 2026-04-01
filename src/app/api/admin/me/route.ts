export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Service-role client — bypasses RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
    try {
        // Get the authenticated user from cookies (validates the JWT)
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                },
            }
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ user: null }, { status: 401 })
        }

        // Fetch profile using service role (bypasses RLS)
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('full_name, email, role, avatar_url')
            .eq('id', user.id)
            .limit(1)
            .maybeSingle()

        if (profileError || !profile) {
            return NextResponse.json({ user: null }, { status: 404 })
        }

        if (!['admin', 'super_admin', 'agent', 'manager'].includes(profile.role)) {
            return NextResponse.json({ user: null }, { status: 403 })
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: profile.email || user.email || '',
                full_name: profile.full_name || 'User',
                role: profile.role,
                avatar_url: profile.avatar_url,
            }
        })
    } catch (err) {
        console.error('admin/me error:', err)
        return NextResponse.json({ user: null }, { status: 500 })
    }
}
