const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env = {};
envConfig.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length > 0) {
        env[key.trim()] = rest.join('=').trim();
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials (URL or SERVICE_ROLE_KEY) in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateStatuses() {
    console.log('Starting status updates...');

    // Update 'Completed' -> 'Ready to Move'
    const { data: cData, error: cError } = await supabase
        .from('projects')
        .update({ status: 'Ready to Move' })
        .eq('status', 'Completed')
        .select();

    if (cError) {
        console.error('Error updating Completed projects:', cError);
    } else {
        console.log(`Updated ${cData ? cData.length : 0} 'Completed' projects to 'Ready to Move'`);
    }

    // Update 'Pre-Launch' -> 'New Launch'
    const { data: pData, error: pError } = await supabase
        .from('projects')
        .update({ status: 'New Launch' })
        .eq('status', 'Pre-Launch')
        .select();

    if (pError) {
        console.error('Error updating Pre-Launch projects:', pError);
    } else {
        console.log(`Updated ${pData ? pData.length : 0} 'Pre-Launch' projects to 'New Launch'`);
    }

    console.log('Finished status updates.');
}

updateStatuses();
