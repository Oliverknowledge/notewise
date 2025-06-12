'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ViewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: {
    id: string;
    title: string;
    mode: string;
    messages: Message[];
    created_at: string;
  } | null;
  onDelete: () => void;
}

export default function ViewSessionModal({ isOpen, onClose, session, onDelete }: ViewSessionModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll when messages change or when modal is opened
  useEffect(() => {
    if (isOpen && session?.messages) {
      // Small delay to ensure the chat is fully rendered before scrolling
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, session?.messages]);

  if (!isOpen || !session) return null;

  const handleDelete = async () => {
    console.log('Viewing session:', session);
    console.log('Messages in modal:', session.messages);
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', session.id);

      if (error) throw error;
      
      toast.success('Session deleted successfully');
      onDelete();
      onClose();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-[90vw] h-[90vh] max-w-6xl flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">{session.title}</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete Session'}
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
        <CardContent className="flex-1 flex flex-col overflow-hidden">
          <div className="mb-4 text-sm text-gray-500">
            Mode: {session.mode ? session.mode.charAt(0).toUpperCase() + session.mode.slice(1) : 'Unknown'}
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4 p-4 h-full">
              {session.messages?.map((message) => (
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 