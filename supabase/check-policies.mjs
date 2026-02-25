// Check actual live RLS policies + apply fix if needed
import { createClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const sb = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } })
const anon = createClient(URL, ANON_KEY, { auth: { persistSession: false } })

async function main() {
  console.log('\n══ POLICY CHECK ═══════════════════════════════')

  // 1. Check anon access to owners - CRITICAL
  const { data: anonOwners, error: anonOwnersErr } = await anon.from('owners').select('id').limit(1)
  console.log('\nAnon → owners SELECT:')
  if (anonOwnersErr) {
    console.log('  ✅ BLOCKED (error):', anonOwnersErr.message)
  } else if (anonOwners && anonOwners.length > 0) {
    console.log('  ❌ EXPOSED — rows returned:', anonOwners.length)
  } else {
    console.log('  ✅ BLOCKED (0 rows - RLS filtering)')
  }

  // 2. Check anon access to inquiries SELECT
  const { data: anonInqRead, error: anonInqReadErr } = await anon.from('inquiries').select('id').limit(1)
  console.log('\nAnon → inquiries SELECT:')
  if (anonInqReadErr) {
    console.log('  ✅ BLOCKED:', anonInqReadErr.message)
  } else if (anonInqRead && anonInqRead.length > 0) {
    console.log('  ❌ EXPOSED — rows returned:', anonInqRead.length)
  } else {
    console.log('  ✅ BLOCKED (0 rows)')
  }

  // 3. Check anon INSERT into inquiries
  const { data: inqIns, error: inqInsErr } = await anon
    .from('inquiries')
    .insert([{ name: 'POLICY_TEST', email: 'test@policycheck.local', message: 'policy-check', status: 'new' }])
    .select('id')
  if (inqInsErr) {
    console.log('\nAnon → inquiries INSERT: ❌ BROKEN —', inqInsErr.message)
  } else {
    console.log('\nAnon → inquiries INSERT: ✅ OK (id:', inqIns?.[0]?.id, ')')
    if (inqIns?.[0]?.id) await sb.from('inquiries').delete().eq('id', inqIns[0].id)
  }

  // 4. Check anon INSERT into property_submissions
  const { data: subIns, error: subInsErr } = await anon
    .from('property_submissions')
    .insert([{ name: 'POLICY_TEST', email: 'test@policycheck.local', phone: '0000000000', property_type: 'Sale', deal_type: 'For Sale', property_details: 'policy-check', expected_price: 1 }])
    .select('id')
  if (subInsErr) {
    console.log('\nAnon → property_submissions INSERT: ❌ BROKEN —', subInsErr.message)
  } else {
    console.log('\nAnon → property_submissions INSERT: ✅ OK (id:', subIns?.[0]?.id, ')')
    if (subIns?.[0]?.id) await sb.from('property_submissions').delete().eq('id', subIns[0].id)
  }

  // 5. Read actual policies from DB via service role
  console.log('\n══ LIVE POLICIES IN DB ═════════════════════════')
  const tables = ['owners', 'inquiries', 'property_submissions', 'properties', 'profiles']
  for (const tbl of tables) {
    const { data: pols, error: polErr } = await sb.rpc('get_policies_for_table', { tbl_name: tbl }).catch(() => ({ data: null, error: { message: 'rpc not available' } }))
    if (polErr) {
      // Try a raw select against pg_policies if accessible
      const res = await fetch(`${URL}/rest/v1/rpc/get_table_policies`, {
        method: 'POST',
        headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_table: tbl })
      })
      if (res.ok) {
        const d = await res.json()
        console.log(`\n${tbl}:`, JSON.stringify(d))
      }
    }
  }

  // Try direct REST access to pg_policies
  const r = await fetch(`${URL}/rest/v1/pg_policies?schemaname=eq.public&tablename=in.(owners,inquiries,property_submissions)&select=tablename,policyname,cmd,permissive`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Accept': 'application/json'
    }
  })
  if (r.ok) {
    const pols = await r.json()
    if (Array.isArray(pols) && pols.length > 0) {
      console.log('\nPolicies from pg_policies REST:')
      pols.forEach(p => console.log(` ${p.tablename.padEnd(25)} ${p.cmd.padEnd(8)} → ${p.policyname}`))
    } else {
      console.log('\npg_policies REST:', JSON.stringify(pols))
    }
  } else {
    const txt = await r.text()
    console.log('\npg_policies REST access failed:', r.status, txt.slice(0, 100))
  }

  console.log('\n══════════════════════════════════════════════\n')
}

main().catch(console.error)
