import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const { name, email, phone, message } = await request.json();

        if (!name || !email || !message) {
            return NextResponse.json(
                { error: 'Name, email, and message are required' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('inquiries')
            .insert({
                name,
                email,
                phone: phone || null,
                message,
                status: 'new',
            });

        if (error) throw error;

        return NextResponse.json(
            { message: 'Inquiry submitted successfully' },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Inquiry submission error:', error);
        return NextResponse.json(
            { error: 'Failed to submit inquiry' },
            { status: 500 }
        );
    }
}
