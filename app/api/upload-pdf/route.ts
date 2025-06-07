import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('[UPLOAD PDF API] GET request received');
  return NextResponse.json({ message: 'Upload PDF API is working' });
}

export async function POST(request: Request) {
  console.log('[UPLOAD PDF API] POST request received');
  return NextResponse.json({ message: 'Upload PDF API is working' });
} 