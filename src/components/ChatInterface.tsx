
import React, { useState, useRef, useEffect } from 'react';
import { Send, Image, Mic, MicOff, Loader, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { initChatbaseConversation, sendChatbaseMessage } from '@/lib/chatbaseService';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type: 'text' | 'image';
}

interface ChatInterfaceProps {
  onTimeout: () => void;
}

const TIMEOUT_DURATION = 60000; // 1 minute in milliseconds

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onTimeout }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hola, soy AutoRescue. ¿En qué puedo ayudarte con el accidente?',
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize chat session
  useEffect(() => {
    const initChat = async () => {
      try {
        const id = await initChatbaseConversation();
        setSessionId(id);
        console.log("Chat session initialized with ID:", id);
      } catch (error) {
        console.error("Failed to initialize chat session", error);
        toast.error("Error al iniciar la sesión de chat. Inténtelo de nuevo.");
      }
    };

    initChat();
  }, []);

  // Monitor user activity for timeout
  useEffect(() => {
    const checkTimeout = setInterval(() => {
      const currentTime = Date.now();
      if (currentTime - lastActivityTime > TIMEOUT_DURATION) {
        console.log("Chat timeout - No activity for 1 minute");
        clearInterval(checkTimeout);
        onTimeout();
      }
    }, 5000);

    return () => clearInterval(checkTimeout);
  }, [lastActivityTime, onTimeout]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle user activity
  const updateActivity = () => {
    setLastActivityTime(Date.now());
  };

  // Set up speech recognition
  useEffect(() => {
    if (isRecording) {
      if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        toast.error("Su navegador no soporta reconocimiento de voz");
        setIsRecording(false);
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        updateActivity();
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      try {
        recognition.start();
      } catch (error) {
        console.error("Error starting voice recognition:", error);
        setIsRecording(false);
      }
    } else if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Error stopping recognition:", error);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error("Error stopping voice recognition during cleanup:", error);
        }
      }
    };
  }, [isRecording]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !sessionId) return;
    
    updateActivity();
    
    // Add user message to chat
    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      type: 'text'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Send message to Chatbase
      const response = await sendChatbaseMessage(
        sessionId as string,
        inputMessage
      );
      
      // Add assistant response to chat
      if (response) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: response,
          timestamp: new Date(),
          type: 'text'
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error sending message", error);
      toast.error("Error al enviar el mensaje. Inténtelo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    updateActivity();
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, suba solo archivos de imagen");
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen es demasiado grande. El tamaño máximo es 5MB");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      
      // Add image message to chat
      const imageMessage: Message = {
        role: 'user',
        content: imageDataUrl,
        timestamp: new Date(),
        type: 'image'
      };
      
      setMessages(prev => [...prev, imageMessage]);
      
      // TODO: Send image to Chatbase
      // For now, just add a response acknowledging the image
      setTimeout(() => {
        const responseMessage: Message = {
          role: 'assistant',
          content: "He recibido su imagen del accidente. ¿Puede proporcionarme más detalles sobre lo ocurrido?",
          timestamp: new Date(),
          type: 'text'
        };
        setMessages(prev => [...prev, responseMessage]);
      }, 1000);
    };
    
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleToggleRecording = () => {
    setIsRecording(prev => !prev);
    updateActivity();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    updateActivity();
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh] overflow-hidden animate-scale-in">
      <div className="flex items-center justify-between p-4 glass rounded-t-lg">
        <div className="flex items-center gap-3">
          <Avatar>
            <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold">
              AR
            </div>
          </Avatar>
          <div>
            <h2 className="font-medium">AutoRescue Asistente</h2>
            <p className="text-xs text-muted-foreground">Activo ahora</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onTimeout}
          className="rounded-full hover:bg-destructive/10 hover:text-destructive"
        >
          <XCircle size={20} />
        </Button>
      </div>
      
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-background/50"
      >
        {messages.map((message, index) => (
          <div 
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4 animate-slide-up`}
          >
            <Card className={`max-w-[80%] p-3 ${
              message.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'glass'
            }`}>
              {message.type === 'text' ? (
                <p className="text-sm">{message.content}</p>
              ) : (
                <img 
                  src={message.content} 
                  alt="User uploaded" 
                  className="max-w-full rounded-md"
                />
              )}
              <p className="text-xs opacity-70 mt-1 text-right">
                {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </p>
            </Card>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <Card className="glass p-3">
              <div className="flex items-center gap-2">
                <div className="waveform">
                  <div className="waveform-bar h-2 animate-wave-1"></div>
                  <div className="waveform-bar h-3 animate-wave-2"></div>
                  <div className="waveform-bar h-4 animate-wave-3"></div>
                </div>
                <p className="text-sm text-muted-foreground">Escribiendo...</p>
              </div>
            </Card>
          </div>
        )}
      </div>
      
      <div className="p-4 glass rounded-b-lg">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={18} />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </Button>
          
          <div className="relative flex-1">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? "Escuchando..." : "Escribe tu mensaje..."}
              className={`pr-10 ${isRecording ? 'border-primary' : ''}`}
              disabled={isLoading || isRecording}
            />
            {isRecording && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="waveform scale-75">
                  <div className="waveform-bar h-2 animate-wave-1"></div>
                  <div className="waveform-bar h-4 animate-wave-2"></div>
                  <div className="waveform-bar h-3 animate-wave-3"></div>
                </div>
              </div>
            )}
          </div>
          
          <Button
            variant="outline"
            size="icon"
            className={`rounded-full ${isRecording ? 'bg-primary text-primary-foreground' : ''}`}
            onClick={handleToggleRecording}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
          </Button>
          
          <Button
            size="icon"
            className="rounded-full"
            onClick={handleSendMessage}
            disabled={(!inputMessage.trim() && !isRecording) || isLoading}
          >
            {isLoading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
