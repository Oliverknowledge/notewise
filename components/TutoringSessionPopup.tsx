import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle, useLayoutEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Mic, MicOff, Send, BookOpen, CheckCircle2, Circle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Volume2, VolumeX } from 'lucide-react';

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
  studyMode: 'quiz' | 'explanation' | 'flashcards' | 'oral_exam';
  initialResponse: string | null;
  onEndSession: () => void;
}

// Generate a unique ID for messages
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if audio is available
  useEffect(() => {
    const checkAudioSupport = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        
        setAudioAvailable(true);
      } catch (error) {
        console.warn('Audio not available:', error);
        setAudioAvailable(false);
      }
    };
    checkAudioSupport();
  }, []);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useLayoutEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize messages with the initial response
  useEffect(() => {
    if (initialResponse && initialResponse.trim()) {
      console.log('Setting initial response:', initialResponse);
      const initialMessage: Message = {
        id: generateMessageId(),
        content: initialResponse.trim(),
        sender: 'ai',
        timestamp: new Date()
      };
      console.log('Adding initial message:', initialMessage);
      setMessages([initialMessage]);
    }
  }, [initialResponse]);

  // Listen for new messages from the AI
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('Received message event:', event.data);

      if (event.data.action === 'app-message') {
        try {
          const data = JSON.parse(event.data.data);
          
          if (data.type === 'conversation-update') {
            // Map the conversation array to Message[] format (user and assistant only)
            const newMessages: Message[] = data.conversation
              .filter((msg: any) => msg.role === 'assistant' || msg.role === 'user')
              .map((msg: any) => ({
                id: generateMessageId(),
                content: msg.content,
                sender: msg.role === 'assistant' ? 'ai' : 'user',
                timestamp: new Date()
              }));
            setMessages(newMessages);

            // Extract key points/questions from the latest assistant message only
            const lastAssistant = [...data.conversation].reverse().find((msg: any) => msg.role === 'assistant');
            if (lastAssistant) {
              const keyPointRegex = /\[KEY_POINT\](.*?)\[\/KEY_POINT\]/g;
              const questionRegex = /\[QUESTION\](.*?)\[\/QUESTION\]/g;

              // Extract and add key points
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

              // Extract and add questions
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
        console.log('Speech started');
        setIsSpeaking(true);
      } else if (event.data.type === 'speech-end') {
        console.log('Speech ended');
        setIsSpeaking(false);
      }
    };

    console.log('Setting up message event listener');
    window.addEventListener('message', handleMessage);
    return () => {
      console.log('Cleaning up message event listener');
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Prevent scrolling when popup is open
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
    if (!trimmedInput) {
      console.log('Attempted to send empty message');
      return;
    }

    console.log('Sending user message:', trimmedInput);

    // Add user message to chat
    const userMessage: Message = {
      id: generateMessageId(),
      content: trimmedInput,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');

    // Send message to Vapi
    try {
      window.postMessage({ 
        type: 'user-message',
        content: trimmedInput
      }, '*');
    } catch (error) {
      console.error('Error sending message:', error);
    }
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

  // Expose a cleanup method to parent
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
              onClick={onEndSession}
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
                <div className="space-y-4">
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
                  <div ref={messagesEndRef} />
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