import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const folder = formData.get('folder') as string || 'uploads'

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Validate file type (images and PDFs only)
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf']
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ error: 'File type not allowed. Accepted: JPEG, PNG, WebP, GIF, SVG, PDF' }, { status: 400 })
        }

        // Validate file size (max 10 MB)
        const MAX_SIZE_BYTES = 10 * 1024 * 1024
        if (file.size > MAX_SIZE_BYTES) {
            return NextResponse.json({ error: 'File too large. Maximum size is 10 MB' }, { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Clean filename
        // Sanitize filename to avoid issues
        const cleanName = file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-').replace(/-+/g, '-')
        const timestamp = Date.now()
        const fileName = `${folder}/${timestamp}-${cleanName}`

        const { data, error } = await supabase.storage
            .from('media')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false
            })

        if (error) {
            console.error('Supabase Storage Error:', error);
            throw error;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(fileName)

        return NextResponse.json({ publicUrl })
    } catch (error) {
        console.error('Upload Endpoint Error:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}
