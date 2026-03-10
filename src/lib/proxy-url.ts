/**
 * Normalises storage URLs — converts any old jiobase.com URLs to the real Supabase host.
 * JioBase was a temporary ISP-bypass proxy; all new uploads go directly to Supabase.
 */
export function proxyUrl(url: string | null | undefined): string {
    if (!url) return ''
    return url.replace('27estates.jiobase.com', 'ulgashwdsaxaiebtqrvf.supabase.co')
}

/**
 * Rewrites all URLs in an array through the proxy.
 */
export function proxyUrls(urls: (string | null | undefined)[] | null | undefined): string[] {
    if (!urls) return []
    return urls.map(u => proxyUrl(u)).filter(Boolean)
}
