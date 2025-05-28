"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { vapiService } from '@/lib/vapi';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TutoringSessionPopup from '@/components/TutoringSessionPopup';
import UserProfile from '../components/UserProfile';
import { motion } from 'framer-motion';

type StudyMode = 'question' | 'explanation' | 'summary' | 'practice';

interface Note {
  id: string;
  title: string;
  content: string;
  file_name?: string;
  file_path?: string;
  created_at: string;
}

const motivationalQuotes = [
  "Learning never exhausts the mind. – Leonardo da Vinci",
  "The beautiful thing about learning is nobody can take it away from you. – B.B. King",
  "Success is the sum of small efforts, repeated day in and day out. – Robert Collier",
  "Education is the passport to the future, for tomorrow belongs to those who prepare for it today. – Malcolm X",
];

function DailyMotivation() {
  const [quote, setQuote] = useState(motivationalQuotes[0]);

  useEffect(() => {
    setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Motivation</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 italic">{quote}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [initialResponse, setInitialResponse] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState<StudyMode>('explanation');
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const tutoringSessionPopupRef = useRef<any>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }

        fetchNotes(session.user.id);
      } catch (err) {
        console.error('Error checking session:', err);
        router.push('/login');
      }
    };

    checkSession();
  }, [router]);

  const fetchNotes = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError(null);

    try {
      if (!title.trim()) throw new Error('Title is required');
      if (!content.trim()) throw new Error('Content is required');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      
      let filePath = null;
      if (file) {
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) throw new Error('File size exceeds 50MB limit');

        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ];
        
        if (!allowedTypes.includes(file.type)) {
          throw new Error('File type not supported. Please upload PDF, DOC, DOCX, or TXT files only.');
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
        
        const { data: fileData, error: uploadError } = await supabase.storage
          .from('notes')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw new Error(`File upload failed: ${uploadError.message}`);
        filePath = fileName;
      }

      const { data, error } = await supabase
        .from('notes')
        .insert([
          {
            title,
            content,
            user_id: session.user.id,
            file_name: file?.name,
            file_path: filePath,
          },
        ])
        .select()
        .single();

      if (error) {
        if (filePath) {
          await supabase.storage.from('notes').remove([filePath]);
        }
        throw new Error(`Database error: ${error.message}`);
      }

      setNotes([data, ...notes]);
      setTitle("");
      setContent("");
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setUploading(false);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-700">NoteWise</h1>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <UserProfile />
            
            <Card>
              <CardHeader>
                <CardTitle>Upload New Note</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter note title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Enter note content"
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="file">Attach File (Optional)</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.txt"
                    />
                  </div>
                  <Button type="submit" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Upload Note'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading notes...</p>
                ) : notes.length === 0 ? (
                  <p>No notes yet. Start by uploading your first note!</p>
                ) : (
                  <div className="space-y-4">
                    {notes.map((note) => (
                      <Card key={note.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg">{note.title}</h3>
                          <p className="text-gray-600 mt-2">{note.content}</p>
                          {note.file_name && (
                            <p className="text-sm text-gray-500 mt-2">
                              Attached file: {note.file_name}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Study Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button
                    variant="default"
                    onClick={() => router.push('/tutor')}
                    className="w-full"
                  >
                    Start AI Tutoring Session
                  </Button>
                  <Button
                    variant={studyMode === 'explanation' ? 'default' : 'outline'}
                    onClick={() => handleModeChange('explanation')}
                    className="w-full"
                  >
                    Get Explanation
                  </Button>
                  <Button
                    variant={studyMode === 'question' ? 'default' : 'outline'}
                    onClick={() => handleModeChange('question')}
                    className="w-full"
                  >
                    Practice Questions
                  </Button>
                  <Button
                    variant={studyMode === 'summary' ? 'default' : 'outline'}
                    onClick={() => handleModeChange('summary')}
                    className="w-full"
                  >
                    Generate Summary
                  </Button>
                </div>
              </CardContent>
            </Card>

            <DailyMotivation />
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