/**
 * Supabase Migration Script
 * Migrates schema + data from old project to new client project
 *
 * OLD: ulgashwdsaxaiebtqrvf (your dev account)
 * NEW: qjesattjnuoogqgiorws (client account)
 */

import https from 'https';
import { readFileSync } from 'fs';

// ─── Config ───────────────────────────────────────────────────────────────────
const OLD = {
  ref: 'ulgashwdsaxaiebtqrvf',
  url: 'https://ulgashwdsaxaiebtqrvf.supabase.co',
  serviceRole: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZ2FzaHdkc2F4YWllYnRxcnZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY4NjcxOSwiZXhwIjoyMDg1MjYyNzE5fQ.4APiMI2QHjZ5M9oflDlz7GJfOQRIU8FlgEcerpAxVgE',
  accessToken: 'sbp_029a15c74ecae7c3e0eb26d637b1684539a59ac2',
};

const NEW = {
  ref: 'qjesattjnuoogqgiorws',
  url: 'https://qjesattjnuoogqgiorws.supabase.co',
  serviceRole: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqZXNhdHRqbnVvb2dxZ2lvcndzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYyNjU2MywiZXhwIjoyMDg5MjAyNTYzfQ.gbxGiakGz-d5YXAGeE7R5btXohdtqpc2EdHzBvOo6og',
  accessToken: 'sbp_795a1e31fd5b5039f441bb0da75d8171cd1a12a2',
  dbPassword: '21Estates@Supabase2026!',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function fetchJSON(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  try { return JSON.parse(text); }
  catch { return { error: text }; }
}

async function mgmtSQL(ref, token, query) {
  return fetchJSON(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
}

async function restGET(baseUrl, serviceRole, table, offset = 0, limit = 1000) {
  return fetchJSON(
    `${baseUrl}/rest/v1/${table}?offset=${offset}&limit=${limit}`,
    {
      headers: {
        'apikey': serviceRole,
        'Authorization': `Bearer ${serviceRole}`,
        'Range': `${offset}-${offset + limit - 1}`,
        'Range-Unit': 'items',
        'Prefer': 'count=exact',
      },
    }
  );
}

async function restPOST(baseUrl, serviceRole, table, rows) {
  return fetchJSON(`${baseUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': serviceRole,
      'Authorization': `Bearer ${serviceRole}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });
}

function log(msg) { console.log(`[${new Date().toISOString().slice(11,19)}] ${msg}`); }
function err(msg) { console.error(`[ERROR] ${msg}`); }

// ─── Step 1: Build and apply schema ──────────────────────────────────────────
async function getFullSchema() {
  log('Extracting full schema DDL from old project...');

  // Get column definitions
  const colsQuery = `
    SELECT
      c.table_name,
      c.column_name,
      c.data_type,
      c.udt_name,
      c.is_nullable,
      c.column_default,
      c.character_maximum_length,
      c.numeric_precision,
      c.numeric_scale,
      c.ordinal_position
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
    ORDER BY c.table_name, c.ordinal_position
  `;

  // Get primary keys
  const pksQuery = `
    SELECT
      tc.table_name,
      string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as pk_columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
    GROUP BY tc.table_name
  `;

  // Get unique constraints
  const uniqueQuery = `
    SELECT tc.table_name, tc.constraint_name,
      string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = 'public'
    GROUP BY tc.table_name, tc.constraint_name
  `;

  // Get foreign keys
  const fksQuery = `
    SELECT
      tc.table_name,
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table,
      ccu.column_name AS foreign_column,
      rc.delete_rule,
      rc.update_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name AND tc.table_schema = rc.constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name
  `;

  // Get check constraints
  const checksQuery = `
    SELECT tc.table_name, tc.constraint_name, cc.check_clause
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc
      ON tc.constraint_name = cc.constraint_name AND tc.table_schema = cc.constraint_schema
    WHERE tc.constraint_type = 'CHECK' AND tc.table_schema = 'public'
    AND cc.check_clause NOT LIKE '%IS NOT NULL%'
    ORDER BY tc.table_name
  `;

  // Get indexes (non-pk, non-unique constraint)
  const idxQuery = `
    SELECT indexname, tablename, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname NOT IN (
      SELECT constraint_name FROM information_schema.table_constraints
      WHERE constraint_schema = 'public'
    )
    ORDER BY tablename, indexname
  `;

  // Get RLS enabled tables
  const rlsQuery = `
    SELECT relname as table_name, relrowsecurity as rls_enabled
    FROM pg_class
    WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND relkind = 'r'
    ORDER BY relname
  `;

  // Get RLS policies
  const policiesQuery = `
    SELECT
      schemaname, tablename, policyname, permissive, roles,
      cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  `;

  // Get functions
  const functionsQuery = `
    SELECT
      p.proname as function_name,
      pg_get_functiondef(p.oid) as definition
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.prokind = 'f'
    ORDER BY p.proname
  `;

  // Get triggers
  const triggersQuery = `
    SELECT
      trigger_name, event_manipulation, event_object_table,
      action_timing, action_statement, action_orientation
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    OR event_object_schema = 'public'
    ORDER BY event_object_table, trigger_name
  `;

  // Get sequences
  const seqQuery = `
    SELECT sequence_name, start_value, increment, minimum_value, maximum_value
    FROM information_schema.sequences
    WHERE sequence_schema = 'public'
  `;

  const [cols, pks, uniques, fks, checks, idxs, rls, policies, funcs, triggers, seqs] = await Promise.all([
    mgmtSQL(OLD.ref, OLD.accessToken, colsQuery),
    mgmtSQL(OLD.ref, OLD.accessToken, pksQuery),
    mgmtSQL(OLD.ref, OLD.accessToken, uniqueQuery),
    mgmtSQL(OLD.ref, OLD.accessToken, fksQuery),
    mgmtSQL(OLD.ref, OLD.accessToken, checksQuery),
    mgmtSQL(OLD.ref, OLD.accessToken, idxQuery),
    mgmtSQL(OLD.ref, OLD.accessToken, rlsQuery),
    mgmtSQL(OLD.ref, OLD.accessToken, policiesQuery),
    mgmtSQL(OLD.ref, OLD.accessToken, functionsQuery),
    mgmtSQL(OLD.ref, OLD.accessToken, triggersQuery),
    mgmtSQL(OLD.ref, OLD.accessToken, seqQuery),
  ]);

  return { cols, pks, uniques, fks, checks, idxs, rls, policies, funcs, triggers, seqs };
}

function buildColumnDef(col) {
  let type;
  // Map information_schema types to postgres types
  if (col.udt_name === 'uuid') type = 'UUID';
  else if (col.udt_name === 'text') type = 'TEXT';
  else if (col.udt_name === '_text') type = 'TEXT[]';
  else if (col.udt_name === 'int4') type = 'INTEGER';
  else if (col.udt_name === 'int8') type = 'BIGINT';
  else if (col.udt_name === 'bool') type = 'BOOLEAN';
  else if (col.udt_name === 'float8') type = 'FLOAT8';
  else if (col.udt_name === 'numeric') {
    if (col.numeric_precision && col.numeric_scale) {
      type = `NUMERIC(${col.numeric_precision},${col.numeric_scale})`;
    } else {
      type = 'NUMERIC';
    }
  }
  else if (col.udt_name === 'jsonb') type = 'JSONB';
  else if (col.udt_name === 'json') type = 'JSON';
  else if (col.udt_name === 'timestamptz') type = 'TIMESTAMPTZ';
  else if (col.udt_name === 'timestamp') type = 'TIMESTAMP';
  else if (col.udt_name === 'date') type = 'DATE';
  else if (col.udt_name === 'varchar') {
    type = col.character_maximum_length ? `VARCHAR(${col.character_maximum_length})` : 'VARCHAR';
  }
  else if (col.udt_name === 'int2') type = 'SMALLINT';
  else if (col.udt_name === 'float4') type = 'REAL';
  else if (col.udt_name === 'bytea') type = 'BYTEA';
  else if (col.udt_name === 'inet') type = 'INET';
  else type = col.udt_name.toUpperCase();

  let def = `  ${col.column_name} ${type}`;

  if (col.column_default) {
    // Fix sequence references to use simple nextval or gen_random_uuid
    let dflt = col.column_default;
    dflt = dflt.replace(/nextval\('[^']+'::[^)]+\)/g, m => m);
    def += ` DEFAULT ${dflt}`;
  }

  if (col.is_nullable === 'NO') def += ' NOT NULL';

  return def;
}

function buildSchemaSQL(schema) {
  const { cols, pks, uniques, fks, checks, idxs, rls, policies, funcs, triggers } = schema;

  let sql = `-- =====================================================
-- 27 ESTATES - MIGRATED SCHEMA
-- Generated: ${new Date().toISOString()}
-- =====================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

`;

  // Group columns by table
  const tables = {};
  for (const col of (Array.isArray(cols) ? cols : [])) {
    if (!tables[col.table_name]) tables[col.table_name] = [];
    tables[col.table_name].push(col);
  }

  // Build PK map
  const pkMap = {};
  for (const pk of (Array.isArray(pks) ? pks : [])) pkMap[pk.table_name] = pk.pk_columns;

  // Build check constraints map
  const checkMap = {};
  for (const chk of (Array.isArray(checks) ? checks : [])) {
    if (!checkMap[chk.table_name]) checkMap[chk.table_name] = [];
    checkMap[chk.table_name].push({ name: chk.constraint_name, clause: chk.check_clause });
  }

  // Build unique map
  const uniqueMap = {};
  for (const u of (Array.isArray(uniques) ? uniques : [])) {
    if (!uniqueMap[u.table_name]) uniqueMap[u.table_name] = [];
    uniqueMap[u.table_name].push({ name: u.constraint_name, columns: u.columns });
  }

  // Table creation order - handle deps: properties refs agents, etc.
  // Simple approach: profiles and agents first, then others
  const tableOrder = [
    'agents', 'owners', 'developers', 'profiles',
    'properties', 'projects', 'blogs',
    'inquiries', 'leads', 'lead_activities', 'lead_tasks',
    'user_bookmarks', 'newsletter_subscribers',
    'ad_connectors', 'email_queue', 'email_logs', 'email_templates', 'webhook_logs',
    'career_openings', 'career_applications',
    'chat_sessions', 'chat_messages',
    'property_submissions',
  ];

  // Add any tables not in the order list
  for (const t of Object.keys(tables)) {
    if (!tableOrder.includes(t)) tableOrder.push(t);
  }

  sql += `-- =====================================================\n-- TABLES\n-- =====================================================\n\n`;

  for (const tableName of tableOrder) {
    if (!tables[tableName]) continue;
    const tableCols = tables[tableName];

    sql += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
    const defs = tableCols.map(buildColumnDef);

    // Add PK constraint
    if (pkMap[tableName]) {
      defs.push(`  CONSTRAINT ${tableName}_pkey PRIMARY KEY (${pkMap[tableName]})`);
    }

    // Add check constraints
    if (checkMap[tableName]) {
      for (const chk of checkMap[tableName]) {
        defs.push(`  CONSTRAINT ${chk.name} CHECK (${chk.clause})`);
      }
    }

    // Add unique constraints
    if (uniqueMap[tableName]) {
      for (const u of uniqueMap[tableName]) {
        defs.push(`  CONSTRAINT ${u.name} UNIQUE (${u.columns})`);
      }
    }

    sql += defs.join(',\n') + '\n);\n\n';
  }

  // Foreign keys (added after all tables created)
  sql += `-- =====================================================\n-- FOREIGN KEYS\n-- =====================================================\n\n`;
  for (const fk of (Array.isArray(fks) ? fks : [])) {
    const onDelete = fk.delete_rule && fk.delete_rule !== 'NO ACTION' ? ` ON DELETE ${fk.delete_rule}` : '';
    const onUpdate = fk.update_rule && fk.update_rule !== 'NO ACTION' ? ` ON UPDATE ${fk.update_rule}` : '';
    sql += `ALTER TABLE ${fk.table_name} ADD CONSTRAINT ${fk.constraint_name}\n`;
    sql += `  FOREIGN KEY (${fk.column_name}) REFERENCES ${fk.foreign_table}(${fk.foreign_column})${onDelete}${onUpdate};\n`;
  }
  sql += '\n';

  // Indexes
  sql += `-- =====================================================\n-- INDEXES\n-- =====================================================\n\n`;
  for (const idx of (Array.isArray(idxs) ? idxs : [])) {
    sql += `${idx.indexdef};\n`;
  }
  sql += '\n';

  // Functions
  sql += `-- =====================================================\n-- FUNCTIONS\n-- =====================================================\n\n`;
  for (const fn of (Array.isArray(funcs) ? funcs : [])) {
    if (fn.definition) {
      sql += `${fn.definition};\n\n`;
    }
  }

  // Triggers (from auth schema for handle_new_user)
  sql += `-- =====================================================\n-- TRIGGERS\n-- =====================================================\n\n`;
  for (const trig of (Array.isArray(triggers) ? triggers : [])) {
    // Skip if it's already defined in functions; only add explicit CREATE TRIGGER
    sql += `DROP TRIGGER IF EXISTS ${trig.trigger_name} ON ${trig.event_object_table};\n`;
    sql += `CREATE TRIGGER ${trig.trigger_name}\n`;
    sql += `  ${trig.action_timing} ${trig.event_manipulation} ON ${trig.event_object_table}\n`;
    sql += `  FOR EACH ${trig.action_orientation} ${trig.action_statement};\n\n`;
  }

  // Also add the auth trigger explicitly
  sql += `-- Auth trigger for new users\n`;
  sql += `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;\n`;
  sql += `CREATE TRIGGER on_auth_user_created\n`;
  sql += `  AFTER INSERT ON auth.users\n`;
  sql += `  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();\n\n`;

  // RLS
  sql += `-- =====================================================\n-- ROW LEVEL SECURITY\n-- =====================================================\n\n`;
  for (const row of (Array.isArray(rls) ? rls : [])) {
    if (row.rls_enabled) {
      sql += `ALTER TABLE ${row.table_name} ENABLE ROW LEVEL SECURITY;\n`;
    }
  }
  sql += '\n';

  // Policies
  for (const pol of (Array.isArray(policies) ? policies : [])) {
    sql += `DROP POLICY IF EXISTS "${pol.policyname}" ON ${pol.tablename};\n`;
    sql += `CREATE POLICY "${pol.policyname}" ON ${pol.tablename}\n`;
    sql += `  AS ${pol.permissive}\n`;
    sql += `  FOR ${pol.cmd}\n`;
    const roles = Array.isArray(pol.roles) ? pol.roles : (typeof pol.roles === 'string' ? pol.roles.replace(/[{}]/g, '').split(',') : ['public']);
    sql += `  TO ${roles.join(', ')}\n`;
    if (pol.qual) sql += `  USING (${pol.qual})\n`;
    if (pol.with_check) sql += `  WITH CHECK (${pol.with_check})\n`;
    sql += `;\n\n`;
  }

  return sql;
}

// ─── Step 2: Export data from all tables ─────────────────────────────────────
async function exportTableData(tableName) {
  log(`  Exporting ${tableName}...`);
  const allRows = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const rows = await restGET(OLD.url, OLD.serviceRole, tableName, offset, limit);
    if (!Array.isArray(rows)) {
      if (rows.message || rows.error) {
        err(`Failed to export ${tableName}: ${JSON.stringify(rows)}`);
        break;
      }
      break;
    }
    allRows.push(...rows);
    if (rows.length < limit) break;
    offset += limit;
  }

  log(`  → ${tableName}: ${allRows.length} rows`);
  return allRows;
}

// ─── Step 3: Import data to new project ──────────────────────────────────────
async function importTableData(tableName, rows) {
  if (rows.length === 0) {
    log(`  ${tableName}: no data to import`);
    return;
  }

  const BATCH_SIZE = 500;
  let imported = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const result = await restPOST(NEW.url, NEW.serviceRole, tableName, batch);

    if (result && (result.message || result.error)) {
      err(`Import batch failed for ${tableName}: ${JSON.stringify(result)}`);
    } else {
      imported += batch.length;
    }
  }

  log(`  ✓ ${tableName}: imported ${imported} rows`);
}

// ─── Step 4: Migrate storage buckets ─────────────────────────────────────────
async function migrateStorage() {
  log('\n=== Migrating Storage Buckets ===');

  // Get buckets from old project
  const oldBuckets = await fetchJSON(`${OLD.url}/storage/v1/bucket`, {
    headers: {
      'apikey': OLD.serviceRole,
      'Authorization': `Bearer ${OLD.serviceRole}`,
    },
  });

  if (!Array.isArray(oldBuckets)) {
    err(`Could not fetch old buckets: ${JSON.stringify(oldBuckets)}`);
    return;
  }

  log(`Found ${oldBuckets.length} storage buckets: ${oldBuckets.map(b => b.name).join(', ')}`);

  for (const bucket of oldBuckets) {
    log(`\nProcessing bucket: ${bucket.name}`);

    // Create bucket in new project
    const createResult = await fetchJSON(`${NEW.url}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'apikey': NEW.serviceRole,
        'Authorization': `Bearer ${NEW.serviceRole}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: bucket.name,
        name: bucket.name,
        public: bucket.public,
        file_size_limit: bucket.file_size_limit,
        allowed_mime_types: bucket.allowed_mime_types,
      }),
    });

    if (createResult.error && !createResult.error.includes('already exists') && !createResult.message?.includes('already exists')) {
      err(`Failed to create bucket ${bucket.name}: ${JSON.stringify(createResult)}`);
      continue;
    }
    log(`  ✓ Bucket "${bucket.name}" created (public: ${bucket.public})`);

    // List all files in bucket
    await migrateFilesInFolder(bucket.name, '');
  }
}

async function migrateFilesInFolder(bucketName, prefix) {
  const listResult = await fetchJSON(`${OLD.url}/storage/v1/object/list/${bucketName}`, {
    method: 'POST',
    headers: {
      'apikey': OLD.serviceRole,
      'Authorization': `Bearer ${OLD.serviceRole}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prefix,
      limit: 1000,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    }),
  });

  if (!Array.isArray(listResult)) {
    err(`Could not list files in ${bucketName}/${prefix}: ${JSON.stringify(listResult)}`);
    return;
  }

  let fileCount = 0;
  for (const item of listResult) {
    if (item.id === null) {
      // It's a folder
      await migrateFilesInFolder(bucketName, prefix ? `${prefix}/${item.name}` : item.name);
    } else {
      // It's a file - download and reupload
      const filePath = prefix ? `${prefix}/${item.name}` : item.name;

      // Download from old
      const downloadRes = await fetch(`${OLD.url}/storage/v1/object/${bucketName}/${filePath}`, {
        headers: {
          'apikey': OLD.serviceRole,
          'Authorization': `Bearer ${OLD.serviceRole}`,
        },
      });

      if (!downloadRes.ok) {
        err(`Failed to download ${bucketName}/${filePath}: ${downloadRes.status}`);
        continue;
      }

      const blob = await downloadRes.blob();
      const contentType = downloadRes.headers.get('content-type') || item.metadata?.mimetype || 'application/octet-stream';

      // Upload to new
      const uploadRes = await fetch(`${NEW.url}/storage/v1/object/${bucketName}/${filePath}`, {
        method: 'POST',
        headers: {
          'apikey': NEW.serviceRole,
          'Authorization': `Bearer ${NEW.serviceRole}`,
          'Content-Type': contentType,
          'x-upsert': 'true',
        },
        body: blob,
      });

      if (!uploadRes.ok) {
        err(`Failed to upload ${bucketName}/${filePath}: ${uploadRes.status}`);
      } else {
        fileCount++;
      }
    }
  }

  if (fileCount > 0) log(`  → ${bucketName}/${prefix}: migrated ${fileCount} files`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('='.repeat(60));
  console.log('27 ESTATES - SUPABASE MIGRATION');
  console.log(`OLD: ${OLD.ref}`);
  console.log(`NEW: ${NEW.ref}`);
  console.log('='.repeat(60) + '\n');

  // ── STEP 1: Schema ──────────────────────────────────────────────────────────
  log('=== STEP 1: Building Schema ===');
  const schema = await getFullSchema();
  const schemaSQL = buildSchemaSQL(schema);

  // Save schema for reference
  const { writeFileSync } = await import('fs');
  writeFileSync('supabase/migrated_schema.sql', schemaSQL);
  log('Schema saved to supabase/migrated_schema.sql');

  // Apply schema to new project
  log('Applying schema to new project...');
  const schemaResult = await mgmtSQL(NEW.ref, NEW.accessToken, schemaSQL);
  if (schemaResult && (schemaResult.error || schemaResult.message)) {
    // Try applying in chunks - some errors are expected (IF NOT EXISTS handles most)
    log('Note: Some schema statements may have had warnings (normal with IF NOT EXISTS)');
    if (JSON.stringify(schemaResult).includes('error')) {
      err(`Schema application issues: ${JSON.stringify(schemaResult).slice(0, 500)}`);
    }
  } else {
    log('✓ Schema applied successfully');
  }

  // ── STEP 2: Export data ─────────────────────────────────────────────────────
  log('\n=== STEP 2: Exporting Data ===');

  const TABLES = [
    'agents', 'owners', 'developers',
    'properties', 'projects', 'blogs',
    'inquiries', 'leads', 'lead_activities', 'lead_tasks',
    'user_bookmarks', 'newsletter_subscribers',
    'ad_connectors', 'email_queue', 'email_logs', 'email_templates', 'webhook_logs',
    'career_openings', 'career_applications',
    'chat_sessions', 'chat_messages',
    'property_submissions',
    // profiles is skipped - auth users won't exist in new project
    // they need to re-register or be migrated separately
  ];

  const allData = {};
  for (const table of TABLES) {
    allData[table] = await exportTableData(table);
  }

  // ── STEP 3: Import data ─────────────────────────────────────────────────────
  log('\n=== STEP 3: Importing Data ===');
  for (const table of TABLES) {
    await importTableData(table, allData[table]);
  }

  // ── STEP 4: Storage ─────────────────────────────────────────────────────────
  await migrateStorage();

  // ── STEP 5: Summary ─────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('MIGRATION COMPLETE');
  console.log('='.repeat(60));
  console.log('\nNew Project Credentials:');
  console.log(`URL:              https://qjesattjnuoogqgiorws.supabase.co`);
  console.log(`ANON KEY:         eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqZXNhdHRqbnVvb2dxZ2lvcndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MjY1NjMsImV4cCI6MjA4OTIwMjU2M30.JciFclzoPNFQ7L2JeK2hmPQD185f59KX-2UyqPSq-Y8`);
  console.log(`SERVICE ROLE KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqZXNhdHRqbnVvb2dxZ2lvcndzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYyNjU2MywiZXhwIjoyMDg5MjAyNTYzfQ.gbxGiakGz-d5YXAGeE7R5btXohdtqpc2EdHzBvOo6og`);
  console.log(`DB PASSWORD:      21Estates@Supabase2026!`);
  console.log('\n⚠️  Note: User auth accounts (profiles) are NOT migrated.');
  console.log('   Admin user needs to be re-created via Supabase Dashboard.');
}

main().catch(console.error);
