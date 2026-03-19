import { createAdminClient, createSupabaseServerClientComponent } from '@/lib/supabase/server'; // Updated import
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Added to force dynamic rendering

export async function GET() {
  try {
    const supabase = await createSupabaseServerClientComponent(); // Await the client
    
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify the user is an admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin') // Changed from 'is_admin' to 'is_admin'
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile?.is_admin) { // Check is_admin boolean
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    const supabaseAdmin = await createAdminClient();

    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, created_at')
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Fetch auth users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    // Combine the data
    const users = profiles.map(profile => {
      const authUser = authUsers.users?.find(u => u.id === profile.id);
      return {
        id: profile.id,
        email: authUser?.email || 'No email',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        created_at: profile.created_at
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error in /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
