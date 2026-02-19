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
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY; // MUST use service role for admin ops

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials (URL or SERVICE_ROLE_KEY) in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_EMAIL = 'admin@27estates.com';
const ADMIN_PASSWORD = 'password123';

async function createAdmin() {
    console.log(`Creating admin user: ${ADMIN_EMAIL}`);

    // 1. Create User in Auth
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: 'Admin User' }
    });

    let userId = user?.id;

    if (createError) {
        // If user already exists, try to get ID
        if (createError.message.includes('already registered')) {
            console.log('User already exists in Auth. Fetching ID...');
            // We can't easily "get" user by email via admin api in v2 without listUsers?
            // Actually, listUsers is available.
            const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
            const existing = users.find(u => u.email === ADMIN_EMAIL);
            if (existing) {
                userId = existing.id;
                console.log(`Found existing user ID: ${userId}`);
                // Update password to be sure?
                await supabase.auth.admin.updateUserById(userId, { password: ADMIN_PASSWORD });
                console.log('Updated password.');
            } else {
                console.error('Could not find existing user even though error said registered.');
                return;
            }
        } else {
            console.error('Error creating user:', createError);
            return;
        }
    } else {
        console.log(`User created with ID: ${userId}`);
    }

    if (!userId) {
        console.error('Failed to get User ID.');
        return;
    }

    // 2. Ensure Profile exists and has Admin role
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error fetching profile:', profileError);
    }

    if (!profile) {
        console.log('Creating profile...');
        const { error: insertError } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                email: ADMIN_EMAIL,
                full_name: 'Admin User',
                role: 'admin'
            });

        if (insertError) console.error('Error creating profile:', insertError);
        else console.log('Profile created with Admin role.');
    } else {
        console.log('Updating existing profile role to admin...');
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', userId);

        if (updateError) console.error('Error updating profile:', updateError);
        else console.log('Profile updated to Admin role.');
    }

    console.log('✅ Admin creation/update complete.');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
}

createAdmin();
