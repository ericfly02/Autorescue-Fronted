import React, { useState, useRef, useEffect } from 'react';
import { Send, Camera, Mic, X, LoaderCircle, Sparkles, MessageCircle } from 'lucide-react';
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

interface ChatInterfaceProps {
  setAppState: (activated: string) => void;
}

const startSpeechRecognition = (callback: (transcript: string) => void) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.error('Speech recognition not supported in this browser.');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'es-ES';

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const transcript = Array.from(event.results)
      .map(result => result[0].transcript)
      .join('');

    callback(transcript);
  };

  recognition.start();
  return recognition;
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({setAppState}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamedMessage, setCurrentStreamedMessage] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamedMessage]);

  useEffect(() => {
    const fetchInitialMessage = async () => {
      try {
        setInitialLoading(true);
        const response = await axios.post(
          CHATBASE_API_URL,
          {
            messages:[
              {
                content: "hi",
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
            responseType: 'text',
          }
        );
        
        // Initial welcome message
        setMessages([{
          content: response.data || "Hi it's Maria your virtual AutoRescue Assistant how can I help you today?",
          role: 'assistant',
          timestamp: new Date()
        }]);
      } catch (error) {
        console.error('Error fetching initial message:', error);
        // Fallback welcome message
        setMessages([{
          content: "Hi it's Maria your virtual AutoRescue Assistant how can I help you today?",
          role: 'assistant',
          timestamp: new Date()
        }]);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialMessage();
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
      
      const response = await axios.post(
        CHATBASE_API_URL,
        {
          messages: chatbaseMessages,
          chatbotId: CHATBASE_CHAT_ID,
          stream: false,
          temperature: 0,
        },
        {
          headers: {
            Authorization: `Bearer ${CHATBASE_API_KEY}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.data?.text.includes("Data obtained correctly")) {
        
        await axios.post("http://127.0.0.1:8084/api/autorescue/sendForm", {
          "idDocument": "FIC80142",
          "name": "Marta Galeano Grijalba",
          "carPlate": "0000BBB",
          "description": "At 10:00 AM, a minor frontal collision occurred at Plaza España involving a white Seat Panda."
        })
        
        setTimeout(() => {
          setAppState('completed');
        }, 5000)
        
      }
      
      // Add bot response
      setMessages(prev => [...prev, {
        content: response.data?.text || "Sorry ther's been an error processign your request",
        role: 'assistant',
        timestamp: new Date()
      }]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: Message = {
        content: "Sorry ther's been an error processign your request",
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setCurrentStreamedMessage('');
    }
  };

  const startRecording = () => {
    const recognition = startSpeechRecognition((transcript) => {
      setInputValue(transcript);
    });
    
    if (recognition) {
      recognitionRef.current = recognition;
      setIsRecording(true);
      
      recognition.onend = () => {
        setIsRecording(false);
      };
    }
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
      startRecording();
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

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="chat-container">
      {/* Welcome Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="bg-primary/10 p-2 rounded-full">
            <MessageCircle size={24} className="text-primary" />
          </div>
          <h1 className="text-2xl font-medium">AutoRescue Assistant</h1>
        </div>
        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <Sparkles size={16} className="text-primary" />
          <span>AI powered</span>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 overflow-x-hidden bg-chat-pattern p-4 rounded-2xl backdrop-blur-sm">
        {initialLoading ? (
          <div className="flex items-center justify-center h-32">
            <LoaderCircle className="animate-spin text-primary" size={32} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
            <MessageCircle size={48} className="text-gray-300" />
            <p>Envía un mensaje para comenzar a chatear</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div 
                key={index}
                className={`message-container ${message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex flex-col max-w-[80%]">
                  <div className={`message-bubble ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}>
                    {message.content}
                  </div>
                  <span className={`text-xs text-gray-500 mt-1 ${message.role === 'user' ? 'text-right mr-1' : 'ml-1'}`}>
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}
            
            {isStreaming && (
              <div className="flex justify-start">
                <div className="flex flex-col max-w-[80%]">
                  <div className="message-bubble assistant-message">
                    <div className="flex space-x-2 items-center">
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>
      
      {/* Input Area */}
      <div className="mt-4">
        {/* Input Container with Frosted Glass Effect */}
        <div className="input-container h-12">
          <button 
            onClick={triggerImageUpload}
            className="action-button text-gray-400 hover:text-primary"
            aria-label="Upload image"
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
          
          <div className="flex-1 relative mx-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              className="w-full bg-transparent border-none focus:outline-none resize-none py-2 max-h-24"
              rows={1}
            />
            
            {isRecording && (
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse-slow"></div>
                <button 
                  onClick={stopSpeechRecognition}
                  className="p-1 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
                  aria-label="Stop recording"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={toggleRecording}
              className={`action-button ${
                isRecording 
                  ? 'text-red-500 bg-red-50' 
                  : 'text-gray-400 hover:text-primary'
              }`}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              <Mic size={20} />
            </button>
            
            <button
              onClick={handleSendMessage}
              disabled={isLoading || inputValue.trim() === ''}
              className={`action-button ${
                isLoading || inputValue.trim() === '' 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-primary hover:bg-primary/10'
              }`}
              aria-label="Send message"
            >
              {isLoading ? (
                <LoaderCircle size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </div>
        
        {/* Click anywhere to focus hint */}
        <div className="text-center mt-2">
          <button 
            onClick={focusInput}
            className="text-xs text-gray-400 hover:text-primary transition-colors"
          >
            Cloick to start
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
