import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    const redirect = searchParams.get('redirect') || '/properties'

    const supabase = await createClient()

    // token_hash flow — works on any device/browser (cross-device confirmation)
    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
        if (!error) {
            if (type === 'recovery') return NextResponse.redirect(`${origin}/auth/reset-password`)
            if (type === 'signup' || type === 'email') return NextResponse.redirect(`${origin}/auth/confirmed`)
            return NextResponse.redirect(`${origin}${redirect}`)
        } else {
            console.error('verifyOtp error:', error)
        }
    }

    // PKCE code flow — same browser that initiated signup
    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            if (type === 'recovery') return NextResponse.redirect(`${origin}/auth/reset-password`)
            if (type === 'signup') return NextResponse.redirect(`${origin}/auth/confirmed`)
            return NextResponse.redirect(`${origin}${redirect}`)
        } else {
            console.error('exchangeCodeForSession error:', error)
        }
    }

    // Both failed — redirect to sign in (with error param if you want)
    return NextResponse.redirect(`${origin}/auth/signin?error=Verification_Failed`)
}
