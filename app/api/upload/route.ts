import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import PDFParser from 'pdf2json';

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
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

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
    const text = (pdfData as any).Pages.map((page: any) => 
      page.Texts.map((text: any) => 
        decodeURIComponent(text.R[0].T)
      ).join(' ')
    ).join('\n');
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes text. Provide a concise summary that captures the main points and key concepts."
        },
        {
          role: "user",
          content: `Please summarize the following text in a clear and concise way:\n\n${text}`
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const summary = summaryResponse.choices[0]?.message?.content || text.substring(0, 1000);
    console.log('Generated summary:', summary);
    console.log('Original text length:', text.length);
    console.log('Summary length:', summary.length);
    
    return NextResponse.json({ 
      text,
      summary,
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
