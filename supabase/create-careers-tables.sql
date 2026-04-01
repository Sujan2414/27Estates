-- ============================================
-- Careers Feature: Database Tables
-- ============================================

-- 1. Career Openings (job listings managed by admin)
CREATE TABLE IF NOT EXISTS career_openings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT 'General',
    location TEXT NOT NULL DEFAULT 'Bangalore, India',
    type TEXT NOT NULL DEFAULT 'Full-Time',
    experience TEXT,
    description TEXT,
    responsibilities TEXT[] DEFAULT '{}',
    requirements TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Career Applications (submitted by users)
CREATE TABLE IF NOT EXISTS career_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opening_id UUID NOT NULL REFERENCES career_openings(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    resume_url TEXT,
    cover_letter TEXT,
    current_company TEXT,
    experience_years TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_career_openings_active ON career_openings(is_active);
CREATE INDEX IF NOT EXISTS idx_career_applications_opening ON career_applications(opening_id);
CREATE INDEX IF NOT EXISTS idx_career_applications_status ON career_applications(status);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE career_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_applications ENABLE ROW LEVEL SECURITY;

-- Everyone (anonymous + logged-in users) can read active openings
CREATE POLICY "Anyone can view active openings"
    ON career_openings FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- Admins can do everything on openings
CREATE POLICY "Admins can manage openings"
    ON career_openings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin', 'agent')
        )
    );

-- Everyone (anonymous + logged-in users) can apply
CREATE POLICY "Anyone can submit applications"
    ON career_applications FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Admins can read and update applications
CREATE POLICY "Admins can manage applications"
    ON career_applications FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin', 'agent')
        )
    );

-- ============================================
-- Storage bucket for resumes
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('career-resumes', 'career-resumes', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload resumes"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'career-resumes');

CREATE POLICY "Anyone can read resumes"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'career-resumes');

CREATE POLICY "Admins can delete resumes"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'career-resumes'
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- ============================================
-- Dummy Career Openings (for preview)
-- ============================================

INSERT INTO career_openings (title, department, location, type, experience, description, responsibilities, requirements, is_active)
VALUES
(
    'Senior Real Estate Consultant',
    'Sales',
    'Bangalore, India',
    'Full-Time',
    '3-5 years',
    'We are looking for an experienced Real Estate Consultant to join our growing team at 27 Estates. You will work closely with high-net-worth clients, providing expert advice on premium residential and commercial properties across Bangalore. This role offers excellent growth potential and the opportunity to work with some of the most prestigious projects in the city.',
    ARRAY[
        'Manage end-to-end client relationships for premium property transactions',
        'Conduct property site visits and presentations for prospective buyers',
        'Develop and maintain a strong pipeline of qualified leads',
        'Negotiate deals and close sales while ensuring client satisfaction',
        'Stay updated on market trends, pricing, and new project launches',
        'Collaborate with marketing team on campaigns and property showcases'
    ],
    ARRAY[
        '3-5 years of experience in luxury real estate sales',
        'Excellent communication and negotiation skills',
        'Strong network in the Bangalore real estate market',
        'Proficiency in CRM tools and MS Office',
        'Bachelor''s degree in Business, Marketing, or related field',
        'Valid driving license and own vehicle preferred'
    ],
    true
),
(
    'Digital Marketing Manager',
    'Marketing',
    'Bangalore, India',
    'Full-Time',
    '2-4 years',
    'Join 27 Estates as a Digital Marketing Manager and lead our online presence strategy. You will be responsible for creating compelling digital campaigns that showcase our premium property portfolio, drive qualified leads, and build the 27 Estates brand across digital channels.',
    ARRAY[
        'Plan and execute digital marketing campaigns across SEO, SEM, social media, and email',
        'Manage and grow our social media presence on Instagram, LinkedIn, and Facebook',
        'Create engaging content including property showcases, market insights, and brand stories',
        'Analyze campaign performance and optimize for lead generation',
        'Coordinate with external agencies for video production and creative assets',
        'Manage the company website and ensure SEO best practices'
    ],
    ARRAY[
        '2-4 years of experience in digital marketing, preferably in real estate or luxury brands',
        'Strong expertise in Google Ads, Meta Ads, and SEO tools',
        'Experience with content creation and social media management',
        'Analytical mindset with proficiency in Google Analytics and reporting tools',
        'Bachelor''s degree in Marketing, Communications, or related field',
        'Portfolio of successful digital campaigns'
    ],
    true
);
