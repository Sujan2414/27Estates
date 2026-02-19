
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env = {};
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const newAgent = {
    name: "Vamsi Krishna .C",
    role: "CRM & Compliance Manager",
    email: "vamsi.c@27estates.com",
    phone: "9652141051",
    image: "/agents/vamsi-krishna.png",
    bio: "Experienced CRM & Compliance Manager ensuring smooth operations and customer satisfaction.",
    // properties_count: 0 // Optional, depending on schema
};

async function seedAgents() {
    console.log('Starting agent migration...');

    // 1. Delete all existing agents
    const { error: deleteError } = await supabase
        .from('agents')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (deleteError) {
        console.error('Error deleting agents:', deleteError);
        // Continue anyway? No, might duplicate if insert works but delete failed due to RLS
        // But if table is empty it might be fine.
        // If RLS blocks delete, we can't proceed.
        // We will try to insert anyway to see if that works.
    } else {
        console.log('Cleared existing agents.');
    }

    // 2. Insert new agent
    const { data, error: insertError } = await supabase
        .from('agents')
        .insert([newAgent])
        .select();

    if (insertError) {
        console.error('Error inserting agent:', insertError);
    } else {
        console.log('Successfully added Vamsi Krishna .C:', data);
    }
}

seedAgents();
