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
