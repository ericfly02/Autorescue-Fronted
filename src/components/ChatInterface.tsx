import React, { useState, useRef, useEffect } from 'react';
import { Send, Camera, Mic, X, LoaderCircle, MessageCircle } from 'lucide-react';
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
  const [initialLoading, setInitialLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
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
            responseType: 'text', // Changed to text for proper handling
          }
        );
        
        // Initial welcome message
        setMessages([{
          content: response.data || "¡Hola! Soy el asistente de AutoRescue. ¿En qué puedo ayudarte hoy?",
          role: 'assistant',
          timestamp: new Date()
        }]);
      } catch (error) {
        console.error('Error fetching initial message:', error);
        // Fallback welcome message
        setMessages([{
          content: "¡Hola! Soy el asistente de AutoRescue. ¿En qué puedo ayudarte con el parte de accidente?",
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
          stream: false, // Set to false for now for simplicity
          temperature: 0,
        },
        {
          headers: {
            Authorization: `Bearer ${CHATBASE_API_KEY}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      // Add bot response
      setMessages(prev => [...prev, {
        content: response.data?.text || "Lo siento, hubo un problema al procesar tu solicitud.",
        role: 'assistant',
        timestamp: new Date()
      }]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: Message = {
        content: 'Lo siento, hubo un error al procesar tu solicitud.',
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
    <div 
      ref={chatContainerRef}
      className="flex flex-col h-full w-full max-w-3xl mx-auto bg-gradient-to-br from-black/30 to-black/40 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.25)] text-white transition-all duration-300 ease-in-out"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <MessageCircle size={20} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">AutoRescue</h2>
            <p className="text-xs text-gray-300">Asistente para partes de accidente</p>
          </div>
        </div>
        <div className="flex space-x-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs text-gray-300">En línea</span>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-black/10">
        {initialLoading ? (
          <div className="flex flex-col items-center justify-center h-full py-10">
            <LoaderCircle size={40} className="text-blue-400 animate-spin mb-4" />
            <p className="text-gray-300 animate-pulse">Iniciando conversación...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <MessageCircle size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">¡Bienvenido a AutoRescue!</h3>
            <p className="text-gray-300 max-w-md">
              Estoy aquí para ayudarte con el parte de accidente. ¿En qué puedo asistirte hoy?
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}
              >
                <div 
                  className={`max-w-[85%] p-3.5 rounded-2xl shadow-md ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-tr-none transform hover:scale-[1.01] transition-transform' 
                      : 'bg-gradient-to-r from-gray-700/90 to-gray-800/90 text-white rounded-tl-none border border-white/5'
                  }`}
                >
                  {message.content}
                </div>
                <div className="flex items-center space-x-2 mt-1 px-1">
                  {message.role === 'assistant' && (
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs">
                      A
                    </div>
                  )}
                  <span className="text-xs text-gray-400">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}
            
            {isStreaming && (
              <div className="flex flex-col items-start animate-fade-in">
                <div className="max-w-[85%] p-3.5 rounded-2xl shadow-md bg-gradient-to-r from-gray-700/90 to-gray-800/90 text-white rounded-tl-none border border-white/5">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></span>
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-100"></span>
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-200"></span>
                    </div>
                    <span className="text-sm text-gray-300">Escribiendo</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-black/50 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <button 
            onClick={triggerImageUpload}
            className="p-2.5 rounded-full text-gray-300 hover:text-white hover:bg-blue-600/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            title="Subir imagen"
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
              placeholder="Escribe un mensaje..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none text-white placeholder-gray-400 shadow-inner transition-all duration-200"
              rows={1}
              style={{ minHeight: '50px', maxHeight: '120px' }}
              disabled={isLoading || initialLoading}
            />
            
            {isRecording && (
              <button 
                onClick={stopSpeechRecognition}
                className="absolute right-3 top-3 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
                title="Detener grabación"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <button
            onClick={toggleRecording}
            className={`p-2.5 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 ${
              isRecording 
                ? 'bg-red-500 text-white focus:ring-red-500/50' 
                : 'text-gray-300 hover:text-white hover:bg-blue-600/30 focus:ring-blue-500/50'
            }`}
            disabled={isLoading || initialLoading}
            title={isRecording ? "Detener grabación" : "Iniciar grabación de voz"}
          >
            <Mic size={20} />
          </button>
          
          <button
            onClick={handleSendMessage}
            disabled={isLoading || initialLoading || inputValue.trim() === ''}
            className={`p-2.5 rounded-full focus:outline-none focus:ring-2 transition-all duration-200 ${
              isLoading || initialLoading || inputValue.trim() === '' 
                ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:from-blue-500 hover:to-blue-600 focus:ring-blue-500/50 transform hover:scale-105'
            }`}
            title="Enviar mensaje"
          >
            {isLoading ? (
              <LoaderCircle size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
        
        {/* Status indicator */}
        <div className="flex justify-center mt-2">
          <p className="text-xs text-gray-400">
            {isLoading ? 'Procesando mensaje...' : 
             isRecording ? 'Grabando audio...' : 
             ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;