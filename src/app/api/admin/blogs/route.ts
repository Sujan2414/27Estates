import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function POST(request: Request) {
    const supabase = createAdminClient()
    const body = await request.json()
    const { data, error } = await supabase
        .from('blogs')
        .insert([body])
        .select('id')
        .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}
