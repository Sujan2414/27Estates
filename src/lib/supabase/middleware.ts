import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const url = request.nextUrl
    const isAdminRoute = url.pathname.startsWith('/admin')

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

    // Protect /admin routes - redirect to admin login if not authenticated
    if (isAdminRoute && !url.pathname.startsWith('/admin/login')) {
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

        const allowedRoles = ['admin', 'super_admin', 'agent']
        if (!profile || !allowedRoles.includes(profile.role)) {
            const homeUrl = new URL('/', request.url)
            return NextResponse.redirect(homeUrl)
        }

        // Restrict /admin/users to admin and super_admin only
        if (url.pathname.startsWith('/admin/users') && !['admin', 'super_admin'].includes(profile.role)) {
            const adminUrl = new URL('/admin', request.url)
            return NextResponse.redirect(adminUrl)
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
