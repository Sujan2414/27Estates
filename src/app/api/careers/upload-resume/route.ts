import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const MAX_SIZE_BYTES = 25 * 1024 * 1024 // 25 MB

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const applicantName = formData.get('applicant_name') as string || 'applicant'

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Accepted: PDF, DOC, DOCX' },
                { status: 400 }
            )
        }

        if (file.size > MAX_SIZE_BYTES) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 25 MB' },
                { status: 400 }
            )
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf'
        const cleanName = applicantName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
        const fileName = `${Date.now()}-${cleanName}.${fileExt}`

        const { data, error } = await supabase.storage
            .from('career-resumes')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false,
            })

        if (error) {
            console.error('Resume upload error:', error)
            return NextResponse.json(
                { error: 'Failed to upload resume. Please try again.' },
                { status: 500 }
            )
        }

        const { data: urlData } = supabase.storage
            .from('career-resumes')
            .getPublicUrl(data.path)

        return NextResponse.json({ publicUrl: urlData.publicUrl })
    } catch (err) {
        console.error('Resume upload exception:', err)
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
        )
    }
}
