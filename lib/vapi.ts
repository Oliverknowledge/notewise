import Vapi from '@vapi-ai/web';

// Add type extension for Vapi
declare module '@vapi-ai/web' {
  interface Vapi {
    setPaused(paused: boolean): void;
  }
}

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
  private isPaused: boolean = false;
  private currentSession: any = null;
  private keepAliveInterval: NodeJS.Timeout | null = null;
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

  private initialize() {
    if (typeof window === 'undefined') return;

    try {
      this.vapi = new Vapi(VAPI_API_KEY);

      this.vapi.on('speech-start', () => {
        if (this.callbacks.onSpeechStart) this.callbacks.onSpeechStart();
      });

      this.vapi.on('speech-end', () => {
        if (this.callbacks.onSpeechEnd) this.callbacks.onSpeechEnd();
      });

      this.vapi.on('message', (message: { content: string }) => {
        if (this.callbacks.onMessage) this.callbacks.onMessage(message);
      });

      this.vapi.on('call-end', () => {
        this.stopKeepAlive();
        if (this.callbacks.onCallEnd) this.callbacks.onCallEnd();
           });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize VapiService:', error);
      this.isInitialized = false;
    }
  }

  private startKeepAlive() {
    // Clear any existing keepAlive interval
    this.stopKeepAlive();
    
    // Send a minimal message every 30 seconds to keep the connection alive
    this.keepAliveInterval = setInterval(() => {
      if (this.vapi && !this.isPaused) {
        this.vapi.send({
          type: 'add-message',
          message: {
            role: 'system',
            content: ' '  // Empty space to prevent speech
          }
        });
      }
    }, 30000); // 30 seconds
  }

  private stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
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
  }

  private async handleDisconnection() {
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

  public async startTutoringSession(notes: string, mode: string, title: string, bedtimeMode: boolean): Promise<void> {
    // Ensure Vapi is initialized (will re-initialize if nulled out from previous endSession)
    if (!this.isInitialized || !this.vapi) {
      this.initialize();
      if (!this.isInitialized || !this.vapi) {
        const initError = new Error('Vapi service could not be initialized. Please check your API key in .env.local');
        if (this.callbacks.onError) this.callbacks.onError(initError);
        throw initError;
      }
    }

    if (this.currentSession) {
      await this.endSession();
    }

    try {
      try {
        if (mode === "explain") {
          await this.vapi.start({
            name: 'Tutor',
            model: {
              provider: 'openai',
              model: 'gpt-4',
              messages: [{
                role: "system",
                content: `You are an expert tutor specializing in ${title}. Your goal is to help students understand complex topics through clear, engaging explanations.

Key behaviors:
1. Break down complex concepts into digestible parts
2. Use analogies and real-world examples to illustrate points
3. Check for understanding by asking brief comprehension questions
4. Adapt your explanation pace based on student responses
5. Provide visual descriptions when explaining spatial or complex concepts
6. Connect new information to previously learned concepts

Current topic: ${notes}

When listing, say first, second and third, not hash hash hash 1.

Guidelines:
- Keep explanations easy to understand and quite short.
- Use simple language while maintaining accuracy
- Encourage questions and interaction
- Provide practical applications of the concepts
- Summarize key points periodically
- Use the Socratic method to guide understanding
- Acknowledge and build upon student responses

Remember to:
- Start with an overview of the topic
- Explain one concept at a time
- Use examples to reinforce understanding
- Check comprehension regularly
- End with a summary of key points`
              }]
            },
            voice: {
              provider: '11labs',
              voiceId: '21m00Tcm4TlvDq8ikWAM',
              speed: bedtimeMode ? 0.6 : 0.8
            },
            firstMessage: `Hi! I'm your tutor for ${title}. I'll help you understand this topic thoroughly. Let's start with an overview - what aspects would you like to focus on first?`
          });
        } else if (mode === "quiz") {
              await this.vapi.start({
            name: 'Tutor',
            model: {
              provider: 'openai',
              model: 'gpt-4',
              messages: [{
                role: "system",
                content: `You are an expert tutor specializing in ${title}, focusing on interactive learning through progressive questioning.
Key behaviors:
1. Start with basic comprehension questions
2. Gradually increase difficulty based on student responses
3. Provide constructive feedback on answers
4. Use hints when students struggle
5. Connect questions to real-world applications
6. Encourage critical thinking and problem-solving
7. Maintain a supportive and encouraging tone

When listing, say first, second and third, not ###1. 

Current topic: ${notes}

Question progression strategy:
1. Begin with foundational knowledge questions
2. Move to application questions
3. Progress to analysis and evaluation
4. Challenge with synthesis and creation questions
5. Include problem-solving scenarios

Guidelines:
- Ask one question at a time
- Provide immediate feedback
- Use hints before giving answers
- Connect questions to previous answers
- Vary question types (multiple choice, open-ended, scenario-based)
- Include practical examples
- Encourage explanation of reasoning

Remember to:
- Start with easier questions to build confidence
- Increase difficulty gradually
- Provide positive reinforcement
- Use mistakes as learning opportunities
- End with a review of key concepts`
              }]
            },
            voice: {
              provider: '11labs',
              voiceId: '21m00Tcm4TlvDq8ikWAM',
              speed: bedtimeMode ? 0.6 : 0.8
            },
            firstMessage: `Hi! I'm your tutor for ${title}. I'll help you master this topic through practice questions. Let's start with some basic questions to check your understanding. Ready?`
          });
        } else if (mode === "feynman") {
          await this.vapi.start({
            name: 'Tutor',
            model: {
              provider: 'openai',
              model: 'gpt-4',
              messages: [{
                role: "system",
                content: `You are an expert tutor implementing the Feynman Technique for ${title}. Your role is to act as a complete beginner who needs to learn the topic from scratch.

                Key behaviors:
1. Ask the student to explain concepts as if teaching a complete beginner
2. Identify gaps in understanding through targeted questions
3. Request clarification when explanations become too complex
4. Encourage the use of simple language and analogies
5. Help identify areas where the student's understanding is unclear
6. Guide the student to break down complex ideas into simpler parts

Current topic: ${notes}

Feynman Technique implementation:
1. Ask the student to explain the concept in simple terms
2. Identify knowledge gaps through questioning
3. Guide the student to simplify and clarify their explanation
4. Help them identify and fill in missing pieces
5. Encourage the use of analogies and examples
6. Review and refine the explanation

Guidelines:
- Act as a curious beginner
- Ask "why" and "how" questions
- Request clarification when explanations are unclear
- Encourage the use of simple language
- Help identify assumptions and gaps
- Guide the student to improve their understanding`
              }]
            },
            voice: {
              provider: '11labs',
              voiceId: '21m00Tcm4TlvDq8ikWAM',
              speed: bedtimeMode ? 0.6 : 0.8
            },
            firstMessage: `Hi! I'm a complete beginner trying to learn about ${title}. Could you explain this topic to me in simple terms? I know nothing about it, so please start from the very basics.`
          });
        }
        this.startKeepAlive(); // Start keep-alive when session starts
      } catch (audioError) {
        console.warn('Audio initialization failed, falling back to text-only mode:', audioError);
        if (this.callbacks.onError) this.callbacks.onError(audioError);
      }
    } catch (error) {
      console.error('Failed to start tutoring session:', error);
      if (this.callbacks.onError) this.callbacks.onError(error);
      throw new Error(error instanceof Error ? error.message : 'Failed to start tutoring session');
    }
  }

  public async endSession(): Promise<void> {
    if (this.vapi && this.currentSession) {
      console.log('Ending Vapi session...');
      try {
        // Stop the Vapi call
        await this.vapi.stop();

        // Remove all listeners to prevent memory leaks and ensure complete cleanup
        this.vapi.removeAllListeners();

        this.currentSession = null;
        this.stopKeepAlive();
        this.isMuted = false;
        this.isPaused = false;
        this.vapi = null; // Explicitly nullify the Vapi instance
        this.isInitialized = false; // Reset initialization state
        console.log('Vapi session ended.');
      } catch (error) {
        console.error('Error stopping Vapi session:', error);
        if (this.callbacks.onError) this.callbacks.onError(error);
      }
    } else {
      console.log('No active Vapi session to end.');
    }
  }

  public sendTextMessage(content: string): void {
    if (!this.vapi) {
      return;
    }

    try {
      this.vapi.send({
        type: 'add-message',
        message: {
          role: 'user',
          content: content
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  public toggleMute(): void {
    try {
      if (this.currentSession) {
        this.isMuted = !this.isMuted;
        if (typeof this.currentSession.setMuted === 'function') {
          this.currentSession.setMuted(this.isMuted);
        } else if (this.vapi && typeof this.vapi.setMuted === 'function') {
          this.vapi.setMuted(this.isMuted);
        } else {
        }
      } else {
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
      // Revert mute state on error
      this.isMuted = !this.isMuted;
    }
  }

  public togglePause(): void {
    try {
      if (this.currentSession) {
        this.isPaused = !this.isPaused;
        if (this.vapi) {
          (this.vapi as any).setPaused(this.isPaused);
          
          // If pausing, stop keep-alive; if resuming, restart it
          if (this.isPaused) {
            this.stopKeepAlive();
          } else {
            this.startKeepAlive();
          }
        } else {
        }
      } else {
      }
    } catch (error) {
      console.error('Error toggling pause:', error);
      // Revert pause state on error
      this.isPaused = !this.isPaused;
    }
  }

  public isSessionPaused(): boolean {
    return this.isPaused;
  }

  public isSessionMuted(): boolean {
    return this.isMuted;
  }

  async cleanup() {
    if (this.vapi) {
      console.log('VapiService cleanup initiated.');
      try {
        await this.vapi.stop();
        this.vapi.removeAllListeners();
        this.vapi = null;
        this.isInitialized = false;
        this.currentSession = null;
        this.stopKeepAlive();
        this.isMuted = false;
        this.isPaused = false;

        // Explicitly call onCallEnd callback during cleanup
        if (this.callbacks.onCallEnd) {
          this.callbacks.onCallEnd();
        }

        console.log('VapiService cleanup complete.');
      } catch (error) {
        console.error('Error during VapiService cleanup:', error);
        if (this.callbacks.onError) this.callbacks.onError(error);
      }
    } else {
      console.log('No Vapi instance to cleanup.');
    }
  }

  public getVapiInstance() {
    return this.vapi;
  }

  public getCurrentSession() {
    return this.currentSession;
  }
}

export const vapiService = new VapiService(); 