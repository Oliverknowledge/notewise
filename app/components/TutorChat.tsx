'use client';

import { useState, useEffect, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

interface Message {
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface TutorChatProps {
  messages: Message[];
  isSpeaking: boolean;
  onToggleMute: () => void;
  onEndSession: () => Promise<void>;
  isMuted: boolean;
  onSendMessage: (messageContent: string) => void;
  onMessageReceived: (message: Message) => void;
}

export default function TutorChat({ onToggleMute, onEndSession, isMuted, isSpeaking, onSendMessage, messages, onMessageReceived }: TutorChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  
  // Ref for the messages container to enable auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Function to scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll when messages change or when speaking status changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isSpeaking]);

  // Also scroll when chat is opened
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the chat is fully rendered
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.action === 'app-message') {
        if (!isOpen) {
          setShowNotification(true);
        }

        let parsedData = null;
        if (typeof event.data.data === 'string') {
          try {
            // Only try to parse if it looks like JSON
            if (event.data.data.trim().startsWith('{') || event.data.data.trim().startsWith('[')) {
              parsedData = JSON.parse(event.data.data);
            } else {
              return;
            }
          } catch (error) {
            return;
          }
        }

        if (parsedData && typeof parsedData === 'object' && parsedData.type === 'transcript') {
          if (parsedData.transcriptType === "final") {
            onMessageReceived({
              content: parsedData.transcript,
              sender: parsedData.role === 'user' ? 'user' : 'ai',
              timestamp: new Date()
            });
          } else if (parsedData.transcriptType === "interim") {
          }
        } else if (parsedData && typeof parsedData === 'object') {
          if (parsedData.type === 'speech-start') {
          } else if (parsedData.type === 'speech-end') {
          }
        }
      } else if (event.data && event.data.type === 'speech-start') {
      } else if (event.data && event.data.type === 'speech-end') {
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isOpen]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSendMessage = () => {
    
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleTogglePause = () => {
    onToggleMute();
  };

  const handleStopConversation = async () => {
    console.log('Stop conversation clicked');
    await onEndSession();
    setShowNotification(false);
  };

  return (
    <>
      <button
        onClick={() => { setIsOpen(!isOpen); setShowNotification(false); }}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 z-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {showNotification && (
          <span className="absolute top-0 right-0 block h-4 w-4 transform -translate-y-1/2 translate-x-1/2 rounded-full ring-2 ring-white bg-red-500 animate-pulse"></span>
        )}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Dark transparent overlay for maximized mode */}
            {isFullScreen && (
              <Motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={() => setIsFullScreen(false)}
              />
            )}

            <Motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`fixed bg-white shadow-xl flex flex-col z-50 overflow-hidden rounded-lg ${
                isFullScreen 
                  ? 'top-[5%] left-[5%] right-[5%] bottom-[5%] w-[90%] h-[90%]' 
                  : 'bottom-20 right-4 w-96 h-[500px]'
              }`}
            >
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Tutor Chat</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label={isFullScreen ? 'Minimize chat' : 'Maximize chat'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {isFullScreen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m0 0l-3-3m3 3l3-3m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h6m0 0l-3-3m3 3l-3 3m-4-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                  </button>
                  <button
                    onClick={handleTogglePause}
                    className={`p-2 rounded-lg transition-colors ${
                      isMuted 
                        ? 'text-red-600 hover:text-red-700 hover:bg-red-50' 
                        : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                    }`}
                    aria-label={isMuted ? 'Resume conversation' : 'Pause conversation'}
                  >
                    {isMuted ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 6h4v12H6zm8 0h4v12h-4z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={handleStopConversation}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Stop conversation"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
              >
                {messages.map((message, index) => (
                  <Motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-800'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      <span className={`text-xs mt-2 block ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </Motion.div>
                ))}
                {isSpeaking && (
                  <Motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </Motion.div>
                )}
                {/* Invisible div to scroll to */}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t bg-white">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </Motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}