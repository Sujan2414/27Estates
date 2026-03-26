import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLead } from '@/lib/crm/leads';
import { sendEmailByCategory } from '@/lib/crm/email';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const { name, email, phone, message, property_id } = await request.json();

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
                property_id: property_id || null,
            });

        if (error) throw error;

        // Auto-create lead in CRM
        createLead({
            name,
            email,
            phone: phone || undefined,
            source: 'website',
            notes: message,
            property_interest: property_id || undefined,
        }).catch(err => console.error('CRM lead creation failed:', err));

        // Send confirmation email (fire and forget)
        sendEmailByCategory('confirmation', email, { name }).catch(
            err => console.error('Confirmation email failed:', err)
        );

        return NextResponse.json(
            { message: 'Inquiry submitted successfully' },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error('Inquiry submission error:', error);
        return NextResponse.json(
            { error: 'Failed to submit inquiry' },
            { status: 500 }
        );
    }
}
