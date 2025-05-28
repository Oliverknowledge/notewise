import Vapi from '@vapi-ai/web';

const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY || '';

interface AssistantOptions {
  name: string;
  prompt: string;
  voice: {
    provider: string;
    voiceId: string;
    speed: number;
  };
}

type StudyMode = 'question' | 'explanation' | 'summary' | 'practice';

export class VapiService {
  private vapi: Vapi | null = null;
  private isInitialized: boolean = false;
  private currentMode: StudyMode = 'explanation';
  private isMuted: boolean = false;
  private currentSession: any = null;
  private callbacks: {
    onMessage?: (message: { content: string }) => void;
    onSpeechStart?: () => void;
    onSpeechEnd?: () => void;
    onError?: (error: any) => void;
    onCallEnd?: () => void;
  } = {};

  constructor() {
    this.initialize();
  }

  private async initialize() {
    const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
    if (!apiKey) {
      console.error('Vapi API key is missing. Please add NEXT_PUBLIC_VAPI_API_KEY to your .env.local file.');
      if (this.callbacks.onError) this.callbacks.onError(new Error('Vapi API key missing'));
      return;
    }

    try {
      this.vapi = new Vapi(apiKey);
      this.isInitialized = true;

      this.vapi.on('call-end', () => {
        console.log('Vapi call ended');
        if (this.callbacks.onCallEnd) this.callbacks.onCallEnd();
        if (this.currentSession) {
          this.handleDisconnection();
        }
      });

      this.vapi.on('error', (error: any) => {
        console.error('Vapi error event:', error);
        if (this.callbacks.onError) this.callbacks.onError(error);
        if (error?.message?.includes('Meeting has ended') || error?.message?.includes('Meeting ended due to ejection')) {
          console.log('Meeting was ejected, attempting to reconnect...');
          this.handleMeetingEjection();
        } else if (this.currentSession) {
          this.handleDisconnection();
        }
      });
      
      this.vapi.on('message', (message: any) => { 
        console.log('Vapi.on(\'message\') triggered.');
        console.log('Raw Vapi message object:', message);

        try {
          if (message?.data) {
            const parsedData = JSON.parse(message.data);
            console.log('Parsed message data:', parsedData);

            if (parsedData?.type === 'transcript' && parsedData?.transcript) {
              console.log('Transcript content found. Calling onMessage callback.');
              if (this.callbacks.onMessage) this.callbacks.onMessage({ content: parsedData.transcript });
            } else {
              console.warn('Parsed data is not a valid transcript message or has no content:', parsedData);
            }
          } else {
             console.warn('Received Vapi message with no data property:', message);
          }
        } catch (e) {
           console.error('Error parsing Vapi message data:', e, message);
        }
      });

      this.vapi.on('speech-start', () => {
        console.log('Speech started');
        if (this.callbacks.onSpeechStart) this.callbacks.onSpeechStart();
      });

      this.vapi.on('speech-end', () => {
        console.log('Speech ended');
        if (this.callbacks.onSpeechEnd) this.callbacks.onSpeechEnd();
      });

      if (typeof window !== 'undefined') {
         window.addEventListener('message', (event) => {
            if (event.data.type === 'toggle-mute' && this.vapi) {
               this.toggleMute();
             }
           });
         }

    } catch (error) {
      console.error('Error initializing Vapi:', error);
      this.isInitialized = false;
      if (this.callbacks.onError) this.callbacks.onError(error);
    }
  }

  public setCallbacks(callbacks: {
    onMessage?: (message: { content: string }) => void;
    onSpeechStart?: () => void;
    onSpeechEnd?: () => void;
    onError?: (error: any) => void;
    onCallEnd?: () => void;
  }) {
    this.callbacks = callbacks;
    console.log('VapiService callbacks set:', this.callbacks);
  }

  private async handleDisconnection() {
    console.log('Handling disconnection...');
    try {
      await this.endSession();
    } catch (error) {
      console.error('Error handling disconnection:', error);
      if (this.callbacks.onError) this.callbacks.onError(error);
    }
  }

  private async handleMeetingEjection() {
    console.log('Handling meeting ejection...');
    try {
      await this.endSession();
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (this.currentSession) {
        console.log('Attempting to reconnect...');
        this.currentSession = null;
      }
    } catch (error) {
      console.error('Error handling meeting ejection:', error);
      if (this.callbacks.onError) this.callbacks.onError(error);
      this.currentSession = null;
    }
  }

  public setStudyMode(mode: StudyMode): void {
    this.currentMode = mode;
  }

  private getModeSpecificPrompt(notes: string): string {
    const basePrompt = `You are a friendly and knowledgeable tutor. Your goal is to help the student understand their study materials.
    
    The student has provided the following notes:
    ${notes}
    
    CRITICAL FORMATTING RULES:
    1. NEVER use mathematical symbols or notation. Always use plain English:
       - Say "fraction" instead of "frac"
       - Say "square root" instead of "sqrt"
       - Say "squared" instead of "^2" or "to the power of two"
       - Say "divided by" instead of "/"
       - Say "multiplied by" instead of "×"
       - Say "equals" instead of "="
       - Say "plus" instead of "+"
       - Say "minus" instead of "-"
       - Say "number sign" or "pound sign" instead of "hash" or "#"
    2. Keep responses concise and to the point
    3. Speak slowly and clearly
    4. Use simple, everyday language
    5. NEVER use special characters or symbols
    6. NEVER use programming notation or technical symbols
    
  
    
    The system will automatically extract these and display them in a separate notes section.
    
    Remember:
    - Always use complete words, never abbreviations
    - Never use symbols or special characters
    - Say "number sign" or "pound sign" instead of "hash" or "#"
    - Keep explanations simple and clear
    - Use everyday language that's easy to understand when spoken aloud
    - If you need to refer to the # symbol, say "number sign" or "pound sign"`;

    switch (this.currentMode) {
      case 'question':
        return `${basePrompt}
        
        You are in question mode. Your role is to:
        - Ask ONE question at a time
        - Keep questions short and focused
        - Wait for the student's response before asking another question
        - If the student answers correctly, acknowledge it and ask a follow-up question
        - If the student struggles, provide a brief hint and then ask the same question again
        - Keep questions focused on understanding the material
        - Use questions to guide the student's learning
        - Never ask multiple questions at once
        - Always format your questions using [QUESTION] tags so they appear in the notes section
        - Never use symbols or special characters in your questions
        - If you need to refer to the # symbol, say "number sign" or "pound sign"`;
      
      case 'explanation':
        return `${basePrompt}
        
        You are in explanation mode. Your role is to:
        - Explain concepts clearly and thoroughly but concisely
        - Use simple examples and analogies
        - Break down complex ideas into simpler parts
        - Keep explanations brief and to the point
        - Encourage questions and discussion
        - Provide real-world applications when relevant
        - Use [KEY_POINT] tags to highlight important concepts
        - Use [QUESTION] tags to check understanding
        - Never use symbols or special characters in your explanations
        - If you need to refer to the # symbol, say "number sign" or "pound sign"`;
      
      case 'summary':
        return `${basePrompt}
        
        You are in summary mode. Your role is to:
        - Provide concise summaries of key concepts
        - Highlight main points and important details
        - Create connections between different topics
        - Help the student organize their understanding
        - Focus on the most important information
        - Keep summaries brief and clear
        - Use [KEY_POINT] tags for main takeaways
        - Use [QUESTION] tags to reinforce learning
        - Never use symbols or special characters in your summaries
        - If you need to refer to the # symbol, say "number sign" or "pound sign"`;
      
      case 'practice':
        return `${basePrompt}
        
        You are in practice mode. Your role is to:
        - Create simple practice scenarios and problems
        - Guide the student through solving problems
        - Provide clear, concise feedback
        - Help them develop problem-solving strategies
        - Build their confidence through practice
        - Keep explanations brief and focused
        - Use [KEY_POINT] tags for important steps or concepts
        - Use [QUESTION] tags for practice problems
        - Never use symbols or special characters in your practice problems
        - If you need to refer to the # symbol, say "number sign" or "pound sign"`;
      
      default:
        return basePrompt;
    }
  }

  public async startTutoringSession(notes: string): Promise<void> {
    if (!this.isInitialized || !this.vapi) {
      const initError = new Error('Vapi service is not initialized. Please check your API key in .env.local');
      if (this.callbacks.onError) this.callbacks.onError(initError);
      throw initError;
    }

    if (this.currentSession) {
      await this.endSession();
    }

    try {
      console.log('Starting tutoring session with notes:', notes);

      try {
        console.log('Attempting to start session with audio...', {
          name: 'Tutor',
          model: {
            provider: 'openai',
            model: 'gpt-4'
          },
          voice: {
            provider: '11labs',
            voiceId: '21m00Tcm4TlvDq8ikWAM',
            speed: 0.8
          }
        });

        const assistant = await this.vapi.start({
          name: 'Tutor',
          model: {
            provider: 'openai',
            model: 'gpt-4'
          },
          voice: {
            provider: '11labs',
            voiceId: '21m00Tcm4TlvDq8ikWAM',
            speed: 0.8
          }
        });

        if (!assistant) {
          console.error('Vapi.start returned null or undefined for audio attempt.');
          const audioErr = new Error('Failed to create assistant (audio)');
          if (this.callbacks.onError) this.callbacks.onError(audioErr);
          throw audioErr;
        }

        console.log('Successfully started session with audio', assistant);
        this.currentSession = assistant;
      } catch (audioError: any) {
        console.warn('Audio initialization failed, falling back to text-only mode:', audioError);
        if (this.callbacks.onError) this.callbacks.onError(audioError);

        console.log('Attempting to start session in text-only mode...', {
          name: 'Tutor',
          model: {
            provider: 'openai',
            model: 'gpt-4'
          }
        });
        const assistant = await this.vapi.start({
          name: 'Tutor',
          model: {
            provider: 'openai',
            model: 'gpt-4'
          }
        });

        if (!assistant) {
           console.error('Vapi.start returned null or undefined for text-only attempt.');
           const textErr = new Error('Failed to create assistant (text-only)');
            if (this.callbacks.onError) this.callbacks.onError(textErr);
           throw textErr;
        }

        console.log('Successfully started session in text-only mode', assistant);
        this.currentSession = assistant;
      }

      console.log('Sending initial message with notes...');
      this.sendTextMessage(`Please help me understand these notes: ${notes}`);

    } catch (error) {
      console.error('Failed to start tutoring session:', error);
      console.error('Detailed Vapi start error:', JSON.stringify(error, null, 2));
      if (this.callbacks.onError) this.callbacks.onError(error);
      throw new Error(error instanceof Error ? error.message : 'Failed to start tutoring session');
    }
  }

  public async endSession(): Promise<void> {
    if (this.currentSession) {
      if (typeof this.currentSession.end === 'function') {
        await this.currentSession.end();
      } else {
        console.warn('currentSession.end is not a function. currentSession:', this.currentSession);
      }
      this.currentSession = null;
    }
  }

  public sendTextMessage(content: string): void {
    if (this.vapi && this.currentSession) {
      console.log('Sending text message to Vapi:', content);
      this.vapi.send({
        type: 'add-message',
        message: {
          role: 'user',
          content: content
        }
      });
    } else {
      console.warn('Vapi or current session not available to send message.');
    }
  }

  public toggleMute(): void {
    if (this.currentSession) {
      this.isMuted = !this.isMuted;
      if (typeof this.currentSession.setMuted === 'function') {
         this.currentSession.setMuted(this.isMuted);
      } else {
         console.warn('currentSession.setMuted is not a function.', this.currentSession);
      }
    }
  }

  async cleanup() {
    if (this.currentSession) {
      await this.endSession();
    }
  }
}

export const vapiService = new VapiService(); 