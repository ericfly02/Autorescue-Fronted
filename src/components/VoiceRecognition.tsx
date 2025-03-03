
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';

interface VoiceRecognitionProps {
  onRecognized: (activated: boolean) => void;
  isListening: boolean;
  activationPhrase?: string;
  deactivatePhrase?: string;
}

const VoiceRecognition: React.FC<VoiceRecognitionProps> = ({
  onRecognized,
  isListening,
  activationPhrase = "sí",
  deactivatePhrase = "no"
}) => {
  const [transcript, setTranscript] = useState<string>("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const activationPhraseRef = useRef<string>(activationPhrase.toLowerCase());

  useEffect(() => {
    // Check if browser supports SpeechRecognition
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      console.error("Speech recognition not supported in this browser");
      return;
    }

    // Initialize SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES'; // Spanish language

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      // Collect results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase();
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);
      
      // Check if the activation phrase is detected
      if (currentTranscript.includes(activationPhraseRef.current)) {
        console.log("Activation phrase detected:", activationPhraseRef.current);
        onRecognized(true);
      }
      else if(currentTranscript.includes(deactivatePhrase)){
        console.log("Deactivation phrase detected:", deactivatePhrase);
        onRecognized(false);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
    };

    // Start/stop recognition based on isListening prop
    if (isListening) {
      try {
        recognition.start();
        console.log("Voice recognition started");
      } catch (error) {
        console.error("Error starting voice recognition:", error);
      }
    } else if (recognitionRef.current) {
      try {
        recognition.stop();
        console.log("Voice recognition stopped");
      } catch (error) {
        console.error("Error stopping voice recognition:", error);
      }
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        try {
          recognition.stop();
        } catch (error) {
          console.error("Error stopping voice recognition during cleanup:", error);
        }
      }
    };
  }, [isListening, onRecognized]);

  return (
    <div className="flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="glass rounded-full p-6 mb-4">
        {isListening ? (
          <div className="relative">
            <Mic size={48} className="text-primary animate-pulse" />
            <div className="absolute -inset-3 border-4 border-primary/30 rounded-full animate-pulse-ring"></div>
          </div>
        ) : (
          <MicOff size={48} className="text-muted-foreground" />
        )}
      </div>
      
      {isListening && (
        <>
          <div className="waveform my-4">
            <div className="waveform-bar h-4 animate-wave-1"></div>
            <div className="waveform-bar h-8 animate-wave-2"></div>
            <div className="waveform-bar h-12 animate-wave-3"></div>
            <div className="waveform-bar h-8 animate-wave-4"></div>
            <div className="waveform-bar h-4 animate-wave-5"></div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm font-medium text-muted-foreground"> 
              ¿Es una emergencia? Di "<span className="text-primary font-bold">{activationPhrase}</span>" para activar la asistencia automatica
            </p>
            {transcript && (
              <div className="mt-2 p-3 glass rounded-lg max-w-md animate-scale-in">
                <p className="text-sm text-foreground/80">{transcript}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VoiceRecognition;
