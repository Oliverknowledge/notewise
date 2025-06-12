import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import PDFParser from 'pdf2json';
import officeParser from 'officeparser';

// Disable default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    console.log(formData)
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = '';

    // Handle different file types
    if (file.type === 'application/pdf') {
      // Parse the PDF using pdf2json
      const pdfParser = new PDFParser();
      
      const pdfData = await new Promise((resolve, reject) => {
        pdfParser.on('pdfParser_dataReady', (pdfData) => {
          resolve(pdfData);
        });
        
        pdfParser.on('pdfParser_dataError', (error) => {
          reject(error);
        });

        pdfParser.parseBuffer(buffer);
      });

      // Extract text from the PDF data
      extractedText = (pdfData as any).Pages.map((page: any) => 
        page.Texts.map((text: any) => 
          decodeURIComponent(text.R[0].T)
        ).join(' ')
      ).join('\n');
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      try {
        // Parse PowerPoint using officeparser
        const result = await new Promise<any>((resolve, reject) => {
          // @ts-ignore - officeParser works but has incorrect types
          officeParser.parseOffice(buffer, (err: any, data: any) => {
            console.log('OfficeParser callback - err type:', typeof err, 'data type:', typeof data);
            console.log('OfficeParser callback - err:', err);
            console.log('OfficeParser callback - data:', data);
            
            if (err) {
              // If err is actually the text content, use it
              if (typeof err === 'string' && err.length > 0) {
                resolve(err);
              } else {
                resolve(''); // Resolve with empty string if no text content
              }
            } else {
              resolve(data);
            }
          });
        });

        console.log('PowerPoint parsing result type:', typeof result);
        console.log('PowerPoint parsing result:', result);

        // Handle different possible result types
        if (typeof result === 'string') {
          extractedText = result;
        } else if (result && typeof result === 'object') {
          // Try to extract text from object structure
          if (Array.isArray(result)) {
            extractedText = result.join('\n');
          } else {
            extractedText = JSON.stringify(result);
          }
        } else {
          extractedText = String(result || '');
        }
      } catch (parseError) {
        console.warn('PowerPoint parsing warning:', parseError);
        // If parseError is actually the text content, use it
        if (typeof parseError === 'string' && parseError.length > 0) {
          extractedText = parseError;
        } else {
          extractedText = ''; // Continue with empty string
        }
      }
    } else {
      throw new Error('Unsupported file type. Please upload a PDF or PowerPoint file.');
    }

    console.log('Final extractedText type:', typeof extractedText);
    console.log('Final extractedText:', extractedText);

    // Ensure extractedText is a string
    if (typeof extractedText !== 'string') {
      console.log('Converting extractedText to string');
      extractedText = String(extractedText || '');
    }

    // If no text was extracted, return an error
    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Could not extract text from file',
        details: 'The file may be empty or in an unsupported format'
      }, { status: 400 });
    }

    console.log('Extracted text length:', extractedText.length);
    console.log('First 500 characters:', extractedText.substring(0, 500));

    let summary;
    try {
      const summaryResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert study assistant. Create a clear, concise summary of the provided text. Focus on the main points and key ideas. Write in a casual, student-friendly tone.`
          },
          {
            role: "user",
            content: `Please summarize the following text:\n\n${extractedText}`
          }
        ]
      });

      console.log("response", summaryResponse);
      const summaryContent = summaryResponse.choices[0]?.message?.content;
      if (!summaryContent) {
        throw new Error('Empty response from OpenAI');
      }

      summary = {
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
        summary: summaryContent
      };
      console.log('Generated summary:', summary);

    } catch (summaryError) {
      console.error('Summary generation error:', summaryError);
      // Create a basic summary if OpenAI fails
      summary = {
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
        summary: "Summary generation failed. Please review the extracted text below."
      };
    }
    
    return NextResponse.json({ 
      
      summary: summary.summary,
      filePath: file.name
    });
  } catch (error: any) {
    console.error('File processing error:', error);
    return NextResponse.json({ 
      error: 'Failed to process file',
      details: error.message 
    }, { status: 500 });
  }
}
