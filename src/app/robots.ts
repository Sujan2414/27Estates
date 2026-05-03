import { MetadataRoute } from 'next';

// Auth-gated, internal, and thin routes — disallowed for ALL crawlers
// (general + AI). Disallow for AI crawlers prevents these surfaces from
// appearing in ChatGPT / Perplexity / Gemini answers.
const DISALLOWED_PATHS = [
    '/admin/',
    '/crm/',
    '/hrms/',
    '/dashboard/',
    '/login',
    '/signup',
    '/auth/',
    '/properties/bookmarks',
    '/lumina-demo',
    '/ad-showcase',
    '/api/',
];

export default function robots(): MetadataRoute.Robots {
    const aiUserAgents = [
        'GPTBot',
        'ChatGPT-User',
        'Google-Extended',
        'PerplexityBot',
        'ClaudeBot',
        'Applebot-Extended',
    ];

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: DISALLOWED_PATHS,
            },
            ...aiUserAgents.map((agent) => ({
                userAgent: agent,
                allow: '/',
                disallow: DISALLOWED_PATHS,
            })),
        ],
        sitemap: 'https://www.27estates.com/sitemap.xml',
    };
}
