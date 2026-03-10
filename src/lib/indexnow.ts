/**
 * IndexNow API — Instantly notify Bing, Yandex, and other search engines
 * when a page is added, updated, or deleted.
 *
 * Usage:
 *   import { pingIndexNow } from '@/lib/indexnow';
 *   await pingIndexNow('/projects/some-id');
 *   await pingIndexNow(['/projects/id1', '/properties/id2']);
 */

const INDEXNOW_KEY = '27estates-indexnow-key';
const SITE_HOST = 'www.27estates.com';

export async function pingIndexNow(paths: string | string[]): Promise<void> {
    const urlList = Array.isArray(paths) ? paths : [paths];

    const fullUrls = urlList.map(p =>
        p.startsWith('http') ? p : `https://${SITE_HOST}${p.startsWith('/') ? p : '/' + p}`
    );

    try {
        // Also ping the homepage and llms-full.txt since they have dynamic content
        const allUrls = [
            ...fullUrls,
            `https://${SITE_HOST}/`,
            `https://${SITE_HOST}/llms-full.txt`,
        ];

        const response = await fetch('https://api.indexnow.org/IndexNow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
                host: SITE_HOST,
                key: INDEXNOW_KEY,
                keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
                urlList: allUrls,
            }),
        });

        if (!response.ok) {
            console.warn(`IndexNow ping failed: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        // Fail silently — don't block the user action
        console.warn('IndexNow ping error:', error);
    }
}
