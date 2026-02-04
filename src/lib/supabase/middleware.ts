import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

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
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refreshing the auth token
    const { data: { user } } = await supabase.auth.getUser()

    // Protected routes check
    const url = request.nextUrl

    // Protect /admin routes - redirect to admin login if not authenticated
    if (url.pathname.startsWith('/admin') && !url.pathname.startsWith('/admin/login')) {
        if (!user) {
            const loginUrl = new URL('/admin/login', request.url)
            return NextResponse.redirect(loginUrl)
        }

        // Check if user is admin (you can customize this check)
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || profile.role !== 'admin') {
            const homeUrl = new URL('/', request.url)
            return NextResponse.redirect(homeUrl)
        }
    }

    // Protect /profile routes - redirect to login if not authenticated
    if (url.pathname.startsWith('/profile')) {
        if (!user) {
            const loginUrl = new URL('/login', request.url)
            loginUrl.searchParams.set('redirect', url.pathname)
            return NextResponse.redirect(loginUrl)
        }
    }

    return supabaseResponse
}
