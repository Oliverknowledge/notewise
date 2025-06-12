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

    // First, get the user's current streak and last login date
    const { data: userData, error: fetchError } = await supabase
        .from('profiles')
        .select('streak, last_login_date, xp')
        .eq('id', userId)
        .single();

    if (fetchError) {
        console.error('Error fetching user data:', fetchError);
        return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    let newStreak = 1;
    const lastLoginDate = userData?.last_login_date ? new Date(userData.last_login_date) : null;
    const currentDate = new Date(today);

    if (lastLoginDate) {
        // Check if the last login was yesterday
        const yesterday = new Date(currentDate);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastLoginDate.toDateString() === yesterday.toDateString()) {
            // If last login was yesterday, increment streak
            newStreak = (userData.streak || 0) + 1;
        } else if (lastLoginDate.toDateString() !== currentDate.toDateString()) {
            // If last login was not today or yesterday, reset streak
            newStreak = 1;
        } else {
            // If already logged in today, keep current streak
            newStreak = userData.streak || 1;
        }
    }

    // Update the user's streak and last login date
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            streak: newStreak,
            last_login_date: today,
            updated_at: new Date().toISOString(),
            xp: (userData.xp || 0) + 10  // Increment XP by 10
        })
        .eq('id', userId);

    if (updateError) {
        console.error('Supabase streak update error:', updateError);
        return NextResponse.json({ error: 'Failed to update streak' }, { status: 500 });
    }

    return NextResponse.json({ 
        success: true, 
        streak: newStreak,
        xp: (userData.xp || 0) + 10,
        message: `Streak updated to ${newStreak} days and XP increased by 10`
    });

  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}   