'use client';

import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Volume2, VolumeX, Send, CheckCircle2, Circle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase-client';
import { addStudySessionXP } from '@/lib/gamification';
import { toast } from 'sonner';
import { vapiService } from '@/lib/vapi';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface Note {
  id: string;
  content: string;
  type: 'key-point' | 'question';
  completed?: boolean;
  timestamp: Date;
}

interface TutoringSessionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  studyMode: 'quiz' | 'explanation' | 'flashcards' | 'oral_exam' | 'feynman';
  initialResponse: string | null;
  onEndSession: () => void;
}

const generateMessageId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const TutoringSessionPopup = forwardRef(function TutoringSessionPopup({
  isOpen,
  onClose,
  studyMode,
  initialResponse,
  onEndSession,
}: TutoringSessionPopupProps, ref) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSessionStartTime(new Date());
    } else {
      setSessionStartTime(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const checkAudioSupport = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        
        setAudioAvailable(true);
      } catch (error) {
        setAudioAvailable(false);
      }
    };
    checkAudioSupport();
  }, []);

  useEffect(() => {
    if (viewportRef.current) {
      const scrollContainer = viewportRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (initialResponse && initialResponse.trim()) {
      const initialMessage: Message = {
        id: generateMessageId(),
        content: studyMode === 'feynman' 
          ? "I'll help you learn using the Feynman Technique. Explain the concept to me as if I'm a complete beginner. I'll ask questions to help you identify any gaps in your understanding."
          : initialResponse.trim(),
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages([initialMessage]);
    }
  }, [initialResponse, studyMode]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.action === 'app-message') {
        try {
          const data = JSON.parse(event.data.data);
          
          if (data.type === 'conversation-update') {
            const newMessages: Message[] = data.conversation
              .filter((msg: any) => msg.role === 'assistant' || msg.role === 'user')
              .map((msg: any) => ({
                id: generateMessageId(),
                content: msg.content,
                sender: msg.role === 'assistant' ? 'ai' : 'user',
                timestamp: new Date()
              }));
            setMessages(newMessages);

            const lastAssistant = [...data.conversation].reverse().find((msg: any) => msg.role === 'assistant');
            if (lastAssistant) {
              const keyPointRegex = /\[KEY_POINT\](.*?)\[\/KEY_POINT\]/g;
              const questionRegex = /\[QUESTION\](.*?)\[\/QUESTION\]/g;

              const keyPointMatches = Array.from(lastAssistant.content.matchAll(keyPointRegex)) as RegExpMatchArray[];
              keyPointMatches.forEach((match) => {
                const keyPointContent = match[1].trim();
                if (keyPointContent) {
                  const newNote = {
                    id: generateMessageId(),
                    content: keyPointContent,
                    type: 'key-point' as const,
                    timestamp: new Date()
                  };
                  setNotes(prev => [...prev, newNote]);
                }
              });

              const questionMatches = Array.from(lastAssistant.content.matchAll(questionRegex)) as RegExpMatchArray[];
              questionMatches.forEach((match) => {
                const questionContent = match[1].trim();
                if (questionContent) {
                  const newNote = {
                    id: generateMessageId(),
                    content: questionContent,
                    type: 'question' as const,
                    completed: false,
                    timestamp: new Date()
                  };
                  setNotes(prev => [...prev, newNote]);
                  setActiveTab('notes');
                }
              });
            }
          }
        } catch (error) {
          console.error('Error processing VAPI message:', error);
        }
      } else if (event.data.type === 'speech-start') {
        setIsSpeaking(true);
      } else if (event.data.type === 'speech-end') {
        setIsSpeaking(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSendMessage = async () => {
    const trimmedInput = userInput.trim();
    if (!trimmedInput) return;

    const userMessage: Message = {
      id: generateMessageId(),
      content: trimmedInput,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');

    vapiService.sendTextMessage(trimmedInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    window.postMessage({ type: 'toggle-mute' }, '*');
  };

  const toggleNoteCompletion = (noteId: string) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId ? { ...note, completed: !note.completed } : note
    ));
  };

  const handleEndSession = async () => {
    try {
      if (sessionStartTime) {
        // The XP logic was moved to session start in app/dashboard/page.tsx
        // No longer need to calculate and add XP here based on duration.
        // const sessionEndTime = new Date();
        // const durationMinutes = Math.round((sessionEndTime.getTime() - sessionStartTime.getTime()) / (1000 * 60));
        
        // const { data: { user } } = await supabase.auth.getUser();
        // if (user) {
        //   const result = await addStudySessionXP(user.id, durationMinutes);
        //   
        //   toast.success(`Session completed! You gained ${result.xpGained} XP${result.streakBonus > 1 ? ` (${Math.round((result.streakBonus - 1) * 100)}% streak bonus!)` : ''}`);
        // }
      }
      
      onEndSession();
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Failed to end session properly');
    }
  };

  useImperativeHandle(ref, () => ({
    cleanup: () => {
      setMessages([]);
      setNotes([]);
    }
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-[90vw] h-[90vh] max-w-6xl flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Tutoring Session</CardTitle>
          <div className="flex items-center space-x-2">
            {audioAvailable && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMuteToggle}
                className="hover:bg-gray-100"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={handleEndSession}
              className="hover:bg-red-100"
            >
              End Session
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="notes">Key Points & Questions</TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
              <ScrollArea className="h-[60vh] p-4">
                <div ref={viewportRef} className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.sender === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage}>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="notes" className="flex-1 mt-0">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                  {notes.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No key points or questions yet. They will appear here as the conversation progresses.
                    </div>
                  ) : (
                    notes.map((note) => (
                      <div
                        key={note.id}
                        className={`p-4 rounded-lg border ${
                          note.type === 'key-point'
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-green-50 border-green-200'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {note.type === 'question' && (
                            <button
                              onClick={() => toggleNoteCompletion(note.id)}
                              className="mt-1"
                            >
                              {note.completed ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <Circle className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                          )}
                          <div className="flex-1">
                            <div className="font-medium mb-1">
                              {note.type === 'key-point' ? 'Key Point' : 'Question'}
                            </div>
                            <div className="text-gray-700">{note.content}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
});

export default TutoringSessionPopup; 