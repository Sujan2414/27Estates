import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resend, FROM_EMAIL, FROM_NAME } from '@/lib/resend';

// Use service role for server-side operations
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        // Verify admin authorization via API key
        const authHeader = request.headers.get('authorization');
        const apiKey = process.env.ADMIN_API_KEY;

        if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { propertyTitle, propertyId, propertyImage, propertyPrice, propertyLocation } = await request.json();

        if (!propertyTitle || !propertyId) {
            return NextResponse.json({ error: 'Property title and ID are required' }, { status: 400 });
        }

        // Get all active subscribers
        const { data: subscribers, error: fetchError } = await supabase
            .from('newsletter_subscribers')
            .select('email, name')
            .eq('is_active', true);

        if (fetchError) throw fetchError;

        if (!subscribers || subscribers.length === 0) {
            return NextResponse.json({ message: 'No subscribers to notify' }, { status: 200 });
        }

        // Also get all registered users who opted in for notifications
        const { data: users } = await supabase
            .from('profiles')
            .select('email, first_name')
            .not('email', 'is', null);

        // Combine subscriber emails (deduplicate)
        const allEmails = new Set<string>();
        const emailRecipients: { email: string; name: string }[] = [];

        subscribers.forEach(sub => {
            if (sub.email && !allEmails.has(sub.email)) {
                allEmails.add(sub.email);
                emailRecipients.push({ email: sub.email, name: sub.name || '' });
            }
        });

        (users || []).forEach(u => {
            if (u.email && !allEmails.has(u.email)) {
                allEmails.add(u.email);
                emailRecipients.push({ email: u.email, name: u.first_name || '' });
            }
        });

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://27estates.com';

        // Send emails in batches (Resend supports batch sending)
        const batchSize = 50;
        let sentCount = 0;

        for (let i = 0; i < emailRecipients.length; i += batchSize) {
            const batch = emailRecipients.slice(i, i + batchSize);

            const emailPromises = batch.map(recipient =>
                resend.emails.send({
                    from: `${FROM_NAME} <${FROM_EMAIL}>`,
                    to: recipient.email,
                    subject: `New Listing: ${propertyTitle}`,
                    html: `
                        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
                            <div style="background: #183C38; padding: 32px; text-align: center;">
                                <h1 style="color: #BFA270; margin: 0; font-size: 24px; font-weight: 500; letter-spacing: 0.05em;">27 ESTATES</h1>
                            </div>

                            ${propertyImage ? `
                            <div style="width: 100%; overflow: hidden;">
                                <img src="${propertyImage}" alt="${propertyTitle}" style="width: 100%; height: 300px; object-fit: cover;" />
                            </div>
                            ` : ''}

                            <div style="padding: 32px;">
                                <p style="color: #BFA270; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 8px;">New Listing</p>

                                <h2 style="color: #183C38; font-size: 22px; font-weight: 500; margin: 0 0 16px 0; line-height: 1.3;">
                                    ${propertyTitle}
                                </h2>

                                ${propertyLocation ? `
                                <p style="color: #666; font-size: 14px; margin-bottom: 8px;">
                                    📍 ${propertyLocation}
                                </p>
                                ` : ''}

                                ${propertyPrice ? `
                                <p style="color: #183C38; font-size: 20px; font-weight: 600; margin-bottom: 24px;">
                                    ${propertyPrice}
                                </p>
                                ` : ''}

                                <a href="${siteUrl}/properties/${propertyId}"
                                   style="display: inline-block; background: #183C38; color: #ffffff; padding: 14px 32px; text-decoration: none; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">
                                    View Property
                                </a>
                            </div>

                            <div style="background: #f9f6f3; padding: 24px 32px; text-align: center;">
                                <p style="color: #999; font-size: 12px; margin: 0;">
                                    You're receiving this because you subscribed to 27 Estates updates.
                                </p>
                            </div>
                        </div>
                    `,
                })
            );

            await Promise.allSettled(emailPromises);
            sentCount += batch.length;
        }

        return NextResponse.json({
            message: `Notifications sent to ${sentCount} recipients`,
            count: sentCount,
        });
    } catch (error: any) {
        console.error('Notify error:', error);
        return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
    }
}
