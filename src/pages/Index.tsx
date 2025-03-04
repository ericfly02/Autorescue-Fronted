
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield, ShieldAlert } from 'lucide-react';
import VoiceRecognition from '@/components/VoiceRecognition';
import LoadingScreen from '@/components/LoadingScreen';
import ChatInterface from '@/components/ChatInterface';
import axios from 'axios';

// Application states
type AppState =
  | 'initial'          // Landing page with emergency button
  | 'listening'        // Listening for voice command
  | 'processing'       // Processing voice command
  | 'chat'             // Chat interface with chatbase
  | 'completed';       // Assistance completed

const Index = () => {
  const [appState, setAppState] = useState<AppState>('initial');
  const [processingMessage, setProcessingMessage] = useState("Procesando su solicitud...");

  // Handle emergency button click
  const handleEmergencyClick = () => {
    setAppState('listening');
  };

  // Handle voice command recognition
  const handleVoiceRecognized = async (activated: boolean) => {
    setAppState('processing');
    setProcessingMessage("Verificando su solicitud...");

    if (activated) {
      //await axios.post("http://127.0.0.1:8084/api/autorescue/needHelp", { serialNumber: "1HGCM82633A123456" })
      setAppState('completed');
    } else {
      //await axios.post("http://127.0.0.1:8084/api/autorescue/deviceStatus", { serialNumber: "1HGCM82633A123456" })
      setAppState('chat');
    }
  };

  // Render different UI based on app state
  const renderStateUI = () => {
    switch (appState) {
      case 'initial':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <Card className="w-full max-w-md p-8 glass text-center space-y-6">
              <h1 className="text-3xl font-bold">AutoRescue</h1>
              <p className="text-muted-foreground">
                Car accident simulator
              </p>

              <div className="py-6">
                <div className="pulse-effect mx-auto">
                  <Button
                    onClick={handleEmergencyClick}
                    size="lg"
                    className="rounded-full h-24 w-24 text-xl font-bold"
                  >
                    SOS
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Press the button to simulate a car accident
              </p>
            </Card>
          </div>
        );

      case 'listening':
        return (
          <div className="h-full flex flex-col items-center justify-center">
            <Card className="w-full max-w-md p-8 glass text-center">
              <VoiceRecognition
                onRecognized={handleVoiceRecognized}
                isListening={true}
              />
            </Card>
          </div>
        );

      case 'processing':
        return <LoadingScreen message={processingMessage} />;

      case 'chat':
        return (
          <div className="h-full flex items-center justify-center">
            <Card className="w-full max-w-xl h-[85vh] glass overflow-hidden">
              <ChatInterface setAppState={setAppState} />
            </Card>
          </div>
        );

      case 'completed':
        return (
          <div className="h-full flex flex-col items-center justify-center">
            <Card className="w-full max-w-md p-8 glass text-center space-y-6 animate-scale-in">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Shield size={32} className="text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Assistance Completed</h2>
              <p className="text-muted-foreground">
                Thanks for using AutoRescue. Your information has been processed successfully.
              </p>
            </Card>
          </div>
        );

      default:
        return <div>State not recognized</div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/30">
      <header className="p-4 flex items-center justify-between glass border-b border-border/50">
        <div className="flex items-center gap-2">
          <ShieldAlert size={24} className="text-primary" />
          <h1 className="text-xl font-bold">AutoRescue</h1>
        </div>

        <div className="flex items-center gap-2">
          {appState !== 'initial' && appState !== 'completed' && (
            <div className="flex items-center text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse mr-1"></div>
              Assistente active
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 container max-w-5xl py-8">
        {renderStateUI()}
      </main>

      <footer className="p-4 text-center text-sm text-muted-foreground border-t border-border/50">
        <p>© 2025 AutoRescue · Your Accident Report Assistant</p>
      </footer>
    </div>
  );
};

export default Index;
