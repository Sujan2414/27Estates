import { NextResponse, type NextRequest } from 'next/server'

// Zero-network middleware: just check for the Supabase session cookie.
// No Supabase client, no network calls — impossible to timeout.
// Real auth validation (getUser + role check) happens inside each layout.
function hasSession(request: NextRequest): boolean {
    // Match both regular cookies (sb-xxx-auth-token) and
    // chunked cookies (sb-xxx-auth-token.0, sb-xxx-auth-token.1, ...)
    // Supabase SSR chunks large session cookies automatically
    return request.cookies.getAll().some(c =>
        c.name.startsWith('sb-') && (
            c.name.endsWith('-auth-token') ||
            /\-auth-token\.\d+$/.test(c.name)
        )
    )
}

export async function updateSession(request: NextRequest) {
    const url = request.nextUrl
    const loggedIn = hasSession(request)

    // Protect /admin routes
    if (url.pathname.startsWith('/admin') && !url.pathname.startsWith('/admin/login')) {
        if (!loggedIn) {
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }
    }

    // Protect /profile routes
    if (url.pathname.startsWith('/profile') && !loggedIn) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', url.pathname)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next({ request })
}
