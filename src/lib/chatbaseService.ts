
/**
 * Service to interact with the Chatbase API
 * @see https://www.chatbase.co/docs/developer-guides/api/streaming-messages
 */

// For demo purposes, we're simulating the Chatbase integration
// In a real implementation, you would make actual API calls to Chatbase

const CHATBASE_API_URL = "https://www.chatbase.co/api/v1/chat";
const CHATBASE_STREAMING_API_URL = "https://www.chatbase.co/api/v1/stream-chat";

// This would be your actual Chatbase API key in a production environment
// Should be stored in environment variables or fetched securely
const CHATBASE_API_KEY = "demo-api-key";

/**
 * Initializes a new conversation with Chatbase
 * @returns Promise that resolves to a session ID
 */
export const initChatbaseConversation = async (): Promise<string> => {
  // For demo purposes, generate a random session ID
  const sessionId = `session-${Math.random().toString(36).substring(2, 10)}`;
  
  // In a real implementation, you might initialize the session with Chatbase
  console.log("Initialized Chatbase session:", sessionId);
  
  return Promise.resolve(sessionId);
};

/**
 * Sends a message to the Chatbase conversation
 * @param sessionId The session ID for the conversation
 * @param message The message text to send
 * @returns Promise that resolves to the assistant's response
 */
export const sendChatbaseMessage = async (
  sessionId: string, 
  message: string
): Promise<string> => {
  // For demo purposes, log the outgoing message
  console.log(`Sending message to Chatbase (${sessionId}):`, message);
  
  // In a real implementation, you would make an API call to Chatbase
  // For the demo, simulate some common responses based on keywords
  
  // Add a slight delay to simulate network latency
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (message.toLowerCase().includes("ayuda") || message.toLowerCase().includes("help")) {
    return "Estoy aquí para ayudarte con tu accidente. ¿Puedes decirme qué ha ocurrido y si hay heridos?";
  }
  
  if (message.toLowerCase().includes("herido") || message.toLowerCase().includes("injured")) {
    return "Es importante atender a los heridos. ¿Has llamado ya a emergencias? Si hay heridos graves, es fundamental no moverlos a menos que estén en peligro inminente.";
  }
  
  if (message.toLowerCase().includes("seguro") || message.toLowerCase().includes("insurance")) {
    return "Necesitarás reportar el accidente a tu compañía de seguros. Te recomiendo tomar fotos de los daños, intercambiar información con el otro conductor, y contactar a tu aseguradora lo antes posible.";
  }
  
  if (message.toLowerCase().includes("foto") || message.toLowerCase().includes("photo") || message.toLowerCase().includes("imagen") || message.toLowerCase().includes("image")) {
    return "Las fotos son muy importantes para documentar el accidente. Asegúrate de fotografiar: los daños en ambos vehículos, la posición de los coches, las matrículas, las marcas en la carretera, y cualquier señal de tráfico relevante.";
  }
  
  if (message.toLowerCase().includes("parte") || message.toLowerCase().includes("accident report")) {
    return "Para el parte amistoso, necesitarás: los datos personales de ambos conductores, información de los vehículos (marca, modelo, matrícula), datos de las pólizas de seguro, una descripción del accidente, un esquema o dibujo del mismo, y la firma de ambos conductores.";
  }
  
  // Default response for other messages
  const genericResponses = [
    "Entiendo la situación. ¿Podrías proporcionarme más detalles para ayudarte mejor?",
    "Gracias por la información. ¿Hay algo más que necesites saber sobre cómo proceder?",
    "Estoy procesando tu reporte del accidente. ¿Necesitas ayuda con algo específico?",
    "Comprendo. Para asistirte mejor, ¿podrías contarme más sobre las circunstancias del accidente?",
    "Estoy aquí para ayudarte a través de este proceso. ¿Qué más necesitas saber?"
  ];
  
  const randomIndex = Math.floor(Math.random() * genericResponses.length);
  return genericResponses[randomIndex];
};

/**
 * Sends an image to the Chatbase conversation
 * Note: This is a placeholder for the actual implementation
 * @param sessionId The session ID for the conversation
 * @param imageData The base64 encoded image data
 * @returns Promise that resolves to the assistant's response
 */
export const sendChatbaseImage = async (
  sessionId: string, 
  imageData: string
): Promise<string> => {
  // For demo purposes, log that an image was sent
  console.log(`Sending image to Chatbase (${sessionId})`);
  
  // In a real implementation, you would upload the image and send it to Chatbase
  // For the demo, return a generic response about receiving the image
  
  // Add a slight delay to simulate network latency
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return "He recibido tu imagen. ¿Puedes proporcionarme más información sobre lo que muestra?";
};
