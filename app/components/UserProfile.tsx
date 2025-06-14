'use client';

import { Card, CardContent } from '@/components/ui/card';
import { motion as Motion } from 'framer-motion';

interface UserProfileProps {
  profile: {
    id: string;
    email: string;
    full_name: string;
    xp: number;
    level: number;
    streak: number;
    weekly_study_time: number;
    topics_reviewed: number;
    most_reviewed_topics: string[];
    suggested_review_topics: { topic: string; sessions?: number }[];
    badges: string[];
  };
}

const UserProfile = ({ profile }: UserProfileProps) => {
  const getNextLevelXP = (level: number) => (level + 1) ** 2 * 100;

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-white/90 backdrop-blur-sm">
        <CardContent className="">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-2xl font-bold text-white">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Welcome, {profile.full_name}!</h2>
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
          <div className="mt-4 w-full space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-500">🔥</span>
              <span className="text-gray-700">{profile.streak} day streak</span>
            </div>
            
            
          </div>
        </CardContent>
      </Card>
    </Motion.div>
  );
};

export default UserProfile; 