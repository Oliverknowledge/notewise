"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { vapiService } from '@/lib/vapi';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserProfile from '../components/UserProfile';
import { motion as Motion } from 'framer-motion';
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
  Play,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import ViewStudyMaterialModal from '@/app/components/ViewStudyMaterialModal';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HistoryIcon } from "@/components/icons/HistoryIcon";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";



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
  return (
    <Motion.div
      className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl text-white flex flex-col items-center justify-center min-w-[150px] md:min-w-[200px] transition-all duration-300"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8, duration: 0.5 }}
    >
      <Motion.div
        key={streak}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="text-6xl font-extrabold drop-shadow-lg text-yellow-300"
      >
        {streak === 0 ? 1 : streak}
      </Motion.div>
      <p className="text-lg font-semibold text-blue-100 mt-2">Day Streak</p>
    </Motion.div>
  );
}

function WelcomeBanner({ userName, xp, level, streak }: WelcomeBannerProps) {
  const getNextLevelXP = (currentLevel: number) => (currentLevel + 1) ** 2 * 100;
  const getCurrentLevelXP = (currentLevel: number) => {
    if (currentLevel <= 1) return 0; // Level 1 starts at 0 XP
    return (currentLevel - 1) ** 2 * 100;
  };
  const progress = level && xp ? ((xp - getCurrentLevelXP(level)) / (getNextLevelXP(level) - getCurrentLevelXP(level)) * 100) : 0;

  return (
    <Motion.div 
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
            <Motion.h2 
              className="text-4xl md:text-5xl font-bold mb-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Welcome back, {userName || 'Student'}!
            </Motion.h2>
            <Motion.p 
              className="text-blue-100 text-lg md:text-xl"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              Ready to continue your learning journey?
            </Motion.p>
          </div>

          {/* Level Progress Card - Made smaller and less prominent, positioned below welcome text */}
          <Motion.div 
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
                <Motion.div
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
          </Motion.div>
        </div>

        <StreakAnimation streak={streak || 0} />
      </div>
    </Motion.div>
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
    <Motion.div
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
    </Motion.div>
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
  const { signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isViewMaterialModalOpen, setIsViewMaterialModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
      let { data: currentProfileData, error: profileError } = await supabase
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

      if (!currentProfileData) {
        throw new Error('Profile not found');
      }

      // Variable to hold the final profile data for setting state
      let finalProfileData = currentProfileData;

      // Update last login date to trigger streak update if needed
      const today = new Date().toISOString().split('T')[0];
      if (finalProfileData.last_login_date !== today) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ last_login_date: today })
          .eq('id', session.user.id);

        if (updateError) {
          console.error('Error updating last login date:', updateError);
        }
        
        // Re-fetch profile data to get the updated streak and last_login_date
        const { data: updatedProfileData, error: updatedProfileError } = await supabase
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

        if (updatedProfileError) {
          console.error('Error re-fetching profile after streak update:', updatedProfileError);
          // Don't throw, just log and proceed with the current data if re-fetch fails
        }

        if (updatedProfileData) {
          finalProfileData = updatedProfileData; // Use the updated data for state
        }
      }

      // Transform the data to match our interface (using finalProfileData)
      const userProfileData: UserProfileData = {
        id: finalProfileData.id,
        email: finalProfileData.email || '',
        full_name: finalProfileData.full_name || '',
        xp: finalProfileData.xp || 0,
        level: finalProfileData.level || 1,
        streak: finalProfileData.streak || 0,
        weekly_study_time: finalProfileData.weekly_study_time || 0,
        topics_reviewed: finalProfileData.topics_reviewed || 0,
        most_reviewed_topics: finalProfileData.most_reviewed_topics || [],
        suggested_review_topics: finalProfileData.suggested_review_topics || [],
        badges: finalProfileData.badges || [],
        updated_at: finalProfileData.updated_at
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

  const handleDeleteAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('No active user session found.');
        return;
      }

      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || 'Account deleted successfully.');
        router.push('/'); // Redirect to home page after deletion
      } else {
        toast.error(result.error || 'Failed to delete account.');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('An unexpected error occurred during account deletion.');
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
                      onClick={signOut}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Sign Out
                    </div>
                    <div
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100 cursor-pointer border-t border-gray-200 mt-2 pt-2"
                    >
                      Delete Account
                    </div>
                  </div>
                )}
              </Button>
            </nav>

            <div className="md:hidden">
              <Button
                variant="ghost"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6 text-slate-600" />
                ) : (
                  <Menu className="h-6 w-6 text-slate-600" />
                )}
              </Button>
            </div>
          </div>
        </div>
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <Motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white/90 backdrop-blur-md pb-4 border-b border-white/20 shadow-md"
          >
            <nav className="flex flex-col items-start px-4 space-y-2">
              <Link href="/tutor" className="block w-full px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-md font-medium">
                Tutor
              </Link>
              <Link href="/history" className="block w-full px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-md font-medium">
                History
              </Link>
              <Button
                onClick={signOut}
                className="block w-full text-left px-3 py-2 text-red-600 hover:bg-slate-100 rounded-md font-medium"
              >
                Logout
              </Button>
            </nav>
          </Motion.div>
        )}
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
              {/* Left Column - Quick Actions */}
              <div className="xl:col-span-2 space-y-8">
                <Motion.div
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
                          onClick={signOut}
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
                </Motion.div>
              </div>

              {/* Right Column - Daily Tip */}
              <div className="xl:col-span-1">
                <DailyTip />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600"><AlertTriangle className="mr-2 h-5 w-5"/> Confirm Account Deletion</DialogTitle>
            <DialogDescription>
              Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Delete My Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ViewStudyMaterialModal
        isOpen={isViewMaterialModalOpen}
        onClose={() => setIsViewMaterialModalOpen(false)}
        materialId={selectedMaterial?.id || null}
      />
    </div>
  );
}