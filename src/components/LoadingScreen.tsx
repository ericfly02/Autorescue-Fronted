
import React from 'react';
import { Loader } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Procesando su solicitud..." 
}) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm z-50 animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse"></div>
        <Loader size={64} className="text-primary animate-spin" />
      </div>
      
      <div className="mt-8 text-center max-w-md">
        <p className="text-xl font-medium mb-2">{message}</p>
        <div className="h-1 w-48 mx-auto bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-pulse" style={{width: '60%'}}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
