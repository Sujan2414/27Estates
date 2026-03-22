import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// 1 year in seconds — keeps the user logged in indefinitely
const PERSISTENT_MAX_AGE = 365 * 24 * 60 * 60

export async function POST() {
    try {
        const cookieStore = await cookies()
        const allCookies = cookieStore.getAll()
        const supabaseCookies = allCookies.filter(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))

        supabaseCookies.forEach(cookie => {
            cookieStore.set({
                name: cookie.name,
                value: cookie.value,
                maxAge: PERSISTENT_MAX_AGE,
                httpOnly: false,
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
            })
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error setting persistent session cookie:', error)
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
