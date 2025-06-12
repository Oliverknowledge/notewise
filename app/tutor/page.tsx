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
import Link from 'next/link';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type TutorMode = 'explain' | 'quiz' | 'summarize' | 'feynman';

interface Message {
  id?: string;
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

  // Mute state for VapiService
  const [isMutedState, setIsMutedState] = useState(false);
  const [isPausedState, setIsPausedState] = useState(false);

  const handleToggleMute = () => {
    try {
      console.log('Toggling mute state...');
      vapiService.toggleMute();
      setIsMutedState(vapiService.isSessionMuted());
      console.log('Mute state toggled successfully');
    } catch (err) {
      console.error('Error toggling mute:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle mute');
    }
  };

  const handleTogglePause = () => {
    try {
      console.log('Toggling pause state...');
      vapiService.togglePause();
      setIsPausedState(vapiService.isSessionPaused());
      console.log('Pause state toggled successfully');
    } catch (err) {
      console.error('Error toggling pause:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle pause');
    }
  };

  // Listen for Vapi events to update chat messages and speaking state
  useEffect(() => {
    const handleVapiMessage = (message: { content: string }) => {
      console.log('handleVapiMessage called with:', message);
      if (message?.content) {
        console.log('Received Vapi message in page and has content:', message);
        
        // Update the current response state for the main display
        setCurrentResponse(message.content);

        // Add message to chat state for the chat popup
        // This is handled by onMessageReceived prop now
        // setChatMessages(prevMessages => {
        //   const newMessages = [...prevMessages, {
        //     content: message.content,
        //     sender: 'ai' as const,
        //     timestamp: new Date()
        //   }];
        //   console.log('Updating chatMessages with AI message:', newMessages);
        //   return newMessages;
        // });
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
       setIsMutedState(false); // Reset mute state on call end
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
    setIsMutedState(false); // Ensure not muted at the start of a session

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      if (!title.trim()) {
        throw new Error('Please provide a title for your notes');
      }

      // Upload file if present
      let filePath = '';
      let contentToUse = content;
      
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', session.user.id);
        

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }

        const uploadResult = await uploadResponse.json();
        filePath = uploadResult.fileName;
        contentToUse = uploadResult.summary || uploadResult.text || content;
      } else if (!contentToUse.trim()) {
        throw new Error('Please provide some content or upload a file');
      }

      // Save note to database
      await saveNoteToDatabase(title, contentToUse, filePath);
      const formdata2 = new FormData();
      formdata2.append('userId', session.user.id)
      
      const progressResponse = await fetch('/api/updateprogress', {
        method: "POST",
        body: formdata2
      })
      if (!progressResponse.ok) {
        throw new Error('Failed to update user progress');
      }
      // Start the tutoring session with Vapi using the summarized content and selected mode
      console.log('Starting Vapi session with content:', contentToUse, 'and mode:', tutorMode);
      await vapiService.startTutoringSession(contentToUse, tutorMode, title, false);
      
      setIsSessionActive(true);
      setChatMessages([]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start tutoring session');
      setLoading(false);
    }
  };

  const endTutoringSession = async () => {
    try {
      setLoading(true);
      setError(null);

      // End the Vapi session completely
      await vapiService.cleanup(); // Call cleanup for full resource release
      
      // Add a small delay to ensure Vapi resources are fully released
      await new Promise(resolve => setTimeout(resolve, 500));

      setIsSessionActive(false);
      setIsSpeakingState(false);
      setIsMutedState(false);

      // Save the chat session to the database
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Log the current state for debugging
      console.log('Current chat messages:', chatMessages);
      console.log('Current title:', title);
      console.log('Current tutor mode:', tutorMode);

      // Format messages for database storage
      const formattedMessages = chatMessages.map(msg => ({
        id: msg.id || crypto.randomUUID(),
        content: msg.content,
        sender: msg.sender,
        timestamp: msg.timestamp.toISOString()
      }));

      // Log the formatted data we're about to send
      const sessionData = {
        user_id: session.user.id,
        title: title || 'Untitled Session',
        mode: tutorMode,
        messages: formattedMessages,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      console.log('Attempting to save session data:', sessionData);

      const { data, error: saveError } = await supabase
        .from('chat_sessions')
        .insert([sessionData])
        .select();

      if (saveError) {
        console.error('Detailed save error:', {
          error: saveError,
          code: saveError.code,
          message: saveError.message,
          details: saveError.details,
          hint: saveError.hint
        });
        throw new Error(`Failed to save chat session: ${saveError.message}`);
      }

      console.log('Successfully saved session:', data);

      // Clear the chat messages
      setChatMessages([]);
      setCurrentResponse(null);

    } catch (err) {
      console.error('Detailed error in endTutoringSession:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(err instanceof Error ? err.message : 'Failed to end session');
    } finally {
      setLoading(false);
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
    setChatMessages(prevMessages => {
      const updatedMessages = [...prevMessages, newUserMessage];
      return updatedMessages;
    });

    // Send message to Vapi service using the correct method
    if (vapiService) {
      vapiService.sendTextMessage(messageContent);
    } else {
      console.error('VapiService not available to send message');
    }
  };

  const toggleMute = () => {
    // Mute state is now managed by handleToggleMute and passed down
    console.log('toggleMute in page called - state is managed externally');
  };

  const handleIncomingVapiMessage = (message: Message) => {
    setChatMessages(prevMessages => {
      const newMessages = [...prevMessages, message];
      return newMessages;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Notewise
            </Link>
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleMute}
                className={`hover:bg-gray-100 rounded-full ${isMutedState ? 'text-red-600' : 'text-blue-600'}`}
              >
                {isMutedState ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleTogglePause}
                className={`hover:bg-gray-100 rounded-full ${isPausedState ? 'text-red-600' : 'text-blue-600'}`}
              >
                {isPausedState ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 6h4v12H6zm8 0h4v12h-4z" />
                  </svg>
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={endTutoringSession}
                className="hover:bg-red-100 rounded-full px-6"
              >
                End Session
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Input Form */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100/50">
                <CardTitle className="text-xl font-semibold text-blue-900">Start a Tutoring Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a title for your notes"
                    className="w-full border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Tutoring Mode</Label>
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => setTutorMode('explain')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        tutorMode === 'explain'
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm'
                      }`}
                  >
                      <div className="font-medium text-left text-gray-900">Explain Topic</div>
                      <p className="text-sm text-gray-600 mt-1">Get a detailed explanation of your notes with examples and analogies</p>
                    </button>
                    
                    <button
                      onClick={() => setTutorMode('quiz')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        tutorMode === 'quiz'
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm'
                      }`}
                    >
                      <div className="font-medium text-left text-gray-900">Practice with Questions</div>
                      <p className="text-sm text-gray-600 mt-1">Test your understanding with interactive questions and feedback</p>
                    </button>
                    
                    <button
                      onClick={() => setTutorMode('feynman')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        tutorMode === 'feynman'
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm'
                      }`}
                    >
                      <div className="font-medium text-left text-gray-900">Feynman Technique</div>
                      <p className="text-sm text-gray-600 mt-1">Learn by teaching - explain concepts as if teaching a beginner</p>
                    </button>
                    </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content" className="text-sm font-medium text-gray-700">Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter your notes or content to discuss"
                    className="min-h-[200px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file" className="text-sm font-medium text-gray-700">Upload File (Optional)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.txt,.pptx,.ppt"
                      className="flex-1 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                    {file && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFile(null)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Supported formats: PDF, DOC, DOCX, TXT (max 50MB)
                  </p>
                </div>

                <Button
                  onClick={startTutoringSession}
                  disabled={loading || !title.trim() || (!content.trim() && !file)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 text-lg font-medium shadow-md hover:shadow-lg transition-all"
                >
                  {loading ? 'Starting Session...' : 'Start Tutoring Session'}
                </Button>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - AI Response */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 h-full">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100/50">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-semibold text-blue-900">AI Tutor Response</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {isSessionActive ? (
                  <div className="prose prose-blue max-w-none">
                    {currentResponse ? (
                      <div className="whitespace-pre-wrap bg-white rounded-xl p-6 shadow-sm">
                        {currentResponse}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-12">
                        <p className="text-lg">Start speaking or type your question in the chat</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-12">
                    <p className="text-lg">Start a tutoring session to begin learning</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <TutorChat
        messages={chatMessages}
        isSpeaking={isSpeakingState}
        onToggleMute={handleToggleMute}
        onEndSession={endTutoringSession}
        isMuted={isMutedState}
        onSendMessage={handleUserMessage}
        onMessageReceived={handleIncomingVapiMessage}
      />
    </div>
  );
} 