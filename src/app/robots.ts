import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: '/admin/',
            },
            // AI Crawlers — explicitly allowed for AEO
            {
                userAgent: 'GPTBot',
                allow: '/',
                disallow: '/admin/',
            },
            {
                userAgent: 'ChatGPT-User',
                allow: '/',
                disallow: '/admin/',
            },
            {
                userAgent: 'Google-Extended',
                allow: '/',
                disallow: '/admin/',
            },
            {
                userAgent: 'PerplexityBot',
                allow: '/',
                disallow: '/admin/',
            },
            {
                userAgent: 'ClaudeBot',
                allow: '/',
                disallow: '/admin/',
            },
            {
                userAgent: 'Applebot-Extended',
                allow: '/',
                disallow: '/admin/',
            },
        ],
        sitemap: 'https://www.27estates.com/sitemap.xml',
    };
}
