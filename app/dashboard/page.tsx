"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { vapiService } from '@/lib/vapi';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserProfile from '../components/UserProfile';
import { motion } from 'framer-motion';
import Link from "next/link";
import { 
  Brain, 
  MessageSquare, 
  Target, 
  BookOpen, 
  Clock, 
  Trophy,
  FileText,
  File,
  FileType,
  Upload,
  HelpCircle,
  Menu,
  X,
  ChevronDown,
  Settings,
  LogOut,
  Trash2,
  Eye,
  Calendar,
  Bookmark,
  User,
  Download,
  Play
} from 'lucide-react';
import { toast } from 'sonner';
import ViewStudyMaterialModal from '@/app/components/ViewStudyMaterialModal';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HistoryIcon } from "@/components/icons/HistoryIcon";



interface StudyMaterial {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'ppt' | 'txt';
  subject?: string;
  date: string;
  file_name?: string;
  file_path?: string;
  created_at: string;
}

interface WelcomeBannerProps {
  userName: string | undefined;
  xp: number | undefined;
  level: number | undefined;
  streak: number | undefined;
}

function StreakAnimation({ streak }: { streak: number }) {
  const today = new Date().getDay(); 
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <motion.div
      className="w-[30w] md:w-1/2 flex flex-col items-center gap-4 bg-gradient-to-r from-orange-400 to-red-500 p-8 rounded-3xl shadow-lg overflow-hidden relative md:ml-auto md:mr-0 md:mt-0"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {/* Background fire effect */}
      <motion.div
        className="absolute inset-0 z-0 opacity-20"
        animate={{ 
          scale: [1, 1.2, 1], 
          rotate: [0, 5, -5, 0], 
          opacity: [0.1, 0.3, 0.1] 
        }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      >
        <Trophy className="w-full h-full text-white blur-sm" />
      </motion.div>

      <div className="relative z-10 flex items-center gap-3">
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut"
          }}
          className="text-5xl"
        >
          🔥
        </motion.div>
        <div className="text-white flex flex-col items-center">
          <motion.span
            className="text-4xl font-extrabold"
            key={streak}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500 }}
          >
            {streak}
          </motion.span>
          <span className="text-base ml-1">day streak</span>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-7 gap-2 w-full mt-4">
        {days.map((day, i) => (
          <motion.div
            key={day}
            className={`flex flex-col items-center justify-center px-2 py-3 rounded-lg text-sm font-semibold
              ${i < streak ? 'bg-white/30' : 'bg-white/10'}
              ${i === today ? 'border-2 border-yellow-300' : ''}
            `}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i + 0.5 }}
          >
            {day}
            {i < streak && (
              <motion.span
                className="text-orange-300 text-lg mt-2"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * i + 0.7, type: "spring", stiffness: 400 }}
              >
                🔥
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function WelcomeBanner({ userName, xp, level, streak }: WelcomeBannerProps) {
  const getNextLevelXP = (currentLevel: number) => (currentLevel + 1) ** 2 * 100;
  const progress = level && xp ? ((xp / getNextLevelXP(level)) * 100) : 0;

  return (
    <motion.div 
      className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 mb-8 shadow-2xl text-white relative "
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
      </div>
      
      <div className="relative flex flex-col md:flex-row justify-between items-start h-full w-full">
        <div className="flex flex-col gap-6 w-full md:w-auto flex-shrink-0">
          <div className="flex-grow text-center md:text-left">
            <motion.h2 
              className="text-4xl md:text-5xl font-bold mb-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Welcome back, {userName || 'Student'}!
            </motion.h2>
            <motion.p 
              className="text-blue-100 text-lg md:text-xl"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              Ready to continue your learning journey?
            </motion.p>
          </div>

          {/* Level Progress Card - Made smaller and less prominent, positioned below welcome text */}
          <motion.div 
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 w-full max-w-xs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-xs font-medium">Level Progress</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Level {level || 1}</span>
                <span className="text-sm text-blue-200">{xp || 0} XP</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-1.5">
                <motion.div
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-1.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ delay: 0.6, duration: 1 }}
                />
              </div>
              <p className="text-xs text-blue-200 text-right">
                {getNextLevelXP(level || 1) - (xp || 0)} XP to next level
              </p>
            </div>
          </motion.div>
        </div>

        <StreakAnimation streak={streak || 0} />
      </div>
    </motion.div>
  );
}




interface StudyInsightsProps {
  weeklyStudyTime: number | undefined;
  topicsReviewed: number | undefined;
  mostReviewedTopics: string[] | undefined;
  suggestedReviewTopics: { topic: string; sessions?: number }[] | undefined;
}

function StudyInsights({ weeklyStudyTime, topicsReviewed, mostReviewedTopics, suggestedReviewTopics }: StudyInsightsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
    >
      <Card className="shadow-xl border-0 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full -translate-y-12 translate-x-12"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white rounded-full translate-y-10 -translate-x-10"></div>
        </div>

        <CardHeader className="border-b border-white/20 px-6 py-4 relative z-10">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <Target className="w-6 h-6 text-white" />
            Study Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 relative z-10">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/10 p-4 rounded-xl flex flex-col items-center justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-green-300" />
                  <span className="text-sm font-medium text-white/80">Weekly Study Time</span>
                </div>
                <p className="text-3xl font-bold text-white">{weeklyStudyTime || 0} hrs</p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl flex flex-col items-center justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <Bookmark className="w-5 h-5 text-green-300" />
                  <span className="text-sm font-medium text-white/80">Topics Reviewed</span>
                </div>
                <p className="text-3xl font-bold text-white">{topicsReviewed || 0}</p>
              </div>
            </div>

            {mostReviewedTopics && mostReviewedTopics.length > 0 && (
              <div>
                <h4 className="font-medium text-white mb-3 text-lg">Most Reviewed Topics</h4>
                <div className="space-y-2">
                  {mostReviewedTopics.map((topic, index) => (
                    <div key={index} className="flex items-center justify-between bg-white/10 p-3 rounded-xl">
                      <span className="text-sm text-white/80">{topic}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {suggestedReviewTopics && suggestedReviewTopics.length > 0 && (
              <div>
                <h4 className="font-medium text-white mb-3 text-lg">Suggested for Review</h4>
                <div className="space-y-2">
                  {suggestedReviewTopics.map((topicItem, index) => (
                    <div key={index} className="flex items-center justify-between bg-white/10 p-3 rounded-xl">
                      <span className="text-sm text-white/80">{topicItem?.topic}</span>
                      <Button variant="ghost" size="sm" className="text-green-300 hover:text-white hover:bg-white/20">Review</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DailyTip() {
  const tips = [
    "Break down complex topics into smaller, manageable chunks.",
    "Use active recall: quiz yourself instead of passively re-reading.",
    "Explain concepts in your own words to solidify understanding.",
    "Take short, frequent breaks to maintain focus and prevent burnout.",
    "Connect new information to what you already know to improve retention.",
    "Review your notes regularly to reinforce learning.",
    "Try teaching the topic to someone else to deepen your understanding.",
    "Use spaced repetition to schedule your review sessions effectively.",
    "Create mind maps or diagrams to visualize complex relationships.",
    "Practice problem-solving regularly to apply your knowledge."
  ];
  const [currentTip, setCurrentTip] = useState('');

  useEffect(() => {
    setCurrentTip(tips[Math.floor(Math.random() * tips.length)]);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0 }}
    >
      <Card className="shadow-xl border-0 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-2xl text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full -translate-y-12 translate-x-12"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white rounded-full translate-y-10 -translate-x-10"></div>
        </div>

        <CardHeader className="border-b border-white/20 px-6 py-4 relative z-10">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-white" />
            Daily Learning Tip
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 relative z-10">
          <p className="text-white italic">"{currentTip}"</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface UserProfileData {
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
  updated_at?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isViewMaterialModalOpen, setIsViewMaterialModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    refreshUserProfile();
  }, []);

  // Add this new useEffect for weekly reset
  useEffect(() => {
    const checkAndResetWeeklyStats = async () => {
      if (!userProfile) return;

      const today = new Date();
      const lastMonday = new Date(today);
      lastMonday.setDate(today.getDate() - (today.getDay() + 6) % 7);
      lastMonday.setHours(0, 0, 0, 0);

      const lastUpdate = userProfile.updated_at ? new Date(userProfile.updated_at) : null;
      
      if (!lastUpdate || lastUpdate < lastMonday) {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({
              weekly_study_time: 0,
              topics_reviewed: 0
            })
            .eq('id', userProfile.id);

          if (error) {
            console.error('Error resetting weekly stats:', error);
            return;
          }

          // Refresh profile to get updated data
          await refreshUserProfile();
        } catch (err) {
          console.error('Error in weekly stats reset:', err);
        }
      }
    };

    checkAndResetWeeklyStats();
  }, [userProfile]);

  const refreshUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Fetch user profile with all statistics
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          xp,
          level,
          streak,
          weekly_study_time,
          topics_reviewed,
          most_reviewed_topics,
          suggested_review_topics,
          badges,
          last_login_date,
          updated_at
        `)
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      if (!profileData) {
        throw new Error('Profile not found');
      }

      // Update last login date to trigger streak update if needed
      const today = new Date().toISOString().split('T')[0];
      if (profileData.last_login_date !== today) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ last_login_date: today })
          .eq('id', session.user.id);

        if (updateError) {
          console.error('Error updating last login date:', updateError);
        }
      }

      // Transform the data to match our interface
      const userProfileData: UserProfileData = {
        id: profileData.id,
        email: profileData.email || '',
        full_name: profileData.full_name || '',
        xp: profileData.xp || 0,
        level: profileData.level || 1,
        streak: profileData.streak || 0,
        weekly_study_time: profileData.weekly_study_time || 0,
        topics_reviewed: profileData.topics_reviewed || 0,
        most_reviewed_topics: profileData.most_reviewed_topics || [],
        suggested_review_topics: profileData.suggested_review_topics || [],
        badges: profileData.badges || [],
        updated_at: profileData.updated_at
      };

      setUserProfile(userProfileData);
      setError(null);
    } catch (err) {
      console.error('Error in refreshUserProfile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user profile');
      toast.error('Failed to load user profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateUserStats = async (studyTimeMinutes: number, topics: string[]) => {
    try {
      if (!userProfile) return;

      // Update weekly study time
      const newWeeklyStudyTime = userProfile.weekly_study_time + studyTimeMinutes;
      
      // Update topics reviewed
      const newTopicsReviewed = userProfile.topics_reviewed + topics.length;
      
      // Update most reviewed topics
      const updatedMostReviewedTopics = [...userProfile.most_reviewed_topics, ...topics]
        .filter((topic, index, self) => self.indexOf(topic) === index) // Remove duplicates
        .slice(0, 5); // Keep only top 5

      const { error } = await supabase
        .from('profiles')
        .update({
          weekly_study_time: newWeeklyStudyTime,
          topics_reviewed: newTopicsReviewed,
          most_reviewed_topics: updatedMostReviewedTopics
        })
        .eq('id', userProfile.id);

      if (error) {
        console.error('Error updating user stats:', error);
        throw error;
      }

      // Refresh profile to get updated data
      await refreshUserProfile();
    } catch (err) {
      console.error('Error updating user stats:', err);
      toast.error('Failed to update study statistics');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-all duration-200">
              Notewise
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/tutor" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">
                Tutor
              </Link>
              <Link href="/history" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">
                History
              </Link>
              <Button
                variant="ghost"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="relative hover:bg-slate-100 rounded-xl px-4 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-700 font-medium">{userProfile?.full_name || 'User'}</span>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </div>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-[101%] w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-slate-200">
                   
                    <div
                      onClick={() => supabase.auth.signOut()}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Sign Out
                    </div>
                  </div>
                )}
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 p-4">
            <p>{error}</p>
            <Button onClick={refreshUserProfile} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <WelcomeBanner
              userName={userProfile?.full_name}
              xp={userProfile?.xp}
              level={userProfile?.level}
              streak={userProfile?.streak}
            />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-8">
              {/* Left Column - Study Insights */}
              <div className="xl:col-span-2 space-y-8">
                <StudyInsights
                  weeklyStudyTime={userProfile?.weekly_study_time}
                  topicsReviewed={userProfile?.topics_reviewed}
                  mostReviewedTopics={userProfile?.most_reviewed_topics}
                  suggestedReviewTopics={userProfile?.suggested_review_topics}
                />

                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                >
                  <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full -translate-y-12 translate-x-12"></div>
                      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white rounded-full translate-y-10 -translate-x-10"></div>
                    </div>

                    <CardHeader className="border-b border-white/20 px-6 py-4 relative z-10">
                      <CardTitle className="text-2xl font-bold flex items-center gap-3">
                        <Brain className="w-6 h-6 text-white" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 relative z-10">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button
                          onClick={() => router.push('/tutor')}
                          className="group h-auto py-6 bg-white/10 hover:bg-white/20 text-white flex flex-col items-center justify-center space-y-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0"
                        >
                          <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                            <Brain className="h-6 w-6" />
                          </div>
                          <span className="font-semibold">Start Tutoring</span>
                        </Button>
                        <Button
                          onClick={() => router.push('/history')}
                          className="group h-auto py-6 bg-white/10 hover:bg-white/20 text-white flex flex-col items-center justify-center space-y-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0"
                        >
                          <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                            <HistoryIcon className="h-6 w-6" />
                          </div>
                          <span className="font-semibold">View History</span>
                        </Button>
                        <Button
                          onClick={() => supabase.auth.signOut()}
                          className="group h-auto py-6 bg-white/10 hover:bg-white/20 text-white flex flex-col items-center justify-center space-y-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0"
                        >
                          <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                            <LogOut className="h-6 w-6" />
                          </div>
                          <span className="font-semibold">Logout</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Right Column - Daily Tip */}
              <div className="xl:col-span-1">
                <DailyTip />
              </div>
            </div>
          </>
        )}
      </main>

      <ViewStudyMaterialModal
        isOpen={isViewMaterialModalOpen}
        onClose={() => setIsViewMaterialModalOpen(false)}
        materialId={selectedMaterial?.id || null}
      />
    </div>
  );
}