import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const type = searchParams.get('type')
    let redirect = searchParams.get('redirect') || searchParams.get('next') || '/properties'

    if (type === 'signup') {
        redirect = '/auth/confirmed'
    }

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // If this is a password recovery, redirect to reset-password page
            if (type === 'recovery') {
                return NextResponse.redirect(`${origin}/auth/reset-password`)
            }
            return NextResponse.redirect(`${origin}${redirect}`)
        }
    }

    // If there's an error, redirect to home
    return NextResponse.redirect(`${origin}/`)
}
