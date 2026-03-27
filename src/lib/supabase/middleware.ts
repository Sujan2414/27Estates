import { NextResponse, type NextRequest } from 'next/server'

// Zero-network middleware: just check for the Supabase session cookie.
// No Supabase client, no network calls — impossible to timeout.
// Real auth validation (getUser + role check) happens inside each layout.
function hasSession(request: NextRequest): boolean {
    return request.cookies.getAll().some(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))
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
