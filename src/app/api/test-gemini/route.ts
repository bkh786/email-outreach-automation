import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  const systemKey = process.env.GEMINI_API_KEY;
  const isConfigured = Boolean(systemKey && systemKey.trim().length > 5);

  return NextResponse.json({
    configured: isConfigured,
    model: 'gemini-1.5-flash',
  });
}

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();
    const testKey = apiKey || process.env.GEMINI_API_KEY;

    if (!testKey || testKey.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Please enter a Gemini API Key to test.' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(testKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent('Respond with only the word "OK" to verify API connection.');
    const text = result.response.text().trim();

    return NextResponse.json({
      success: true,
      message: 'Gemini API Key verified and active! Model response received.',
      responseSnippet: text,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to authenticate with Google Gemini API.' },
      { status: 400 }
    );
  }
}
