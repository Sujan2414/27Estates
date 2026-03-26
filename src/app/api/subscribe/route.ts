import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for server-side operations
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const { email, name } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Check if already subscribed
        const { data: existing } = await supabase
            .from('newsletter_subscribers')
            .select('id')
            .eq('email', email)
            .single();

        if (existing) {
            return NextResponse.json({ message: 'Already subscribed' }, { status: 200 });
        }

        // Insert new subscriber
        const { error } = await supabase
            .from('newsletter_subscribers')
            .insert({
                email,
                name: name || null,
                subscribed_at: new Date().toISOString(),
                is_active: true,
            });

        if (error) throw error;

        return NextResponse.json({ message: 'Subscribed successfully' }, { status: 201 });
    } catch (error: any) {
        console.error('Subscribe error:', error);
        return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
    }
}
