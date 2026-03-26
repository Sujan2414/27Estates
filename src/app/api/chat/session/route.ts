import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/chat/session - Create a new chat session
export async function POST(request: NextRequest) {
    try {
        const { visitorId } = await request.json()

        const { data, error } = await supabase
            .from('chat_sessions')
            .insert({ visitor_id: visitorId || 'anonymous' })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ session: data }, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }
}
