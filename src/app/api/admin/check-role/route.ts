export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service-role client — bypasses RLS entirely
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
    try {
        const { userId } = await request.json()
        if (!userId) return NextResponse.json({ role: null }, { status: 400 })

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .limit(1)
            .maybeSingle()

        if (error) {
            console.error('check-role error:', error)
            return NextResponse.json({ role: null }, { status: 500 })
        }

        return NextResponse.json({ role: data?.role || null })
    } catch (err) {
        console.error('check-role exception:', err)
        return NextResponse.json({ role: null }, { status: 500 })
    }
}
