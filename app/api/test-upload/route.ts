import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('[TEST UPLOAD API] GET request received');
  return NextResponse.json({ message: 'Test upload API is working' });
}

export async function POST(request: Request) {
  console.log('[TEST UPLOAD API] POST request received');
  return NextResponse.json({ message: 'Test upload API is working' });
} 