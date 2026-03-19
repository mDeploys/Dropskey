'use server';

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js'; // Keep for admin client
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase-fixed';

// Cache for the admin client (server-side only)
let adminClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Get or create a server-side Supabase client for the current request.
 * This is safe to use in Server Components, Server Actions, and Route Handlers.
 */
export async function createSupabaseServerClientComponent() {
  const cookieStore = cookies();
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
    }
  );
}

/**
 * Get or create an admin Supabase client with service role key.
 * Only use this in Server Components, Server Actions, and Route Handlers
 * that require elevated permissions.
 */
export async function createAdminClient() {
  if (adminClient) {
    return adminClient;
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  return adminClient;
}

// Helper functions that use the consistent server client
// These were previously in src/lib/supabase-server.ts but are now consolidated here.

type Profile = Database['public']['Tables']['profiles']['Row'];

export const getSession = async (cookieStore?: ReturnType<typeof cookies>) => {
  const supabase = await createSupabaseServerClientComponent(); // Use the consistent client
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  
  return session;
};

export const getCurrentUser = async (cookieStore?: ReturnType<typeof cookies>) => {
  const supabase = await createSupabaseServerClientComponent(); // Use the consistent client
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  
  return user;
};

export const getCurrentUserProfile = async (cookieStore?: ReturnType<typeof cookies>) => {
  console.log('getCurrentUserProfile: Attempting to fetch user and profile...');
  try {
    const user = await getCurrentUser(cookieStore);
    if (!user) {
      console.log('getCurrentUserProfile: User not authenticated.');
      return { data: null, error: 'User not authenticated' };
    }
    console.log('getCurrentUserProfile: User authenticated, ID:', user.id, 'Email:', user.email);
    
    const supabase = await createSupabaseServerClientComponent(); // Use the consistent client
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        console.log('getCurrentUserProfile: No profile found for user, attempting to create one.');
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              email: user.email
            }
          ])
          .select()
          .single();

        if (createError) {
          console.error('getCurrentUserProfile: Error creating profile:', createError);
          return { data: null, error: 'Failed to create profile' };
        }
        console.log('getCurrentUserProfile: New profile created:', newProfile);
        return { data: newProfile, error: null };
      }
      
      console.error('getCurrentUserProfile: Error fetching profile:', error);
      return { data: null, error: error.message };
    }
    console.log('getCurrentUserProfile: Profile fetched successfully:', profile);
    return { data: profile, error: null };
  } catch (error) {
    console.error('getCurrentUserProfile: Unexpected error:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
};

export const updateProfile = async (profileData: Partial<Profile>, cookieStore?: ReturnType<typeof cookies>) => {
  try {
    const user = await getCurrentUser(cookieStore);
    if (!user) return { data: null, error: 'User not authenticated' };

    const supabase = await createSupabaseServerClientComponent(); // Use the consistent client
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...profileData,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return { data: null, error: error.message };
    }

    // Update user metadata with display name if first_name or last_name is provided
    if (data && (profileData.first_name || profileData.last_name)) {
      const displayName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
      if (displayName) {
        await supabase.auth.updateUser({
          data: {
            full_name: displayName,
            first_name: data.first_name,
            last_name: data.last_name
          }
        });
      }
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in updateProfile:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
};

export const getAllUserProfilesForAdmin = async (cookieStore?: ReturnType<typeof cookies>) => {
  try {
    const user = await getCurrentUser(cookieStore);
    if (!user) return { data: null, error: 'User not authenticated' };
    
    // Check if user is admin
    const supabase = await createSupabaseServerClientComponent(); // Use the consistent client
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return { data: null, error: 'Unauthorized: Admin access required' };
    }
    
    // Cross-user profile reads must bypass profiles RLS after the admin check above.
    const supabaseAdmin = await createAdminClient();
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*');

    if (error) {
      console.error('Error fetching profiles:', error);
      return { data: null, error: error.message };
    }
    
    return { data: profiles, error: null };
  } catch (error) {
    console.error('Error in getAllUserProfilesForAdmin:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
};
