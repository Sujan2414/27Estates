import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const url = request.nextUrl

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, {
                            ...options,
                            maxAge: name.startsWith('sb-') ? 365 * 24 * 60 * 60 : options?.maxAge,
                        })
                    )
                },
            },
        }
    )

    // Read session from cookie only — no network call, no DB query.
    // Full role-based auth is handled inside each layout (client-side) which
    // can afford the extra round-trip without triggering middleware timeouts.
    const { data: { session } } = await supabase.auth.getSession()

    // Redirect unauthenticated users away from protected routes
    const isProtected =
        url.pathname.startsWith('/admin') && !url.pathname.startsWith('/admin/login')

    if (isProtected && !session) {
        const loginUrl = new URL('/admin/login', request.url)
        return NextResponse.redirect(loginUrl)
    }

    if (url.pathname.startsWith('/profile') && !session) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', url.pathname)
        return NextResponse.redirect(loginUrl)
    }

    return supabaseResponse
}
