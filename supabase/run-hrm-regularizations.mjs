import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_REF = 'qjesattjnuoogqgiorws'
const SUPABASE_TOKEN = process.env.SUPABASE_ACCESS_TOKEN
if (!SUPABASE_TOKEN) { console.error('Set SUPABASE_ACCESS_TOKEN'); process.exit(1) }

const sql = readFileSync(join(__dirname, 'hrm-regularizations.sql'), 'utf8')

function stripLeadingComments(s) {
    return s.split('\n').filter(l => !l.trim().startsWith('--')).join('\n').trim()
}
function splitSQL(sql) {
    const stmts = []; let current = ''; let inDQ = false; let i = 0
    while (i < sql.length) {
        if (!inDQ && sql.slice(i, i + 2) === '$$') { inDQ = true; current += '$$'; i += 2; continue }
        if (inDQ && sql.slice(i, i + 2) === '$$') { inDQ = false; current += '$$'; i += 2; continue }
        if (!inDQ && sql[i] === ';') {
            current += ';'
            const s = stripLeadingComments(current)
            if (s.length > 0) stmts.push(s)
            current = ''; i++; continue
        }
        current += sql[i]; i++
    }
    const s = stripLeadingComments(current); if (s.length > 0) stmts.push(s)
    return stmts
}

const statements = splitSQL(sql)
console.log(`Running ${statements.length} statements...\n`)
let passed = 0, failed = 0
for (const stmt of statements) {
    const query = stmt.endsWith(';') ? stmt : stmt + ';'
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${SUPABASE_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
    })
    const data = await res.json()
    const ok = res.ok || data.message?.includes('already exists') || data.message?.includes('does not exist') || data.message?.includes('duplicate column')
    if (!ok) { console.warn(`⚠  ${data.message} — ${query.slice(0, 80).replace(/\n/g, ' ')}`); failed++ }
    else { console.log(`✓  ${query.slice(0, 80).replace(/\n/g, ' ')}`); passed++ }
}
console.log(`\nDone: ${passed} passed, ${failed} failed`)
