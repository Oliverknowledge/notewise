'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

interface UserProfile {
  name: string;
  xp: number;
  level: number;
  streak: number;
  badges: string[];
}

const UserProfile = () => {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    xp: 0,
    level: 1,
    streak: 0,
    badges: []
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setProfile({
            name: profile.full_name || session.user.email?.split('@')[0] || 'User',
            xp: profile.xp || 0,
            level: profile.level || 1,
            streak: profile.streak || 0,
            badges: profile.badges || []
          });
        }
      }
    };

    fetchUserProfile();
  }, []);

  const getNextLevelXP = (level: number) => (level + 1) ** 2 * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-white/90 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-2xl font-bold text-white">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Welcome, {profile.name}!</h2>
              <p className="text-gray-600">Level {profile.level} • {profile.xp} XP</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                  style={{
                    width: `${(profile.xp / getNextLevelXP(profile.level)) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-500">🔥</span>
              <span className="text-gray-700">{profile.streak} day streak</span>
            </div>
            {profile.badges.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-blue-500">🏆</span>
                <span className="text-gray-700">{profile.badges.length} badges</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UserProfile; 