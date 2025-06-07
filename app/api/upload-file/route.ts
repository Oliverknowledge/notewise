import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pdfParse from 'pdf-parse';

export async function GET(request: Request) {
  console.log('[UPLOAD FILE API] GET request received');
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    return NextResponse.json({ message: 'Upload file API is working with Supabase' });
  } catch (error) {
    console.error('[UPLOAD FILE API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log('[UPLOAD FILE API] POST request received');
  try {
    // Test 1: Basic request handling
    console.log('[UPLOAD FILE API] Testing basic request handling');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('[UPLOAD FILE API] No file in form data');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log('[UPLOAD FILE API] File received:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Test 2: Text extraction
    console.log('[UPLOAD FILE API] Starting text extraction...');
    let extractedText = '';
    try {
      console.log('[UPLOAD FILE API] Creating file buffer...');
      const arrayBuffer = await file.arrayBuffer();
      console.log('[UPLOAD FILE API] Array buffer size:', arrayBuffer.byteLength);
      
      const fileBuffer = Buffer.from(arrayBuffer);
      console.log('[UPLOAD FILE API] File buffer created, size:', fileBuffer.length);
      
      if (file.type === 'application/pdf') {
        console.log('[UPLOAD FILE API] Processing PDF file...');
        const pdfData = await pdfParse(fileBuffer);
        extractedText = pdfData.text || '';
        console.log(`[UPLOAD FILE API] Extracted ${extractedText.length} chars from PDF`);
      } else if (file.type === 'text/plain') {
        console.log('[UPLOAD FILE API] Processing text file...');
        extractedText = await file.text();
        console.log(`[UPLOAD FILE API] Extracted ${extractedText.length} chars from text file`);
      } else {
        console.error('[UPLOAD FILE API] Unsupported file type:', file.type);
        throw new Error(`Unsupported file type: ${file.type}`);
      }
    } catch (extractionError) {
      console.error('[UPLOAD FILE API] Text extraction error:', extractionError);
      console.error('[UPLOAD FILE API] Error stack:', extractionError instanceof Error ? extractionError.stack : 'No stack trace');
      return NextResponse.json({ 
        error: 'Failed to extract text from file',
        details: extractionError instanceof Error ? extractionError.message : 'Unknown error',
        fileType: file.type,
        fileName: file.name
      }, { status: 500 });
    }

    // Test 3: Supabase connection
    console.log('[UPLOAD FILE API] Testing Supabase connection');
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Test 4: File upload to Supabase
    const id = crypto.randomUUID();
    const fileExt = file.name.split('.').pop();
    const fileName = `test/${Date.now()}.${fileExt}`;
    
    console.log('[UPLOAD FILE API] Attempting file upload to Supabase');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('notes')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('[UPLOAD FILE API] Storage upload error:', uploadError);
      return NextResponse.json({ 
        error: 'Supabase storage error',
        details: uploadError.message
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'File processed successfully',
      filePath: uploadData.path,
      extractedText: extractedText.substring(0, 100) + '...' // Return first 100 chars of extracted text
    });

  } catch (error) {
    console.error('[UPLOAD FILE API] Error:', error);
    console.error('[UPLOAD FILE API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 