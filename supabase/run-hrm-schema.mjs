import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const PROJECT_REF = 'qjesattjnuoogqgiorws'
const SUPABASE_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

if (!SUPABASE_TOKEN) {
    console.error('Set SUPABASE_ACCESS_TOKEN env var')
    process.exit(1)
}

const sql = readFileSync(join(__dirname, 'hrm-schema.sql'), 'utf8')

// Split on semicolons but keep dollar-quoted $$ blocks intact
// Strip leading comment lines from each statement before checking if it's meaningful
function stripLeadingComments(s) {
    return s.split('\n').filter(line => !line.trim().startsWith('--')).join('\n').trim()
}

function splitSQL(sql) {
    const stmts = []
    let current = ''
    let inDollarQuote = false
    let i = 0
    while (i < sql.length) {
        if (!inDollarQuote && sql.slice(i, i + 2) === '$$') {
            inDollarQuote = true
            current += '$$'
            i += 2
            continue
        }
        if (inDollarQuote && sql.slice(i, i + 2) === '$$') {
            inDollarQuote = false
            current += '$$'
            i += 2
            continue
        }
        if (!inDollarQuote && sql[i] === ';') {
            current += ';'
            const stripped = stripLeadingComments(current)
            if (stripped.length > 0) stmts.push(stripped)
            current = ''
            i++
            continue
        }
        current += sql[i]
        i++
    }
    const stripped = stripLeadingComments(current)
    if (stripped.length > 0) stmts.push(stripped)
    return stmts
}
const statements = splitSQL(sql)

console.log(`Running ${statements.length} HRM schema statements...\n`)

let passed = 0, failed = 0

for (const stmt of statements) {
    const query = stmt.endsWith(';') ? stmt : stmt + ';'
    try {
        const res = await fetch(
            `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
            {
                method: 'POST',
                headers: { Authorization: `Bearer ${SUPABASE_TOKEN}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ query }),
            }
        )
        const data = await res.json()
        if (!res.ok && !data.message?.includes('already exists') && !data.message?.includes('does not exist')) {
            console.warn(`⚠  ${data.message || JSON.stringify(data)} — ${query.slice(0, 80).replace(/\n/g, ' ')}`)
            failed++
        } else {
            console.log(`✓  ${query.slice(0, 80).replace(/\n/g, ' ')}`)
            passed++
        }
    } catch (e) {
        console.error(`✗  ${e.message}`)
        failed++
    }
}

console.log(`\nDone: ${passed} passed, ${failed} failed`)
