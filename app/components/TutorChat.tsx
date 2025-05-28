'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function TutorChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.action === 'app-message') {
        console.log('Received app-message:', event.data);
        if (!isOpen) {
          console.log('Setting showNotification to true');
          setShowNotification(true);
        }

        let parsedData = null;
        if (typeof event.data.data === 'string') {
          try {
            parsedData = JSON.parse(event.data.data);
          } catch (error) {
            console.error('Failed to parse data as JSON:', event.data.data, error);
          }
        }

        if (parsedData && typeof parsedData === 'object' && parsedData.type === 'transcript') {
          if (parsedData.transcriptType === "final") {
            console.log('app-message final transcript:', parsedData);
            setMessages(prev => [...prev, {
              content: parsedData.transcript,
              sender: parsedData.role === 'user' ? 'user' : 'ai',
              timestamp: new Date()
            }]);
          } else if (parsedData.transcriptType === "interim") {
            console.log('app-message interim transcript:', parsedData);
          }
        } else if (event.data.type === 'speech-start') {
          console.log('speech-start message received (direct type):', event.data);
          setIsSpeaking(true);
        } else if (event.data.type === 'speech-end') {
          console.log('speech-end message received (direct type):', event.data);
          setIsSpeaking(false);
        }
      } else if (event.data && event.data.type === 'speech-start' && event.data.action !== 'app-message') {
        console.log('speech-start message received (not app-message):', event.data);
        setIsSpeaking(true);
      } else if (event.data && event.data.type === 'speech-end' && event.data.action !== 'app-message') {
        console.log('speech-end message received (not app-message):', event.data);
        setIsSpeaking(false);
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
      const newUserMessage: Message = {
        content: inputValue,
        sender: 'user',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newUserMessage]);
      setInputValue('');
      console.log('User sent message:', inputValue);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <button
        onClick={() => { setIsOpen(!isOpen); setShowNotification(false); }}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 focus:outline-none"
      >
        {showNotification && (
          <span className="absolute top-0 right-0 block h-3 w-3 transform -translate-y-1/2 translate-x-1/2 rounded-full ring-2 ring-white bg-red-400"></span>
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setIsFullScreen(false)} // Minimize chat when clicking outside overlay in full screen
              />
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`fixed bg-white shadow-xl flex flex-col z-50 overflow-auto rounded-lg ${isFullScreen ? '' : 'bottom-20 right-4 w-96 h-[500px]'}`}
              style={{
                ...(isFullScreen ? { top: '10%', left: '10%', right: '10%', bottom: '10%', width: '80%', height: '80%' } : {}),
              }}
            >
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">Tutor Chat</h3>
                <div className="flex items-center">
                  <button
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className="text-gray-500 hover:text-gray-700 mr-2"
                    aria-label={isFullScreen ? 'Minimize chat' : 'Maximize chat'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {isFullScreen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m0 0l-3-3m3 3l3-3m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h6m0 0l-3-3m3 3l-3 3m-4-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
                {isSpeaking && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="p-4 border-t flex items-center">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 mr-2 border rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
} 