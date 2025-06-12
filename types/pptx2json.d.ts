declare module 'pptx2json' {
  export function parse(buffer: Buffer): Promise<{
    slides: Array<{
      shapes: Array<{
        text?: string;
      }>;
      tables?: Array<{
        rows: Array<{
          cells: Array<{
            text: string;
          }>;
        }>;
      }>;
    }>;
  }>;
} 