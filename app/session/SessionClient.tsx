"use client";

import { useState, useEffect, useRef } from "react";
import { motion as m, AnimatePresence } from "framer-motion";
import { vapiService } from '@/lib/vapi';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Volume2, VolumeX, Send, Trophy, Star, Target, Brain } from 'lucide-react';
import TutoringSessionPopup from '@/components/TutoringSessionPopup';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface Achievement {
  id: string;
  type: 'xp' | 'badge' | 'streak';
  value: number;
  message: string;
}

export default function SessionClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [currentXP, setCurrentXP] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check audio availability
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
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for messages and achievements
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === 'message') {
        const newMessage: Message = {
          id: Math.random().toString(36).substr(2, 9),
          content: event.data.content,
          sender: event.data.sender,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);

        // Add XP for AI responses
        if (event.data.sender === 'ai') {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const xpGain = Math.floor(Math.random() * 10) + 5; // 5-15 XP per response
              const { error } = await supabase.rpc('add_xp', {
                user_id: user.id,
                xp_amount: xpGain
              });

              if (error) {
                console.error('Error adding XP:', error);
                return;
              }

              // Get updated user data
              const { data: updatedUserData } = await supabase
                .from('profiles')
                .select('xp, level')
                .eq('id', user.id)
                .single();

              if (updatedUserData) {
                setCurrentXP(updatedUserData.xp);
                if (updatedUserData.level > currentLevel) {
                  setAchievements(prev => [...prev, {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'xp',
                    value: updatedUserData.xp,
                    message: `Level Up! You're now level ${updatedUserData.level}!`
                  }]);
                  setCurrentLevel(updatedUserData.level);
                }
              }
            }
          } catch (error) {
            console.error('Error handling XP gain:', error);
          }
        }
      } else if (event.data.type === 'speech-start') {
        setIsSpeaking(true);
      } else if (event.data.type === 'speech-end') {
        setIsSpeaking(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentLevel]);

  const handleSendMessage = async () => {
    const trimmedInput = userInput.trim();
    if (!trimmedInput) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      content: trimmedInput,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg p-4 flex flex-col">
        <div className="mb-8">
          <h2 className="text-lg font-bold text-blue-800 mb-2">Session Progress</h2>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-blue-700">Level {currentLevel}</span>
                <span className="text-xs text-blue-500">{currentXP} XP</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <m.div
                  className="bg-blue-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentXP % 100)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">Active Streak: 3 days</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-blue-800 mb-2">Recent Achievements</h2>
          <div className="space-y-2">
            {achievements.slice(-3).map(achievement => (
              <m.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg p-2 shadow-sm border border-gray-100"
              >
                <p className="text-sm text-gray-700">{achievement.message}</p>
              </m.div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white shadow-sm p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-800">Tutoring Session</h1>
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
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((message) => (
              <m.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white shadow-sm border border-gray-100'
                  }`}
                >
                  {message.content}
                </div>
              </m.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="bg-white border-t p-4">
          <div className="max-w-3xl mx-auto flex space-x-2">
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
      </div>

      {/* Achievement Popups */}
      <AnimatePresence>
        {achievements.map(achievement => (
          <m.div
            key={achievement.id}
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border border-gray-100"
          >
            <div className="flex items-center space-x-2">
              {achievement.type === 'xp' && <Star className="h-5 w-5 text-yellow-500" />}
              {achievement.type === 'badge' && <Trophy className="h-5 w-5 text-green-500" />}
              {achievement.type === 'streak' && <Target className="h-5 w-5 text-blue-500" />}
              <p className="text-sm font-medium">{achievement.message}</p>
            </div>
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
} 