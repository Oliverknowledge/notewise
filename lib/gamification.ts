import { supabase } from './supabase-client';

export const XP_PER_MINUTE = 10; // Base XP per minute of study
export const STREAK_MULTIPLIER = 0.1; // 10% bonus per day in streak

export async function addStudySessionXP(userId: string, durationMinutes: number) {
  try {
    // Get user's current streak
    const { data: profile } = await supabase
      .from('profiles')
      .select('streak')
      .eq('id', userId)
      .single();

    if (!profile) throw new Error('User profile not found');

    // Calculate XP with streak bonus
    const streakBonus = 1 + (profile.streak * STREAK_MULTIPLIER);
    const xpGained = Math.round(durationMinutes * XP_PER_MINUTE * streakBonus);

    // Add XP using the database function
    const { error } = await supabase.rpc('add_xp', {
      user_id: userId,
      xp_amount: xpGained
    });

    if (error) throw error;

    return {
      xpGained,
      streakBonus,
      durationMinutes
    };
  } catch (error) {
    console.error('Error adding study session XP:', error);
    throw error;
  }
}

export function getNextLevelXP(currentLevel: number): number {
  return Math.pow(currentLevel + 1, 2) * 100;
}

export function getLevelProgress(currentXP: number, currentLevel: number): number {
  const nextLevelXP = getNextLevelXP(currentLevel);
  const currentLevelXP = getNextLevelXP(currentLevel - 1);
  return ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
} 