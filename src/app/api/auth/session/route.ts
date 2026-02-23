import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { rememberMe } = await request.json()

        if (!rememberMe) {
            const cookieStore = await cookies()
            // Find the active supabase auth cookie
            const allCookies = cookieStore.getAll()
            const supabaseCookies = allCookies.filter(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))

            // Overwrite each with Max-Age = 0 (Session cookie equivalent in browsers when omitted, 
            // but Next.js cookies API requires we don't set maxAge to make it a session cookie)
            supabaseCookies.forEach(cookie => {
                cookieStore.set({
                    name: cookie.name,
                    value: cookie.value,
                    // Omitting expires/maxAge creates a session cookie
                    httpOnly: true,
                    path: '/',
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                })
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error modifying session cookie:', error)
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
