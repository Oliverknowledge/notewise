'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from 'next/link';
import { format } from 'date-fns';
import ViewSessionModal from '@/app/components/ViewSessionModal';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  mode: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);

  const fetchSessions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Parse the messages JSON string if it's stored as a string
      const parsedSessions = (data || []).map(session => ({
        ...session,
        messages: typeof session.messages === 'string' 
          ? JSON.parse(session.messages) 
          : session.messages || []
      }));

      setSessions(parsedSessions);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Notewise
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/tutor" className="text-gray-600 hover:text-blue-600 transition-colors">
                Tutor
              </Link>
              <Link href="/history" className="text-blue-600 font-medium">
                History
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-lg border-0">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100/50">
            <CardTitle className="text-xl font-semibold text-blue-900">Chat History</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading sessions...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No chat sessions found</p>
                <Button
                  onClick={() => router.push('/tutor')}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Start a New Session
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <Card key={session.id} className="border border-gray-200 hover:border-blue-300 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{session.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {format(new Date(session.created_at), 'MMM d, yyyy h:mm a')}
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                              Mode: {session.mode ? session.mode.charAt(0).toUpperCase() + session.mode.slice(1) : 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Messages: {session.messages?.length || 0}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedSession(session)}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </main>

      <ViewSessionModal
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        session={selectedSession}
        onDelete={fetchSessions}
      />
    </div>
  );
} 