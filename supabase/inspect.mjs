// Quick DB inspection via Supabase REST API
import { createClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const sb = createClient(URL, KEY, { auth: { persistSession: false } })

async function checkTable(name, selectCols = '*') {
    const { data, error } = await sb.from(name).select(selectCols).limit(1)
    return { data, error }
}

async function main() {
    console.log('\n════════════════════════════════════════════')
    console.log('  SUPABASE DATABASE INSPECTION')
    console.log('════════════════════════════════════════════\n')

    // ── 1. Check all tables ──────────────────────────────────
    const tables = [
        'properties', 'projects', 'agents', 'owners', 'developers',
        'inquiries', 'property_submissions', 'profiles', 'blogs',
        'user_bookmarks', 'newsletter_subscribers'
    ]

    console.log('── TABLE STATUS ──────────────────────────────')
    for (const t of tables) {
        const { data, error } = await checkTable(t)
        if (error) {
            console.log(`  ❌ ${t.padEnd(25)} → ${error.code} ${error.message?.slice(0, 60)}`)
        } else {
            console.log(`  ✅ ${t.padEnd(25)} → accessible (${data.length} row returned)`)
        }
    }

    // ── 2. Properties columns ────────────────────────────────
    console.log('\n── PROPERTIES COLUMNS ────────────────────────')
    const { data: props } = await sb.from('properties').select('*').limit(1)
    if (props?.[0]) {
        const cols = Object.keys(props[0]).sort()
        // Check for columns we NEED
        const needed = [
            'suitable_for', 'unique_feature', 'visibility', 'refer_by',
            'branch', 'connectivity', 'floor_plans', 'video_url',
            'floor_number', 'total_floors', 'sub_category', 'amenities',
            'pricing_details', 'commercial_details', 'warehouse_details'
        ]
        for (const col of needed) {
            const exists = cols.includes(col)
            console.log(`  ${exists ? '✅' : '❌'} ${col}`)
        }
        console.log(`\n  All columns (${cols.length}):`, cols.join(', '))

        // Show category of existing rows
        const { data: cats } = await sb.from('properties').select('category').limit(20)
        const uniqueCats = [...new Set(cats?.map(r => r.category))].sort()
        console.log('\n  Existing categories in DB:', uniqueCats.join(', '))
    } else {
        console.log('  (no rows or no access)')
    }

    // ── 3. property_submissions columns ─────────────────────
    console.log('\n── PROPERTY_SUBMISSIONS COLUMNS ──────────────')
    const { data: subs } = await sb.from('property_submissions').select('*').limit(1)
    if (subs?.[0]) {
        const cols = Object.keys(subs[0]).sort()
        console.log('  Columns:', cols.join(', '))
        const hasPropertyCategory = cols.includes('property_category')
        console.log(`  property_category column: ${hasPropertyCategory ? '✅ exists' : '❌ MISSING'}`)
    } else {
        // try without content
        const { data: empty, error: emptyErr } = await sb.from('property_submissions').select('id').limit(1)
        if (emptyErr) {
            console.log('  ❌ Cannot access:', emptyErr.message)
        } else {
            console.log('  Table is empty — cannot determine columns via REST')
        }
    }

    // ── 4. Owners table ──────────────────────────────────────
    console.log('\n── OWNERS TABLE ──────────────────────────────')
    const { data: owners } = await sb.from('owners').select('*').limit(3)
    if (owners) {
        console.log(`  Row count (sample): ${owners.length}`)
        if (owners[0]) console.log('  Columns:', Object.keys(owners[0]).sort().join(', '))
    }

    // ── 5. RLS check — anon vs service role ──────────────────
    console.log('\n── RLS POLICY CHECK ──────────────────────────')
    const anonClient = createClient(
        URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { auth: { persistSession: false } }
    )

    // Anon reading properties (should work - public)
    const { data: anonProps, error: anonPropsErr } = await anonClient.from('properties').select('id').limit(1)
    console.log(`  Anon read properties:         ${anonPropsErr ? '❌ BLOCKED' : '✅ OK'}`)

    // Anon reading owners (should be BLOCKED)
    const { data: anonOwners, error: anonOwnersErr } = await anonClient.from('owners').select('id').limit(1)
    console.log(`  Anon read owners:             ${anonOwnersErr ? '✅ BLOCKED (correct)' : '⚠️  EXPOSED (should be blocked)'}`)

    // Anon reading inquiries (should be BLOCKED for SELECT)
    const { data: anonInq, error: anonInqErr } = await anonClient.from('inquiries').select('id').limit(1)
    console.log(`  Anon read inquiries:          ${anonInqErr ? '✅ BLOCKED (correct)' : '⚠️  EXPOSED'}`)

    // Anon INSERT into property_submissions (should work)
    const testSub = {
        name: '__TEST__', email: 'test@inspect.local', phone: '0000000000',
        property_type: 'Sale', deal_type: 'For Sale',
        property_details: 'Inspection test — delete me', expected_price: 1
    }
    const { data: subInsert, error: subInsertErr } = await anonClient
        .from('property_submissions').insert([testSub]).select('id')
    if (subInsertErr) {
        console.log(`  Anon INSERT property_submissions: ❌ BROKEN — ${subInsertErr.message?.slice(0, 80)}`)
    } else {
        console.log(`  Anon INSERT property_submissions: ✅ OK (id: ${subInsert?.[0]?.id})`)
        // Clean up test row
        if (subInsert?.[0]?.id) {
            await sb.from('property_submissions').delete().eq('id', subInsert[0].id)
            console.log(`  (test row cleaned up)`)
        }
    }

    // Anon INSERT into inquiries (should work)
    const { data: inqInsert, error: inqInsertErr } = await anonClient
        .from('inquiries')
        .insert([{ name: '__TEST__', email: 'test@inspect.local', message: 'inspect', status: 'new' }])
        .select('id')
    if (inqInsertErr) {
        console.log(`  Anon INSERT inquiries:            ❌ BROKEN — ${inqInsertErr.message?.slice(0, 80)}`)
    } else {
        console.log(`  Anon INSERT inquiries:            ✅ OK`)
        if (inqInsert?.[0]?.id) {
            await sb.from('inquiries').delete().eq('id', inqInsert[0].id)
        }
    }

    // ── 6. Category constraint check ─────────────────────────
    console.log('\n── CATEGORY CONSTRAINT CHECK ─────────────────')
    const testCategories = ['Duplex', 'Row Villa', 'Offices', 'Warehouse', 'Other', 'Studio', 'Penthouse']
    for (const cat of testCategories) {
        const { error: catErr } = await sb.from('properties').insert([{
            property_id: `TEST-${Date.now()}`, title: `Test ${cat}`,
            property_type: 'Sale', category: cat,
            price: 1, sqft: 1, location: 'test', bedrooms: 0, bathrooms: 0
        }]).select('id')
        if (catErr && catErr.code === '23514') {
            console.log(`  ❌ ${cat.padEnd(15)} → check constraint FAILS`)
        } else if (catErr) {
            console.log(`  ⚠️  ${cat.padEnd(15)} → other error: ${catErr.code} ${catErr.message?.slice(0, 40)}`)
        } else {
            // clean up
            await sb.from('properties').delete().like('property_id', 'TEST-%')
            console.log(`  ✅ ${cat.padEnd(15)} → accepted`)
        }
    }

    console.log('\n════════════════════════════════════════════')
    console.log('  INSPECTION COMPLETE')
    console.log('════════════════════════════════════════════\n')
}

main().catch(console.error)
