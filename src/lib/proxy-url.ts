const OLD_SUPABASE_HOST = 'ulgashwdsaxaiebtqrvf.supabase.co'
const PROXY_HOST = '27estates.jiobase.com'

/**
 * Originally rewrote Supabase URLs to jiobase.com proxy.
 * JIO block is lifted and jiobase.com is shutting down, so we return the original URL.
 * It also replaces any jiobase URLs back to supabase URLs just in case they were saved that way.
 */
export function proxyUrl(url: string | null | undefined): string {
    if (!url) return ''
    return url.replace(PROXY_HOST, OLD_SUPABASE_HOST)
}

/**
 * Rewrites all URLs in an array through the proxy.
 */
export function proxyUrls(urls: (string | null | undefined)[] | null | undefined): string[] {
    if (!urls) return []
    return urls.map(u => proxyUrl(u)).filter(Boolean)
}
