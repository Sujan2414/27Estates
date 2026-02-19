/**
 * One-time seed script to populate the Supabase blogs table
 * from the hardcoded blog-data.ts posts.
 *
 * Usage:
 *   node scripts/seed-blogs.js
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * (reads from .env.local automatically)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
            process.env[key] = val;
        }
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse date string like "Jan 28, 2026" into ISO
function parseDate(dateStr) {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

// Blog data extracted from src/lib/blog-data.ts
const posts = [
    {
        slug: 'future-luxury-living-bangalore',
        title: 'The Future of Luxury Living in Bangalore',
        excerpt: 'Exploring how sustainable design and smart home technology are redefining high-end residential spaces in North Bangalore.',
        author: '27 Estates Research',
        cover_image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80',
        tags: ['Market Trends', 'Luxury Living', 'Technology'],
        reading_time: '14 min read',
        date: 'Jan 28, 2026',
    },
    {
        slug: 'commercial-real-estate-2026-outlook',
        title: 'Commercial Real Estate: 2026 Outlook for India',
        excerpt: 'With Global Capability Centers expanding their footprint, we analyze the shifting demand for Grade A office spaces and flexible work environments.',
        author: '27 Estates Research',
        cover_image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80',
        tags: ['Commercial', 'Investment', 'GCC'],
        reading_time: '15 min read',
        date: 'Jan 25, 2026',
    },
    {
        slug: 'investing-land-complete-guide',
        title: 'Investing in Land: A Complete Guide for First-Time Buyers',
        excerpt: 'From zoning regulations to long-term appreciation, this comprehensive guide covers everything investors need to know about land acquisition.',
        author: '27 Estates Research',
        cover_image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=80',
        tags: ['Investment', 'Land', 'Due Diligence'],
        reading_time: '16 min read',
        date: 'Jan 22, 2026',
    },
    {
        slug: 'villa-vs-apartment-guide',
        title: 'Villa vs Apartment: Making the Right Choice in 2026',
        excerpt: 'We break down the pros and cons of villas versus apartments in Bangalore\'s premium locations for lifestyle and investment.',
        author: '27 Estates Research',
        cover_image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=2000&q=80',
        tags: ['Buying Guide', 'Residential', 'Lifestyle'],
        reading_time: '15 min read',
        date: 'Jan 18, 2026',
    },
    {
        slug: 'property-registration-karnataka',
        title: 'Understanding Property Registration in Karnataka',
        excerpt: 'A step-by-step guide to property registration, including stamp duty calculations, required documents, and tips for smooth transactions.',
        author: '27 Estates Legal',
        cover_image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=2000&q=80',
        tags: ['Legal', 'Documentation', 'Karnataka'],
        reading_time: '14 min read',
        date: 'Jan 15, 2026',
    },
    {
        slug: 'top-investment-localities-bangalore',
        title: 'Top 5 Emerging Localities for Property Investment in Bangalore',
        excerpt: 'Discover the next big investment hotspots. We analyze infrastructure developments, appreciation trends, and growth potential.',
        author: '27 Estates Research',
        cover_image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=2000&q=80',
        tags: ['Investment', 'Market Analysis', 'Bangalore'],
        reading_time: '16 min read',
        date: 'Jan 12, 2026',
    },
    {
        slug: 'understanding-rera-buyers-guide',
        title: "Understanding RERA: A Comprehensive Buyer's Guide",
        excerpt: 'How the Real Estate Regulatory Authority protects your interests and what to check before buying any property.',
        author: '27 Estates Legal',
        cover_image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=2000&q=80',
        tags: ['Regulatory', 'Buyer Protection', 'Legal'],
        reading_time: '14 min read',
        date: 'Jan 8, 2026',
    },
    {
        slug: 'smart-home-technology-trends',
        title: 'Smart Home Technology Trends Reshaping Real Estate',
        excerpt: 'From AI-powered assistants to integrated security, discover how technology is becoming a key differentiator in premium properties.',
        author: '27 Estates Research',
        cover_image: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?auto=format&fit=crop&w=2000&q=80',
        tags: ['Technology', 'Smart Home', 'Innovation'],
        reading_time: '14 min read',
        date: 'Jan 5, 2026',
    },
    {
        slug: 'sustainable-architecture-real-estate',
        title: 'Sustainable Architecture in Modern Real Estate',
        excerpt: 'How green building practices are transforming development standards and creating long-term value for property owners.',
        author: '27 Estates Research',
        cover_image: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=2000&q=80',
        tags: ['Sustainability', 'Green Building', 'Architecture'],
        reading_time: '15 min read',
        date: 'Jan 2, 2026',
    },
    {
        slug: 'warehouse-logistics-investment',
        title: 'Warehouse & Logistics: The Silent Real Estate Winner',
        excerpt: "E-commerce growth is driving unprecedented demand for warehousing. Here's how to capitalize on this emerging asset class.",
        author: '27 Estates Research',
        cover_image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2000&q=80',
        tags: ['Industrial', 'Warehousing', 'Investment'],
        reading_time: '14 min read',
        date: 'Dec 28, 2025',
    },
    {
        slug: 'co-living-spaces-trend',
        title: 'Co-Living Spaces: The New Urban Living Trend',
        excerpt: "Young professionals are embracing community living. Understanding this segment's potential for investors and developers.",
        author: '27 Estates Research',
        cover_image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2000&q=80',
        tags: ['Trends', 'Co-Living', 'Rental'],
        reading_time: '14 min read',
        date: 'Dec 24, 2025',
    },
    {
        slug: 'home-loan-strategies-2026',
        title: 'Home Loan Strategies for Maximum Benefit in 2026',
        excerpt: 'Navigate the home loan landscape with expert tips on comparing rates, tax benefits, and prepayment strategies.',
        author: '27 Estates Finance',
        cover_image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=2000&q=80',
        tags: ['Finance', 'Home Loan', 'Tax Benefits'],
        reading_time: '15 min read',
        date: 'Dec 20, 2025',
    },
    {
        slug: 'nri-property-investment-guide',
        title: 'NRI Property Investment: A Complete Guide for Overseas Indians',
        excerpt: 'Navigate regulations, tax implications, and repatriation rules for NRI property investments in India.',
        author: '27 Estates Legal',
        cover_image: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=2000&q=80',
        tags: ['NRI Investment', 'International', 'Legal'],
        reading_time: '16 min read',
        date: 'Dec 16, 2025',
    },
    {
        slug: 'impact-metro-property-values',
        title: 'Impact of Metro Expansion on Bangalore Property Values',
        excerpt: 'Analyzing how metro connectivity is reshaping property valuations and creating new investment corridors.',
        author: '27 Estates Research',
        cover_image: 'https://images.unsplash.com/photo-1577415124269-fc1140a69e91?auto=format&fit=crop&w=2000&q=80',
        tags: ['Infrastructure', 'Metro', 'Investment'],
        reading_time: '15 min read',
        date: 'Dec 12, 2025',
    },
    {
        slug: 'rental-yield-analysis-bangalore',
        title: 'Rental Yield Analysis: Where to Invest in Bangalore',
        excerpt: 'A data-driven analysis of rental yields across Bangalore\'s neighborhoods to identify the best investment opportunities.',
        author: '27 Estates Research',
        cover_image: 'https://images.unsplash.com/photo-1560520031-3a4dc4e9de0c?auto=format&fit=crop&w=2000&q=80',
        tags: ['Analysis', 'Rental', 'Investment'],
        reading_time: '16 min read',
        date: 'Dec 8, 2025',
    },
];

async function seed() {
    console.log(`Seeding ${posts.length} blog posts...`);

    // Read the full content from blog-data.ts
    const blogDataPath = path.join(__dirname, '..', 'src', 'lib', 'blog-data.ts');
    const blogDataContent = fs.readFileSync(blogDataPath, 'utf-8');

    for (const post of posts) {
        // Check if slug already exists
        const { data: existing } = await supabase
            .from('blogs')
            .select('id')
            .eq('slug', post.slug)
            .single();

        if (existing) {
            console.log(`  SKIP: "${post.slug}" already exists`);
            continue;
        }

        // Extract the content block for this post from the TS file
        // Find content between: slug: "xxx" and look back for content: `
        const slugIdx = blogDataContent.indexOf(`slug: "${post.slug}"`);
        let content = '<p>Content coming soon.</p>';

        if (slugIdx !== -1) {
            // Search backwards from slug for content: `
            const beforeSlug = blogDataContent.substring(0, slugIdx);
            const contentStart = beforeSlug.lastIndexOf('content: `');
            if (contentStart !== -1) {
                const afterContentStart = blogDataContent.substring(contentStart + 'content: `'.length);
                const contentEnd = afterContentStart.indexOf('`,');
                if (contentEnd !== -1) {
                    content = afterContentStart.substring(0, contentEnd).trim();
                }
            }
        }

        const { error } = await supabase
            .from('blogs')
            .insert({
                slug: post.slug,
                title: post.title,
                excerpt: post.excerpt,
                content: content,
                author: post.author,
                cover_image: post.cover_image,
                tags: post.tags,
                reading_time: post.reading_time,
                published_at: parseDate(post.date),
            });

        if (error) {
            console.error(`  ERROR: "${post.slug}" — ${error.message}`);
        } else {
            console.log(`  OK: "${post.slug}"`);
        }
    }

    console.log('Done!');
}

seed().catch(console.error);
