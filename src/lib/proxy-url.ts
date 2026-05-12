/**
 * Normalises storage URLs — converts any old jiobase.com URLs to the real Supabase host.
 * JioBase was a temporary ISP-bypass proxy; all new uploads go directly to Supabase.
 */
export function proxyUrl(url: string | null | undefined): string {
    if (!url) return ''
    return url.replace('27estates.jiobase.com', 'qjesattjnuoogqgiorws.supabase.co')
             .replace('ulgashwdsaxaiebtqrvf.supabase.co', 'qjesattjnuoogqgiorws.supabase.co')
}

/**
 * Rewrites all URLs in an array through the proxy.
 */
export function proxyUrls(urls: (string | null | undefined)[] | null | undefined): string[] {
    if (!urls) return []
    return urls.map(u => proxyUrl(u)).filter(Boolean)
}

interface TransformOpts {
    /** Target render width in CSS pixels. The renderer returns at this size. */
    width?: number
    /** Target render height. Omit for aspect-preserving. */
    height?: number
    /** JPEG/WebP quality 0-100. Default 75 — good balance for photos. */
    quality?: number
    /** 'cover' (default) | 'contain' | 'fill' — how to fit to width/height. */
    resize?: 'cover' | 'contain' | 'fill'
}

/**
 * Builds a Supabase-image-transformation URL on top of `proxyUrl`. Supabase
 * Storage exposes /storage/v1/render/image/public/{bucket}/{path} which
 * accepts width/height/quality/resize as query params and returns an
 * on-the-fly resized + compressed variant (WebP when the client supports
 * it), cached at the CDN edge.
 *
 * Switching from /object/public to /render/image/public is the magic that
 * enables the transformer — without that path prefix the params are ignored
 * and the original file is served.
 *
 * Use this anywhere a photo's display size is much smaller than the source
 * (almost always — most uploads are 4-12 MP, most renders are <800 px wide).
 *
 * Non-Supabase URLs (external CDNs, data URIs) are returned unchanged.
 */
export function transformUrl(
    url: string | null | undefined,
    opts: TransformOpts = {},
): string {
    const u = proxyUrl(url)
    if (!u) return ''
    // Only transform our own Supabase Storage objects. Skip data: URIs,
    // external hosts, and anything that doesn't look like a public-storage
    // path. We also skip URLs that are already pointing at /render/image.
    if (!u.includes('/storage/v1/object/public/')) return u

    const transformed = u.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
    const params: string[] = []
    if (opts.width)   params.push(`width=${Math.round(opts.width)}`)
    if (opts.height)  params.push(`height=${Math.round(opts.height)}`)
    params.push(`quality=${Math.min(100, Math.max(20, opts.quality ?? 75))}`)
    if (opts.resize)  params.push(`resize=${opts.resize}`)
    return `${transformed}?${params.join('&')}`
}

/**
 * Convenience: transform every URL in an array. Filters out falsy results.
 */
export function transformUrls(
    urls: (string | null | undefined)[] | null | undefined,
    opts: TransformOpts = {},
): string[] {
    if (!urls) return []
    return urls.map(u => transformUrl(u, opts)).filter(Boolean)
}
