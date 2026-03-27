import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    return await updateSession(request)
}

export const config = {
    // Only run middleware on routes that need auth protection.
    // Everything else (homepage, properties, blog, api, etc.) bypasses middleware entirely.
    matcher: ['/admin/:path*', '/profile/:path*'],
}
