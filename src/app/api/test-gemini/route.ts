import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const CANDIDATE_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',
  'gemini-1.5-pro',
  'gemini-1.5-pro-latest',
  'gemini-pro'
];

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
    const rawKey = apiKey || process.env.GEMINI_API_KEY;

    if (!rawKey || typeof rawKey !== 'string' || rawKey.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid Google Gemini API Key.' },
        { status: 400 }
      );
    }

    // Clean key of leading/trailing whitespace or accidental quotes
    const cleanedKey = rawKey.trim().replace(/^['"]|['"]$/g, '');

    let lastError: any = null;
    let successfulModel: string | null = null;
    let responseSnippet = '';

    const genAI = new GoogleGenerativeAI(cleanedKey);

    // Try each model candidate until one succeeds
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Respond with only the word "OK".');
        const text = result.response.text().trim();
        if (text) {
          successfulModel = modelName;
          responseSnippet = text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        // If it's a 404 (model not found on this API version), continue to next candidate model
        if (err.message?.includes('404') || err.message?.includes('not found')) {
          continue;
        }
        // If it's an invalid API key, stop early
        if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('400')) {
          break;
        }
      }
    }

    // If SDK attempts failed with 404, attempt direct REST fetch fallback
    if (!successfulModel) {
      for (const modelName of CANDIDATE_MODELS) {
        try {
          const restRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${cleanedKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: 'Respond with OK' }] }]
              })
            }
          );

          if (restRes.ok) {
            const restData = await restRes.json();
            const reply = restData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (reply) {
              successfulModel = modelName;
              responseSnippet = reply.trim();
              break;
            }
          }
        } catch {
          // continue
        }
      }
    }

    if (successfulModel) {
      return NextResponse.json({
        success: true,
        message: `Gemini API connection verified successfully using ${successfulModel}!`,
        model: successfulModel,
        responseSnippet,
      });
    }

    const errorMessage = lastError?.message || 'Failed to authenticate with Google Gemini API. Please ensure your API key from Google AI Studio (aistudio.google.com) is valid and has Generative Language API access enabled.';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gemini API test encountered an unexpected error.' },
      { status: 500 }
    );
  }
}
