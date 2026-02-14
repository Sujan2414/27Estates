import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        // Auth check
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Role check
        const supabaseAdmin = createAdminClient();
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch all user profiles
        const { data: profiles, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(profiles);
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { email, password, fullName, role } = await request.json();

        // Auth check
        const supabase = await createClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabaseAdmin = createAdminClient();

        // Check if current user is admin
        const { data: requesterProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', currentUser.id)
            .single();

        if (requesterProfile?.role !== 'admin' && requesterProfile?.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Create Auth User
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName }
        });

        if (authError) throw authError;

        // The profile might be created automatically by a trigger, but we need to update the role
        // Or we create it manually if no trigger exists. 
        // We'll attempt to update/upsert to set the role correctly.

        // Wait a brief moment for trigger if it exists, or just upsert.
        // Let's upsert to be safe and ensure the role is set.
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: authData.user.id,
                email: email,
                full_name: fullName,
                role: role || 'user',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

        if (profileError) {
            // Rollback auth user if profile creation fails? 
            // Ideally yes, but for now we'll just return error
            console.error('Error creating profile:', profileError);
            return NextResponse.json({ error: 'User created but profile update failed: ' + profileError.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'User created successfully', user: authData.user });

    } catch (error: any) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
