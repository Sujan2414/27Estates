// Wraps inner content HTML in the 27 Estates branded email template.
// The inner content is stored between CONTENT markers so we can extract
// it back out when editing an existing template.

const MARKER_START = '<!-- 27E_CONTENT_START -->'
const MARKER_END = '<!-- 27E_CONTENT_END -->'

export function wrapWithBrandedTemplate(innerHtml: string): string {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f4;padding:40px 20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);"><tr><td style="background-color:#183C38;padding:28px 40px;text-align:center;"><img src="https://27estates.com/logo%20without%20bg%20(1).png" alt="27 Estates" width="200" style="display:block;margin:0 auto;max-width:200px;height:auto;" /></td></tr><tr><td style="padding:40px 40px 32px;font-size:15px;line-height:1.7;color:#333;">${MARKER_START}${innerHtml}${MARKER_END}</td></tr><tr><td style="background-color:#f9f9f9;padding:24px 40px;text-align:center;border-top:1px solid #eee;"><p style="margin:0;color:#aaa;font-size:12px;">© 2026 27 Estates. All rights reserved.</p><p style="margin:6px 0 0;"><a href="https://27estates.com" style="color:#183C38;font-size:12px;text-decoration:none;">27estates.com</a></p></td></tr></table></td></tr></table></body></html>`
}

export function extractInnerContent(fullHtml: string): string {
    if (!fullHtml) return ''
    const start = fullHtml.indexOf(MARKER_START)
    const end = fullHtml.indexOf(MARKER_END)
    if (start !== -1 && end !== -1) {
        return fullHtml.slice(start + MARKER_START.length, end)
    }
    // Legacy template without markers — return as-is so user can see it
    return fullHtml
}
