import { parse } from 'pptx2json';

/**
 * Parse PowerPoint file and extract text content
 */
export async function parsePptx(buffer: Buffer): Promise<string> {
  try {
    console.log('[PPTX PARSER] Starting PowerPoint parsing...');
    console.log('[PPTX PARSER] Buffer size:', buffer.length);

    const result = await parse(buffer);
    console.log('[PPTX PARSER] PowerPoint parsed successfully');

    // Extract text from all slides
    const text = result.slides
      .map((slide: any) => {
        // Get text from shapes
        const shapeTexts = slide.shapes
          .filter((shape: any) => shape.text)
          .map((shape: any) => shape.text)
          .join('\n');

        // Get text from tables
        const tableTexts = slide.tables
          ?.map((table: any) => 
            table.rows
              .map((row: any) => 
                row.cells
                  .map((cell: any) => cell.text)
                  .join(' | ')
              )
              .join('\n')
          )
          .join('\n\n') || '';

        return `${shapeTexts}\n${tableTexts}`.trim();
      })
      .filter(Boolean)
      .join('\n\n');

    console.log('[PPTX PARSER] Text length:', text.length);
    console.log('[PPTX PARSER] First 500 characters:', text.substring(0, 500));
    
    return text;
  } catch (error) {
    console.error('[PPTX PARSER] Error parsing PowerPoint:', error);
    throw new Error(`Failed to parse PowerPoint: ${error instanceof Error ? error.message : String(error)}`);
  }
} 