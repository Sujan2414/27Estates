import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { role } = await request.json();

        // Check for Service Role Key
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('SUPABASE_SERVICE_ROLE_KEY is missing');
            return NextResponse.json({ error: 'Server configuration error: Missing Service Role Key' }, { status: 500 });
        }

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
            return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
        }

        // Update profile role
        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ role })
            .eq('id', id);

        if (error) {
            console.error('Supabase update error:', error);
            throw error;
        }

        return NextResponse.json({ message: 'User role updated successfully' });

    } catch (error: any) {
        console.error('Error updating user role:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

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

        // Delete from Auth (this usually cascades to profiles if set up, but we will delete profile manually too just in case)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (authError) throw authError;

        // Delete from profiles (if not cascaded)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', id);

        // Ignore profile error if row is already gone due to cascade
        if (profileError && profileError.code !== 'PGRST116') {
            console.warn('Profile deletion warning:', profileError);
        }

        return NextResponse.json({ message: 'User deleted successfully' });

    } catch (error: any) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
