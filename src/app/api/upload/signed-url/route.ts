export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { fileName, folder, contentType } = await request.json()

        if (!fileName) {
            return NextResponse.json({ error: 'No filename provided' }, { status: 400 })
        }

        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf']
        if (contentType && !ALLOWED_TYPES.includes(contentType)) {
            return NextResponse.json({ error: 'File type not allowed.' }, { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const cleanName = fileName.toLowerCase().replace(/[^a-z0-9.]/g, '-').replace(/-+/g, '-')
        const timestamp = Date.now()
        const path = `${folder || 'uploads'}/${timestamp}-${cleanName}`

        const { data, error } = await supabase.storage
            .from('media')
            .createSignedUploadUrl(path)

        if (error) {
            console.error('Supabase Signed URL Error:', error)
            throw error
        }

        return NextResponse.json({
            path,
            signedUrl: data.signedUrl,
            token: data?.token
        })
    } catch (error) {
        console.error('Signed URL Endpoint Error:', error)
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}
