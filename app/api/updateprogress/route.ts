"use server";
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const userId = formData.get('userId') as string;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('Received User ID for progress update:', userId);
    
    // Get the current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Update the user's last login date. The database trigger will handle the streak update.
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            last_login_date: today,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId);

    if (updateError) {
        console.error('Supabase update error:', updateError);
        return NextResponse.json({ error: 'Failed to update last login date' }, { status: 500 });
    }

    // Add XP using the database function (this also updates the level)
    const { error: xpError } = await supabase.rpc('add_xp', {
        user_id: userId,
        xp_amount: 50
    });

    if (xpError) {
        console.error('Error adding XP:', xpError);
        return NextResponse.json({ error: 'Failed to add XP' }, { status: 500 });
    }

    // Get updated user data including the streak (updated by the database trigger)
    const { data: updatedUserData, error: userDataError } = await supabase
        .from('profiles')
        .select('xp, level, streak')
        .eq('id', userId)
        .single();

    if (userDataError || !updatedUserData) {
        console.error('Error fetching updated user data:', userDataError);
        return NextResponse.json({ error: 'Failed to fetch updated user data' }, { status: 500 });
    }

    return NextResponse.json({ 
        success: true, 
        streak: updatedUserData.streak,
        xp: updatedUserData.xp,
        level: updatedUserData.level,
        message: `Progress updated. Streak: ${updatedUserData.streak} days, XP: ${updatedUserData.xp}`
    });

  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}   