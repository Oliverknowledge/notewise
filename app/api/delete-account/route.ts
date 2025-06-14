import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Ensure this is a service role key with delete permissions
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Delete the user from Supabase auth.users table
    // This will also trigger CASCADE deletes if you have foreign keys set up
    // in your public.profiles table (which you do based on schema.sql)
    const { error: userDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (userDeleteError) {
      console.error('Error deleting user from Supabase Auth:', userDeleteError);
      return NextResponse.json({ error: userDeleteError.message || 'Failed to delete user' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Account deleted successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Error in delete-account API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 