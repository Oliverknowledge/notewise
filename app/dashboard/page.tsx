"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { vapiService } from '@/lib/vapi';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TutoringSessionPopup from '@/components/TutoringSessionPopup';
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
  User
} from 'lucide-react';

type StudyMode = 'quiz' | 'explanation' | 'flashcards' | 'oral_exam';

interface StudyMaterial {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'ppt' | 'txt';
  subject: string;
  date: string;
}

interface WelcomeBannerProps {
  userName: string | undefined;
  xp: number | undefined;
  level: number | undefined;
  streak: number | undefined;
}

function WelcomeBanner({ userName, xp, level, streak }: WelcomeBannerProps) {
  const getNextLevelXP = (currentLevel: number) => (currentLevel + 1) ** 2 * 100; // Helper function

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-8 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-full">
          <User className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Welcome back, {userName}</h2>
          <p className="text-sm text-gray-600">Level {level || 1} • {xp || 0} XP</p>
          {level !== undefined && xp !== undefined && (
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{
                  width: `${((xp || 0) / getNextLevelXP(level || 1)) * 100}%`
                }}
              />
            </div>
          )}
        </div>
      </div>
      {streak !== undefined && ( // Display streak if available
        <div className="mt-4 flex items-center space-x-2">
          <span className="text-yellow-500">🔥</span>
          <span className="text-gray-700">{streak || 0} day streak</span>
        </div>
      )}
    </div>
  );
}

interface StudyMaterialsProps {
  materials: StudyMaterial[];
}

function StudyMaterials({ materials }: StudyMaterialsProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <CardTitle className="text-xl">Study Materials</CardTitle>
        <Button variant="outline" className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200">
          <Upload className="w-4 h-4" />
          Upload New Material
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {materials.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No study materials uploaded yet.</div>
          ) : (
            materials.map((material) => (
              <div key={material.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    {material.type === 'pdf' && <FileText className="w-6 h-6 text-red-500" />}
                    {material.type === 'doc' && <File className="w-6 h-6 text-blue-500" />}
                    {material.type === 'ppt' && <FileType className="w-6 h-6 text-orange-500" />}
                    {material.type === 'txt' && <FileText className="w-6 h-6 text-gray-500" />}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{material.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{material.subject}</span>
                      <span>•</span>
                      <span>{new Date(material.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="hover:bg-blue-50 hover:text-blue-600">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StudySession() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<StudyMode | null>(null);

  const modes = [
    {
      id: 'quiz',
      icon: Brain,
      title: 'Quiz Me',
      description: 'Test your knowledge with interactive questions'
    },
    {
      id: 'flashcards',
      icon: BookOpen,
      title: 'Flashcards',
      description: 'Review key concepts with spaced repetition'
    },
    {
      id: 'explanation',
      icon: MessageSquare,
      title: 'Explain a Concept',
      description: 'Get detailed explanations of complex topics'
    },
    {
      id: 'oral_exam',
      icon: Target,
      title: 'Mock Oral Exam',
      description: 'Practice explaining concepts out loud'
    }
  ];

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-xl">Start a Study Session</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modes.map((mode) => (
              <Button
                key={mode.id}
                variant={selectedMode === mode.id ? 'default' : 'outline'}
                onClick={() => setSelectedMode(mode.id as StudyMode)}
                className={`h-28 flex flex-col items-center justify-center gap-2 relative group ${
                  selectedMode === mode.id ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'
                }`}
              >
                <mode.icon className={`w-6 h-6 ${selectedMode === mode.id ? 'text-white' : 'text-blue-600'}`} />
                <span className={selectedMode === mode.id ? 'text-white' : 'text-gray-900'}>{mode.title}</span>
                <div className="absolute bottom-2 text-xs text-gray-500 group-hover:text-gray-700">
                  {mode.description}
                </div>
              </Button>
            ))}
          </div>
          
          <Button
            variant="default"
            onClick={() => router.push('/tutor')}
            className="w-full h-16 text-lg bg-blue-600 hover:bg-blue-700"
          >
            Start Talking
          </Button>
        </div>
      </CardContent>
    </Card>
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
    <Card className="shadow-sm">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-xl">Study Insights</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Weekly Study Time</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{weeklyStudyTime} hrs</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Topics Reviewed</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{topicsReviewed}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Most Reviewed Topics</h4>
            <div className="space-y-2">
              {mostReviewedTopics?.map((topic, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <span className="text-sm text-gray-700">{topic}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Suggested for Review</h4>
            <div className="space-y-2">
              {suggestedReviewTopics?.map((topicItem, index) => (
                <div key={index} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                  <span className="text-sm text-gray-700">{topicItem?.topic}</span>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">Review</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface RecentSession {
  id: string;
  type: StudyMode; // Assuming session type matches StudyMode
  topic: string;
  date: string; // Store date as string or Date object
  duration: number; // Duration in minutes
}

interface RecentSessionsProps {
  sessions: RecentSession[];
}

function RecentSessions({ sessions }: RecentSessionsProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-xl">Recent Sessions</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No recent study sessions yet.</div>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    {/* Assuming icon mapping based on session.type */}
                    {session.type === 'quiz' && <Brain className="w-4 h-4 text-blue-600" />}
                    {session.type === 'explanation' && <MessageSquare className="w-4 h-4 text-blue-600" />}
                    {session.type === 'flashcards' && <BookOpen className="w-4 h-4 text-blue-600" />}
                    {session.type === 'oral_exam' && <Target className="w-4 h-4 text-blue-600" />}
                    <p className="font-medium text-gray-900">{session.type} Session</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{session.topic}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(session.date).toLocaleDateString()} • {session.duration} minutes</p>
                </div>
                <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700">Retry</Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DailyTip() {
  return (
    <Card className="shadow-sm bg-blue-50 border-blue-100">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Tip of the Day</h4>
            <p className="text-sm text-gray-600">Speak clearly and at a moderate pace to help Notewise understand you better.</p>
            <Link href="/help" className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block">
              View Help Docs →
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [initialResponse, setInitialResponse] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState<StudyMode>('explanation');
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const tutoringSessionPopupRef = useRef<any>(null);

  useEffect(() => {
    const checkSessionAndFetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }

        // Fetch user profile data including gamification fields
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, xp, level, streak, weekly_study_time, topics_reviewed, most_reviewed_topics, suggested_review_topics')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
        } else if (profile) {
          setUserProfile(profile);
        }

        // Fetch user's study materials from the 'notes' table
        const { data: materials, error: materialsError } = await supabase
          .from('notes')
          .select('id, title, file_name, created_at')
          .eq('user_id', session.user.id);

        if (materialsError) {
          console.error('Error fetching study materials:', materialsError);
        } else if (materials) {
          // Map fetched data to StudyMaterial interface
          const formattedMaterials: StudyMaterial[] = materials.map(m => ({
            id: m.id,
            name: m.title,
            type: m.file_name?.split('.').pop()?.toLowerCase() as 'pdf' | 'doc' | 'ppt' | 'txt' || 'txt',
            subject: 'General', // Default subject since it's not in the schema
            date: new Date(m.created_at).toLocaleDateString(),
          }));
          setStudyMaterials(formattedMaterials);
        }

      } catch (err) {
        console.error('Error checking session or fetching data:', err); // Updated error message
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkSessionAndFetchData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const endTutoringSession = async () => {
    if (tutoringSessionPopupRef.current?.cleanup) {
      await tutoringSessionPopupRef.current.cleanup();
    }
    setIsSessionActive(false);
    setInitialResponse(null);
  };

  const handleModeChange = (mode: StudyMode) => {
    setStudyMode(mode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              <Link href="/">
                <h1 className="text-2xl font-bold text-blue-600 cursor-pointer">Notewise</h1>
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/dashboard" className="text-gray-600 hover:text-blue-600">Dashboard</Link>
                <Link href="/upload" className="text-gray-600 hover:text-blue-600">Upload</Link>
                <Link href="/sessions" className="text-gray-600 hover:text-blue-600">Sessions</Link>
                <Link href="/help" className="text-gray-600 hover:text-blue-600">Help</Link>
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                >
                  <User className="w-6 h-6" />
                  <ChevronDown className="w-4 h-4" />
                </Button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2">
                    <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <button 
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
              <Button 
                variant="ghost" 
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
          
          {isMobileMenuOpen && (
            <nav className="md:hidden py-4 space-y-2">
              <Link href="/dashboard" className="block px-4 py-2 text-gray-600 hover:text-blue-600">Dashboard</Link>
              <Link href="/upload" className="block px-4 py-2 text-gray-600 hover:text-blue-600">Upload</Link>
              <Link href="/sessions" className="block px-4 py-2 text-gray-600 hover:text-blue-600">Sessions</Link>
              <Link href="/help" className="block px-4 py-2 text-gray-600 hover:text-blue-600">Help</Link>
            </nav>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WelcomeBanner 
          userName={userProfile?.full_name}
          xp={userProfile?.xp}
          level={userProfile?.level}
          streak={userProfile?.streak}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <StudyMaterials materials={studyMaterials} />
            <StudySession />
          </div>

          <div className="space-y-8">
            <StudyInsights 
              weeklyStudyTime={userProfile?.weekly_study_time}
              topicsReviewed={userProfile?.topics_reviewed}
              mostReviewedTopics={userProfile?.most_reviewed_topics}
              suggestedReviewTopics={userProfile?.suggested_review_topics}
            />
            <DailyTip />
          </div>
        </div>
      </main>

      <TutoringSessionPopup
        ref={tutoringSessionPopupRef}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        studyMode={studyMode}
        initialResponse={initialResponse}
        onEndSession={endTutoringSession}
      />
    </div>
  );
} 