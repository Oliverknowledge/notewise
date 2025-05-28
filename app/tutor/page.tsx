'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { vapiService } from '@/lib/vapi';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { Mic, MicOff, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import TutorChat from '../components/TutorChat';

type TutorMode = 'explain' | 'quiz' | 'summarize';

interface Message {
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function TutorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [tutorMode, setTutorMode] = useState<TutorMode>('explain');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isSpeakingState, setIsSpeakingState] = useState(false);

  // State to display the current AI response in the main area
  const [currentResponse, setCurrentResponse] = useState<string | null>(null);

  // Listen for Vapi events to update chat messages and speaking state
  useEffect(() => {
    const handleVapiMessage = (message: { content: string }) => {
      console.log('handleVapiMessage called with:', message);
      if (message?.content) {
        console.log('Received Vapi message in page and has content:', message);
        
        // Update the current response state for the main display
        setCurrentResponse(message.content);

        // Add message to chat state for the chat popup
        setChatMessages(prevMessages => {
          const newMessages = [...prevMessages, {
            content: message.content,
            sender: 'ai' as const,
            timestamp: new Date()
          }];
          console.log('Updating chatMessages with AI message:', newMessages);
          return newMessages;
        });
      }
    };

    const handleSpeechStart = () => {
      console.log('handleSpeechStart called');
      setIsSpeakingState(true);
    };

    const handleSpeechEnd = () => {
      console.log('handleSpeechEnd called');
      setIsSpeakingState(false);
    };
    
    const handleError = (error: any) => {
      console.error('Vapi error in page:', error);
      setError(error instanceof Error ? error.message : 'A Vapi error occurred.');
       setIsSpeakingState(false); // Assume not speaking on error
    };
    
    const handleCallEnd = () => {
       console.log('handleCallEnd called');
       setIsSessionActive(false);
       setIsSpeakingState(false);
       // Optionally clear messages or show a session ended message
    };

    // Register callbacks with vapiService
    console.log('Setting VapiService callbacks from page');
    vapiService.setCallbacks({
      onMessage: handleVapiMessage,
      onSpeechStart: handleSpeechStart,
      onSpeechEnd: handleSpeechEnd,
      onError: handleError,
      onCallEnd: handleCallEnd,
    });

    // Cleanup is handled by the vapiService internally when new callbacks are set or service is cleaned up
    // No need to remove listeners here as we are setting them via the service
    return () => {
       // If you needed cleanup specific to this component unmount, you would do it here
       // For now, rely on the vapiService to manage its internal listeners
    };

  }, [vapiService]); // Depend on vapiService to ensure callbacks are set if it re-initializes

  // Log chat messages whenever they change
  useEffect(() => {
    console.log('Chat messages updated in page:', chatMessages);
  }, [chatMessages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const saveNoteToDatabase = async (title: string, content: string, filePath: string | null = null) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('notes')
      .insert([
        {
          title,
          content,
          user_id: session.user.id,
          file_path: filePath,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save note: ${error.message}`);
    }

    return data;
  };

  const startTutoringSession = async () => {
    setLoading(true);
    setError(null);
    setChatMessages([]); // Clear previous messages
    setIsSpeakingState(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      if (!title.trim()) {
        throw new Error('Please provide a title for your notes');
      }

      let contentToUse = content;
      let filePath = null;

      if (file) {
        // Handle file upload and content extraction
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
          throw new Error('File size exceeds 50MB limit');
        }

        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ];

        if (!allowedTypes.includes(file.type)) {
          throw new Error('File type not supported. Please upload PDF, DOC, DOCX, or TXT files only.');
        }

        // Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

        const { data: fileData, error: uploadError } = await supabase.storage
          .from('notes')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`File upload failed: ${uploadError.message}`);
        }

        filePath = fileName;
        contentToUse = `Content from file: ${file.name}\n\n${content}`; // Keep existing text content if any
      } else if (!contentToUse.trim()) {
         throw new Error('Please provide some content or upload a file');
      }

      // Save note to database
      await saveNoteToDatabase(title, contentToUse, filePath);

      // Start the tutoring session with Vapi
      await vapiService.startTutoringSession(contentToUse);
      setIsSessionActive(true);

      // Add user's initial message to chat state
      setChatMessages(prevMessages => [...prevMessages, {
        content: `Please help me understand these notes: ${contentToUse}`,
        sender: 'user',
        timestamp: new Date()
      }]);

      // Add AI's initial welcome message to chat state
      const welcomeMessage = "I'm ready to help you learn! What would you like to know about this content?";
      setChatMessages(prevMessages => [...prevMessages, {
        content: welcomeMessage,
        sender: 'ai',
        timestamp: new Date()
      }]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start tutoring session');
      setLoading(false);
    }
  };

  const endTutoringSession = async () => {
    try {
      await vapiService.endSession();
      setIsSessionActive(false);
      setIsSpeakingState(false);
      // Optionally clear chat messages here: setChatMessages([]);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end session');
    }
  };

  const handleUserMessage = (messageContent: string) => {
    if (!messageContent.trim() || !isSessionActive) return;

    const newUserMessage: Message = {
      content: messageContent,
      sender: 'user',
      timestamp: new Date()
    };
    // Add user message to chat state immediately
    console.log('Adding user message to chatMessages:', newUserMessage);
    setChatMessages(prevMessages => [...prevMessages, newUserMessage]);

    // Send message to Vapi service using the correct method
    if (vapiService) {
      console.log('Sending user message to Vapi:', messageContent);
      vapiService.sendTextMessage(messageContent);
    } else {
      console.error('VapiService not available to send message');
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // This mute is for the browser's audio element, need to mute Vapi as well
    if (vapiService) {
      vapiService.toggleMute();
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    // This pause is for the browser's audio element
    // Vapi SDK might need a separate pause/resume call if available
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-700">AI Tutor</h1>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Upload Your Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter a title for your notes"
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Paste your notes here or upload a file..."
                      rows={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="file">Or Upload a File</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.txt"
                    />
                  </div>
                  <div>
                    <Label>Tutor Mode</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <Button
                        type="button"
                        variant={tutorMode === 'explain' ? 'default' : 'outline'}
                        onClick={() => setTutorMode('explain')}
                        className="w-full"
                      >
                        Explain
                      </Button>
                      <Button
                        type="button"
                        variant={tutorMode === 'quiz' ? 'default' : 'outline'}
                        onClick={() => setTutorMode('quiz')}
                        className="w-full"
                      >
                        Quiz
                      </Button>
                      <Button
                        type="button"
                        variant={tutorMode === 'summarize' ? 'default' : 'outline'}
                        onClick={() => setTutorMode('summarize')}
                        className="w-full"
                      >
                        Summarize
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={startTutoringSession}
                    disabled={loading || isSessionActive}
                    className="w-full"
                  >
                    {loading ? 'Starting Session...' : 'Start Tutoring Session'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Tutoring Session</CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
                    {error}
                  </div>
                )}

                {isSessionActive ? (
                  <div className="space-y-4">
                    {/* Display the current response here */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-gray-700">{currentResponse}</p>
                    </div>
                    <div className="flex justify-center space-x-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleMute}
                        className="rounded-full"
                      >
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={togglePause}
                        className="rounded-full"
                      >
                        {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={endTutoringSession}
                        className="rounded-full"
                      >
                        <MicOff className="h-5 w-5" />
                      </Button>
                    </div>
                    <audio ref={audioRef} className="hidden" />
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Mic className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Start a tutoring session to begin learning with your AI tutor</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• You can paste your notes directly or upload a file</li>
                  <li>• Choose between explanation, quiz, or summary modes</li>
                  <li>• Use the controls to pause, mute, or end the session</li>
                  <li>• Ask follow-up questions to dive deeper into topics</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <TutorChat 
        messages={chatMessages}
        isSpeaking={isSpeakingState}
        onSendMessage={handleUserMessage}
      />
    </div>
  );
} 