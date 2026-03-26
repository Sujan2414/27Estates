export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Checks whether a given email has been confirmed in Supabase Auth.
// Used by the signup waiting screen to poll cross-device.
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    if (!email) return NextResponse.json({ confirmed: false })

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const user = data?.users?.find(u => u.email === email)

    return NextResponse.json({ confirmed: !!user?.email_confirmed_at })
}
