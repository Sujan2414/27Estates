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
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
    console.log('Checking storage buckets...');

    const BUCKET_NAME = 'media';

    // List buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
        console.error('Error listing buckets:', listError);
        return;
    }

    const exists = buckets.find(b => b.name === BUCKET_NAME);

    if (exists) {
        console.log(`Bucket '${BUCKET_NAME}' already exists.`);
    } else {
        console.log(`Creating bucket '${BUCKET_NAME}'...`);
        const { data, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
            public: true, // Make it public so brochures can be viewed
            fileSizeLimit: 52428800, // 50MB
            allowedMimeTypes: ['image/*', 'application/pdf']
        });

        if (createError) {
            console.error('Error creating bucket:', createError);
        } else {
            console.log(`Bucket '${BUCKET_NAME}' created successfully.`);
        }
    }
}

setupStorage();
