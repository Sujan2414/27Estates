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

const sql = readFileSync(join(__dirname, 'crm-phase1.sql'), 'utf8')

// Split into statements (split on semicolons at end of lines)
const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

console.log(`Running ${statements.length} SQL statements...`)

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
            console.warn(`⚠ ${data.message || 'Error'} — ${query.slice(0, 60)}...`)
            failed++
        } else {
            console.log(`✓ ${query.slice(0, 70).replace(/\n/g, ' ')}`)
            passed++
        }
    } catch (e) {
        console.error(`✗ ${e.message}`)
        failed++
    }
}

console.log(`\nDone: ${passed} passed, ${failed} failed`)
