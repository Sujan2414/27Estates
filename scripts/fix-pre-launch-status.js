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

async function fixPreLaunchStatus() {
    console.log('Starting status correction...');

    // We previously set any 'Pre-Launch' to 'New Launch'. The user actually wants 'Pre-Launch' to be 'Upcoming'.
    // Since we lost the original differentiation, we have to assume everything that is currently 'New Launch' 
    // might need to be 'Upcoming'.
    // Or we could revert the specific projects back if there's an audit log, but there probably isn't.
    // Let's ask the database to fetch projects with "New Launch" that we just changed.

    const { data: nData, error: nError } = await supabase
        .from('projects')
        .update({ status: 'Upcoming' })
        .eq('status', 'New Launch')
        .select();

    if (nError) {
        console.error('Error updating New Launch projects:', nError);
    } else {
        console.log(`Updated ${nData ? nData.length : 0} 'New Launch' (formerly 'Pre-Launch') projects to 'Upcoming'`);
    }

    console.log('Finished status correction.');
}

fixPreLaunchStatus();
