-- ============================================
-- 27 Estates - Additional Email Templates v2
-- Run this in the Supabase SQL Editor
-- ============================================

INSERT INTO email_templates (name, subject, body_html, variables, category) VALUES
(
    'Inquiry Confirmation',
    'We received your inquiry, {{name}}',
    '<div style="font-family: ''Helvetica Neue'', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: #183C38; padding: 32px; text-align: center;">
            <h1 style="color: #BFA270; margin: 0; font-size: 24px; font-weight: 500; letter-spacing: 0.08em;">27 ESTATES</h1>
            <p style="color: rgba(191,162,112,0.6); margin: 8px 0 0; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase;">Premium Real Estate</p>
        </div>

        <div style="padding: 40px 32px;">
            <p style="color: #BFA270; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 8px;">Inquiry Received</p>
            <h2 style="color: #183C38; font-size: 22px; font-weight: 500; margin: 0 0 20px 0;">Thank you, {{name}}</h2>

            <p style="color: #4B5563; line-height: 1.7; font-size: 15px; margin-bottom: 16px;">
                We have received your inquiry and our team will get back to you within <strong>24 hours</strong>.
            </p>

            <div style="background: #f9f6f3; border-left: 3px solid #BFA270; padding: 20px 24px; margin: 24px 0;">
                <p style="color: #183C38; font-size: 14px; font-weight: 600; margin: 0 0 8px;">What happens next?</p>
                <ul style="color: #4B5563; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 18px;">
                    <li>A dedicated property consultant will review your inquiry</li>
                    <li>We will contact you via phone or email to understand your requirements</li>
                    <li>We will curate a personalised list of properties for you</li>
                </ul>
            </div>

            <p style="color: #4B5563; line-height: 1.7; font-size: 15px; margin-bottom: 24px;">
                In the meantime, feel free to explore our latest listings.
            </p>

            <a href="https://27estates.com/properties"
               style="display: inline-block; background: #183C38; color: #ffffff; padding: 14px 32px; text-decoration: none; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">
                Browse Properties
            </a>
        </div>

        <div style="background: #f9f6f3; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9CA3AF; font-size: 12px; margin: 0 0 4px;">27 Estates | Premium Real Estate, Bangalore</p>
            <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
                <a href="https://27estates.com" style="color: #BFA270; text-decoration: none;">www.27estates.com</a>
            </p>
        </div>
    </div>',
    ARRAY['{{name}}'],
    'confirmation'
),
(
    'Assigned Property Update',
    'A property has been recommended for you, {{name}}',
    '<div style="font-family: ''Helvetica Neue'', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: #183C38; padding: 32px; text-align: center;">
            <h1 style="color: #BFA270; margin: 0; font-size: 24px; font-weight: 500; letter-spacing: 0.08em;">27 ESTATES</h1>
            <p style="color: rgba(191,162,112,0.6); margin: 8px 0 0; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase;">Premium Real Estate</p>
        </div>

        <div style="padding: 40px 32px;">
            <p style="color: #BFA270; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 8px;">Property Recommendation</p>
            <h2 style="color: #183C38; font-size: 22px; font-weight: 500; margin: 0 0 20px 0;">Hi {{name}},</h2>

            <p style="color: #4B5563; line-height: 1.7; font-size: 15px; margin-bottom: 24px;">
                Your property consultant <strong>{{agent_name}}</strong> has recommended a property that matches your requirements.
            </p>

            <div style="border: 1px solid #e5e7eb; padding: 24px; margin-bottom: 28px;">
                <p style="color: #BFA270; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 12px;">Recommended Property</p>
                <h3 style="color: #183C38; font-size: 18px; font-weight: 500; margin: 0 0 8px;">{{property_title}}</h3>
                <p style="color: #6B7280; font-size: 14px; margin: 0 0 4px;">📍 {{property_location}}</p>
                <p style="color: #183C38; font-size: 20px; font-weight: 600; margin: 12px 0 0;">{{property_price}}</p>
            </div>

            <a href="{{property_url}}"
               style="display: inline-block; background: #183C38; color: #ffffff; padding: 14px 32px; text-decoration: none; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">
                View Property Details
            </a>

            <p style="color: #4B5563; font-size: 14px; margin-top: 28px; line-height: 1.6;">
                Have questions? Contact your consultant directly or <a href="https://27estates.com/contact" style="color: #183C38; font-weight: 600;">reach out to our team</a>.
            </p>
        </div>

        <div style="background: #f9f6f3; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9CA3AF; font-size: 12px; margin: 0 0 4px;">27 Estates | Premium Real Estate, Bangalore</p>
            <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
                <a href="https://27estates.com" style="color: #BFA270; text-decoration: none;">www.27estates.com</a>
            </p>
        </div>
    </div>',
    ARRAY['{{name}}', '{{agent_name}}', '{{property_title}}', '{{property_location}}', '{{property_price}}', '{{property_url}}'],
    'property_assigned'
),
(
    'General Update',
    '{{subject}}',
    '<div style="font-family: ''Helvetica Neue'', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: #183C38; padding: 32px; text-align: center;">
            <h1 style="color: #BFA270; margin: 0; font-size: 24px; font-weight: 500; letter-spacing: 0.08em;">27 ESTATES</h1>
            <p style="color: rgba(191,162,112,0.6); margin: 8px 0 0; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase;">Premium Real Estate</p>
        </div>

        <div style="padding: 40px 32px;">
            <h2 style="color: #183C38; font-size: 22px; font-weight: 500; margin: 0 0 20px 0;">Hi {{name}},</h2>

            <div style="color: #4B5563; line-height: 1.7; font-size: 15px;">
                {{message}}
            </div>

            <div style="margin-top: 32px;">
                <a href="https://27estates.com/properties"
                   style="display: inline-block; background: #183C38; color: #ffffff; padding: 14px 32px; text-decoration: none; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">
                    Explore Properties
                </a>
            </div>
        </div>

        <div style="background: #f9f6f3; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9CA3AF; font-size: 12px; margin: 0 0 4px;">27 Estates | Premium Real Estate, Bangalore</p>
            <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
                <a href="https://27estates.com" style="color: #BFA270; text-decoration: none;">www.27estates.com</a>
            </p>
        </div>
    </div>',
    ARRAY['{{name}}', '{{subject}}', '{{message}}'],
    'general'
)
ON CONFLICT DO NOTHING;

-- Also update the Welcome Email template with a better design
UPDATE email_templates
SET
    subject = 'Welcome to 27 Estates, {{name}}',
    body_html = '<div style="font-family: ''Helvetica Neue'', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: #183C38; padding: 32px; text-align: center;">
            <h1 style="color: #BFA270; margin: 0; font-size: 24px; font-weight: 500; letter-spacing: 0.08em;">27 ESTATES</h1>
            <p style="color: rgba(191,162,112,0.6); margin: 8px 0 0; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase;">Premium Real Estate</p>
        </div>

        <div style="padding: 40px 32px;">
            <p style="color: #BFA270; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 8px;">Welcome</p>
            <h2 style="color: #183C38; font-size: 22px; font-weight: 500; margin: 0 0 20px 0;">Hello {{name}},</h2>

            <p style="color: #4B5563; line-height: 1.7; font-size: 15px; margin-bottom: 16px;">
                Thank you for your interest in <strong>27 Estates</strong>. We are delighted to have you with us.
            </p>

            <p style="color: #4B5563; line-height: 1.7; font-size: 15px; margin-bottom: 24px;">
                We specialise in premium residential and commercial real estate in Bangalore. Our dedicated consultants are here to help you find exactly what you are looking for — whether it is a home, investment property, or commercial space.
            </p>

            <div style="background: #f9f6f3; border-left: 3px solid #BFA270; padding: 20px 24px; margin-bottom: 28px;">
                <p style="color: #183C38; font-size: 14px; font-weight: 600; margin: 0 0 12px;">What we offer</p>
                <ul style="color: #4B5563; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 18px;">
                    <li>Curated premium residential properties</li>
                    <li>Exclusive project launches</li>
                    <li>Commercial and warehouse spaces</li>
                    <li>End-to-end assistance from search to registration</li>
                </ul>
            </div>

            <a href="https://27estates.com/properties"
               style="display: inline-block; background: #183C38; color: #ffffff; padding: 14px 32px; text-decoration: none; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">
                Browse Properties
            </a>
        </div>

        <div style="background: #f9f6f3; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9CA3AF; font-size: 12px; margin: 0 0 4px;">27 Estates | Premium Real Estate, Bangalore</p>
            <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
                <a href="https://27estates.com" style="color: #BFA270; text-decoration: none;">www.27estates.com</a>
            </p>
        </div>
    </div>',
    updated_at = NOW()
WHERE name = 'Welcome Email';

-- Update New Property Alert template with better design
UPDATE email_templates
SET
    body_html = '<div style="font-family: ''Helvetica Neue'', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: #183C38; padding: 32px; text-align: center;">
            <h1 style="color: #BFA270; margin: 0; font-size: 24px; font-weight: 500; letter-spacing: 0.08em;">27 ESTATES</h1>
            <p style="color: rgba(191,162,112,0.6); margin: 8px 0 0; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase;">Premium Real Estate</p>
        </div>

        <div style="padding: 40px 32px;">
            <p style="color: #BFA270; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 8px;">New Listing</p>
            <h2 style="color: #183C38; font-size: 22px; font-weight: 500; margin: 0 0 12px 0;">Hi {{name}},</h2>

            <p style="color: #4B5563; line-height: 1.7; font-size: 15px; margin-bottom: 24px;">
                A new property matching your interests has just been listed on 27 Estates.
            </p>

            <div style="border: 1px solid #e5e7eb; padding: 24px; margin-bottom: 28px;">
                <p style="color: #BFA270; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 12px;">New Property</p>
                <h3 style="color: #183C38; font-size: 18px; font-weight: 500; margin: 0 0 8px;">{{property_title}}</h3>
                <p style="color: #6B7280; font-size: 14px; margin: 0 0 4px;">📍 {{property_location}}</p>
                <p style="color: #183C38; font-size: 22px; font-weight: 600; margin: 12px 0 0;">{{property_price}}</p>
            </div>

            <a href="{{property_url}}"
               style="display: inline-block; background: #183C38; color: #ffffff; padding: 14px 32px; text-decoration: none; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">
                View Property
            </a>
        </div>

        <div style="background: #f9f6f3; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9CA3AF; font-size: 12px; margin: 0 0 4px;">
                You are receiving this because you subscribed to 27 Estates updates.
            </p>
            <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
                <a href="https://27estates.com" style="color: #BFA270; text-decoration: none;">www.27estates.com</a>
            </p>
        </div>
    </div>',
    updated_at = NOW()
WHERE name = 'New Property Alert';
