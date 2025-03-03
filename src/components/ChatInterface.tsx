import React, { useState, useRef, useEffect } from 'react';
import { Send, Camera, Mic, X } from 'lucide-react';
import axios from 'axios';

// You will need to set these values from environment variables or a config
const CHATBASE_API_KEY = '97d59958-1389-47e3-aa20-3af1fb417bab'; // Replace with your actual key
const CHATBASE_CHAT_ID = '5GEgIBLfGTIMAwX6HOeuQ'; // Replace with your actual chat ID
const CHATBASE_API_URL = 'https://www.chatbase.co/api/v1/chat';

interface Message {
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamedMessage, setCurrentStreamedMessage] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamedMessage]);

  useEffect(() => {
    const response = axios.post(
      CHATBASE_API_URL,
      {
        messages:[
          {
            content: "hola",
            role: "user"
          },
      ],
        chatbotId: CHATBASE_CHAT_ID,
        stream: true,
        temperature: 0,
      },
      {
        headers: {
          Authorization: `Bearer ${CHATBASE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
      }
    ).then((response) => {
      setMessages(prev => [...prev, {
        content: response.data,
        role: 'assistant',
        timestamp: new Date()
      }]);
    });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;
    
    const newUserMessage: Message = {
      content: inputValue,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Transform messages for Chatbase format
      const chatbaseMessages = messages.concat(newUserMessage).map(msg => ({
        content: msg.content,
        role: msg.role
      }));
      setIsStreaming(true);
      setCurrentStreamedMessage('');
      debugger
      const response = await axios.post(
        CHATBASE_API_URL,
        {
          messages:chatbaseMessages,
          chatbotId: CHATBASE_CHAT_ID,
          stream: true,
          temperature: 0,
        },
        {
          headers: {
            Authorization: `Bearer ${CHATBASE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
        }
      );
          
      //const stream = await chatbaseService.streamChatMessage(chatbaseMessages);

      setMessages(prev => [...prev, {
        content: response.data,
        role: 'assistant',
        timestamp: new Date()
      }]);
      setCurrentStreamedMessage('');
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      debugger
      // Add error message
      const errorMessage: Message = {
        content: 'Sorry, there was an error processing your request.',
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser.');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');

      setInputValue(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Here you would typically upload the image and then include it in a message
    // For now we'll just add a placeholder message
    const newMessage: Message = {
      content: `[Image uploaded: ${file.name}]`,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto bg-black/20 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/10 shadow-xl text-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div 
              className={`max-w-[80%] p-3 rounded-xl ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-gray-700 text-white rounded-tl-none'
              }`}
            >
              {message.content}
            </div>
            <span className="text-xs text-gray-400 mt-1">
              {formatTimestamp(message.timestamp)}
            </span>
          </div>
        ))}
        
        {isStreaming && (
          <div className="flex flex-col items-start">
            <div className="max-w-[80%] p-3 rounded-xl bg-gray-700 text-white rounded-tl-none">
              {currentStreamedMessage || '...'}
            </div>
            <span className="text-xs text-gray-400 mt-1">
              {formatTimestamp(new Date())}
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 border-t border-white/10 bg-black/30">
        <div className="flex items-center space-x-2">
          <button 
            onClick={triggerImageUpload}
            className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <Camera size={20} />
          </button>
          
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
            ref={fileInputRef} 
            className="hidden" 
          />
          
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-white"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            
            {isRecording && (
              <button 
                onClick={stopSpeechRecognition}
                className="absolute right-2 top-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <button
            onClick={toggleRecording}
            className={`p-2 rounded-full transition-colors ${
              isRecording 
                ? 'bg-red-500 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Mic size={20} />
          </button>
          
          <button
            onClick={handleSendMessage}
            disabled={isLoading || inputValue.trim() === ''}
            className={`p-2 rounded-full ${
              isLoading || inputValue.trim() === '' 
                ? 'text-gray-500 bg-gray-700 cursor-not-allowed' 
                : 'text-white bg-blue-600 hover:bg-blue-700'
            } transition-colors`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
