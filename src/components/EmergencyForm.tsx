
import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Camera, Upload, Check, X, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

interface EmergencyFormProps {
  onSubmit: (formData: FormData) => void;
}

interface FormData {
  licensePlate: string;
  idNumber: string;
  images: string[];
  description: string;
}

const EmergencyForm: React.FC<EmergencyFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<FormData>({
    licensePlate: '',
    idNumber: '',
    images: [],
    description: ''
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newImages: string[] = [...formData.images];
    
    Array.from(files).forEach(file => {
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        toast.error("Por favor, suba solo archivos de imagen");
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`La imagen ${file.name} es demasiado grande. El tamaño máximo es 5MB`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        newImages.push(imageData);
        setFormData(prev => ({ ...prev, images: newImages }));
      };
      reader.readAsDataURL(file);
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Clear error if any
    if (errors.images) {
      setErrors(prev => ({ ...prev, images: undefined }));
    }
  };
  
  const removeImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData(prev => ({ ...prev, images: newImages }));
  };
  
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    // Validate license plate - Spanish format (1234 ABC)
    if (!formData.licensePlate) {
      newErrors.licensePlate = 'La matrícula es obligatoria';
    } else if (!/^[0-9]{4}[- ]?[A-Z]{3}$/.test(formData.licensePlate.toUpperCase())) {
      newErrors.licensePlate = 'Formato inválido. Debe ser como 1234 ABC';
    }
    
    // Validate ID number - Spanish DNI/NIE format
    if (!formData.idNumber) {
      newErrors.idNumber = 'El número de DNI/NIE es obligatorio';
    } else if (!/^[0-9XYZ][0-9]{7}[A-Z]$/.test(formData.idNumber.toUpperCase())) {
      newErrors.idNumber = 'Formato inválido. Debe ser como 12345678A o X1234567A';
    }
    
    // Validate that at least one image is uploaded
    if (formData.images.length === 0) {
      newErrors.images = 'Añada al menos una foto del accidente';
    }
    
    // Validate description
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'La descripción es demasiado corta';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Por favor, corrija los errores en el formulario");
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      onSubmit(formData);
      toast.success("Formulario enviado correctamente");
      setIsSubmitting(false);
    }, 1500);
  };
  
  const takePicture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };
  
  const uploadPicture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };
  
  return (
    <Card className="w-full max-w-lg mx-auto animate-scale-in overflow-hidden">
      <div className="p-4 bg-primary text-primary-foreground">
        <h2 className="text-xl font-semibold">Formulario de Emergencia</h2>
        <p className="text-sm opacity-90">
          Por favor, complete los siguientes datos para recibir asistencia
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="licensePlate">
            Matrícula del vehículo <span className="text-destructive">*</span>
          </Label>
          <Input
            id="licensePlate"
            name="licensePlate"
            value={formData.licensePlate}
            onChange={handleInputChange}
            placeholder="Ej: 1234 ABC"
            className={errors.licensePlate ? "border-destructive" : ""}
          />
          {errors.licensePlate && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle size={12} /> {errors.licensePlate}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            <Info size={12} className="inline mr-1" />
            Formato: 4 números seguidos de 3 letras
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="idNumber">
            DNI/NIE <span className="text-destructive">*</span>
          </Label>
          <Input
            id="idNumber"
            name="idNumber"
            value={formData.idNumber}
            onChange={handleInputChange}
            placeholder="Ej: 12345678A"
            className={errors.idNumber ? "border-destructive" : ""}
          />
          {errors.idNumber && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle size={12} /> {errors.idNumber}
            </p>
          )}
        </div>
        
        <div className="space-y-3">
          <Label>
            Fotos del accidente <span className="text-destructive">*</span>
          </Label>
          
          <div className="flex gap-2">
            <Button 
              type="button"
              variant="outline"
              onClick={takePicture}
              className="flex-1"
            >
              <Camera size={18} className="mr-2" /> Tomar foto
            </Button>
            
            <Button 
              type="button"
              variant="outline"
              onClick={uploadPicture}
              className="flex-1"
            >
              <Upload size={18} className="mr-2" /> Subir imagen
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
          
          {errors.images && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle size={12} /> {errors.images}
            </p>
          )}
          
          {formData.images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {formData.images.map((image, index) => (
                <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-muted">
                  <img
                    src={image}
                    alt={`Accidente ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-destructive/90 text-white rounded-full p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">
            Descripción del accidente <span className="text-destructive">*</span>
          </Label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            placeholder="Describa brevemente cómo ocurrió el accidente..."
            className={`w-full min-h-[100px] px-3 py-2 text-sm rounded-md border bg-background ${
              errors.description ? "border-destructive" : "border-input"
            }`}
          />
          {errors.description && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle size={12} /> {errors.description}
            </p>
          )}
        </div>
        
        <Separator />
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                Enviando...
              </>
            ) : (
              <>
                <Check size={18} className="mr-2" /> Enviar información
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default EmergencyForm;
