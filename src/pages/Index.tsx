
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Bell, Shield, ShieldAlert, PhoneCall, WifiOff, Wifi } from 'lucide-react';
import VoiceRecognition from '@/components/VoiceRecognition';
import LoadingScreen from '@/components/LoadingScreen';
import ChatInterface from '@/components/ChatInterface';
import EmergencyForm from '@/components/EmergencyForm';
import { 
  validateVoiceCommand, 
  checkDeviceCoverage, 
  validateSIM, 
  initiateEmergencyCall 
} from '@/services/apiService';

// Application states
type AppState = 
  | 'initial'          // Landing page with emergency button
  | 'listening'        // Listening for voice command
  | 'processing'       // Processing voice command
  | 'chat'             // Chat interface with chatbase
  | 'checking-coverage' // Checking device coverage
  | 'emergency-call'   // Making emergency call
  | 'emergency-form'   // Form for collecting information
  | 'completed';       // Assistance completed

const Index = () => {
  const [appState, setAppState] = useState<AppState>('initial');
  const [processingMessage, setProcessingMessage] = useState("Procesando su solicitud...");
  
  // Handle emergency button click
  const handleEmergencyClick = () => {
    setAppState('listening');
    toast.info("Diga 'autorescue ayuda' para activar la asistencia de emergencia", {
      duration: 5000,
    });
  };
  
  // Handle voice command recognition
  const handleVoiceRecognized = async () => {
    setAppState('processing');
    setProcessingMessage("Verificando su solicitud...");
    
    try {
      const isValidCommand = await validateVoiceCommand();
      
      if (isValidCommand) {
        toast.success("Comando reconocido. Iniciando asistencia.", {
          duration: 3000,
        });
        setAppState('chat');
      } else {
        toast.error("No se pudo validar su solicitud. Iniciando protocolo alternativo.", {
          duration: 3000,
        });
        handleChatTimeout();
      }
    } catch (error) {
      console.error("Error validating voice command:", error);
      toast.error("Error al procesar su solicitud. Iniciando protocolo alternativo.", {
        duration: 3000,
      });
      handleChatTimeout();
    }
  };
  
  // Handle chat timeout or failure
  const handleChatTimeout = async () => {
    setAppState('checking-coverage');
    setProcessingMessage("Verificando cobertura del dispositivo...");
    
    try {
      const hasCoverage = await checkDeviceCoverage();
      
      if (hasCoverage) {
        // Device has coverage, check SIM
        toast.success("Cobertura disponible", {
          duration: 2000,
        });
        
        setProcessingMessage("Verificando SIM...");
        const isValidSIM = await validateSIM();
        
        if (isValidSIM) {
          // SIM is valid, initiate emergency call
          toast.success("SIM válida. Iniciando llamada de emergencia...", {
            duration: 3000,
          });
          setAppState('emergency-call');
        } else {
          // SIM validation failed, show form
          toast.error("No se pudo validar la SIM. Mostrando formulario de emergencia.", {
            duration: 3000,
          });
          setAppState('emergency-form');
        }
      } else {
        // No coverage, show form
        toast.error("No hay cobertura disponible. Mostrando formulario de emergencia.", {
          duration: 3000,
        });
        setAppState('emergency-form');
      }
    } catch (error) {
      console.error("Error checking device coverage:", error);
      toast.error("Error al verificar la cobertura. Mostrando formulario de emergencia.", {
        duration: 3000,
      });
      setAppState('emergency-form');
    }
  };
  
  // Handle emergency call
  useEffect(() => {
    if (appState === 'emergency-call') {
      const makeCall = async () => {
        try {
          await initiateEmergencyCall();
          // After call is initiated or simulated, update state
          setTimeout(() => {
            setAppState('completed');
            toast.success("Llamada de emergencia iniciada. Asistencia en camino.", {
              duration: 5000,
            });
          }, 2000);
        } catch (error) {
          console.error("Error making emergency call:", error);
          toast.error("Error al realizar la llamada. Mostrando formulario de emergencia.", {
            duration: 3000,
          });
          setAppState('emergency-form');
        }
      };
      
      makeCall();
    }
  }, [appState]);
  
  // Handle form submission
  const handleFormSubmit = (formData: any) => {
    console.log("Form submitted:", formData);
    setAppState('completed');
    toast.success("Información recibida. Un agente se pondrá en contacto con usted.", {
      duration: 5000,
    });
  };
  
  // Reset app
  const handleReset = () => {
    setAppState('initial');
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
                Asistencia inmediata para accidentes de tráfico
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
                Pulse el botón y diga "autorescue ayuda" para iniciar la asistencia de emergencia
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
              <ChatInterface onTimeout={handleChatTimeout} />
            </Card>
          </div>
        );
        
      case 'checking-coverage':
        return <LoadingScreen message={processingMessage} />;
        
      case 'emergency-call':
        return (
          <div className="h-full flex flex-col items-center justify-center">
            <Card className="w-full max-w-md p-8 glass text-center space-y-6 animate-pulse">
              <PhoneCall size={64} className="mx-auto text-primary" />
              <h2 className="text-2xl font-bold">Iniciando llamada de emergencia</h2>
              <p className="text-muted-foreground">
                Conectando con el servicio de emergencias...
              </p>
            </Card>
          </div>
        );
        
      case 'emergency-form':
        return (
          <div className="h-full flex items-center justify-center p-4">
            <EmergencyForm onSubmit={handleFormSubmit} />
          </div>
        );
        
      case 'completed':
        return (
          <div className="h-full flex flex-col items-center justify-center">
            <Card className="w-full max-w-md p-8 glass text-center space-y-6 animate-scale-in">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Shield size={32} className="text-primary" />
              </div>
              
              <h2 className="text-2xl font-bold">Asistencia Completada</h2>
              <p className="text-muted-foreground">
                Gracias por utilizar AutoRescue. Su información ha sido procesada correctamente.
              </p>
              
              <Button onClick={handleReset} variant="outline">
                Volver al inicio
              </Button>
            </Card>
          </div>
        );
        
      default:
        return <div>Estado no reconocido</div>;
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
              Asistencia activa
            </div>
          )}
        </div>
      </header>
      
      <main className="flex-1 container max-w-5xl py-8">
        {renderStateUI()}
      </main>
      
      <footer className="p-4 text-center text-sm text-muted-foreground border-t border-border/50">
        <p>© 2023 AutoRescue · Asistencia en accidentes de tráfico</p>
      </footer>
    </div>
  );
};

export default Index;
