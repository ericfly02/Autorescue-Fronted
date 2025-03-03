import axios from 'axios';

interface ChatMessage {
  content: string;
  role: 'user' | 'assistant';
}

interface ChatbaseStreamResponse {
  onMessage: (callback: (message: string) => void) => void;
  onComplete: (callback: () => void) => void;
  onError: (callback: (error: Error) => void) => void;
}

class ChatbaseService {
  private apiKey: string;
  private chatbotId: string;
  private apiUrl = 'https://www.chatbase.co/api/v1/chat';

  constructor(apiKey: string, chatbotId: string) {
    this.apiKey = apiKey;
    this.chatbotId = chatbotId;
  }

  async streamChatMessage(messages: ChatMessage[]): Promise<ChatbaseStreamResponse> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          messages,
          chatbotId: this.chatbotId,
          stream: true,
          temperature: 0,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
        }
      );

      let messageCallbacks: ((message: string) => void)[] = [];
      let completeCallbacks: (() => void)[] = [];
      let errorCallbacks: ((error: Error) => void)[] = [];
      debugger
      const reader = response.data;
      
      const decoder = new TextDecoder();
      
      reader.on('data', (chunk: Uint8Array) => {
        const chunkValue = decoder.decode(chunk);
        messageCallbacks.forEach(callback => callback(chunkValue));
      });

      reader.on('end', () => {
        completeCallbacks.forEach(callback => callback());
      });

      reader.on('error', (err: Error) => {
        errorCallbacks.forEach(callback => callback(err));
      });

      return {
        onMessage: (callback: (message: string) => void) => {
          messageCallbacks.push(callback);
        },
        onComplete: (callback: () => void) => {
          completeCallbacks.push(callback);
        },
        onError: (callback: (error: Error) => void) => {
          errorCallbacks.push(callback);
        }
      };
    } catch (error: any) {
      console.error('Error in Chatbase service:', error.message);
      throw error;
    }
  }
}

export default ChatbaseService;