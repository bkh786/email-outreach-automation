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
    const rawKey = apiKey || process.env.GEMINI_API_KEY;

    if (!rawKey || typeof rawKey !== 'string' || rawKey.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid Google Gemini API Key.' },
        { status: 400 }
      );
    }

    const cleanedKey = rawKey.trim().replace(/^['"]|['"]$/g, '');

    // Step 1: Query Google Generative Language API ListModels endpoint to verify key & discover available models
    let availableModels: string[] = [];
    let listModelsError: string | null = null;

    for (const apiVersion of ['v1beta', 'v1']) {
      try {
        const listRes = await fetch(
          `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${cleanedKey}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': cleanedKey,
            },
          }
        );

        if (listRes.ok) {
          const data = await listRes.json();
          if (Array.isArray(data.models)) {
            const contentModels = data.models
              .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
              .map((m: any) => m.name.replace(/^models\//, ''));
            if (contentModels.length > 0) {
              availableModels = contentModels;
              break;
            }
          }
        } else {
          const errData = await listRes.json().catch(() => ({}));
          listModelsError = errData.error?.message || `HTTP ${listRes.status}: ${listRes.statusText}`;
        }
      } catch (e: any) {
        listModelsError = e.message;
      }
    }

    // Default fallback candidate models if listModels endpoint did not return
    const candidateList = availableModels.length > 0 
      ? availableModels 
      : [
          'gemini-1.5-flash',
          'gemini-1.5-flash-latest',
          'gemini-2.0-flash',
          'gemini-2.0-flash-exp',
          'gemini-1.5-pro',
          'gemini-1.5-pro-latest',
          'gemini-pro'
        ];

    let successfulModel: string | null = null;
    let responseSnippet = '';
    let lastExecError: string | null = null;

    // Step 2: Try direct REST generateContent across candidates
    for (const modelName of candidateList) {
      const cleanModelName = modelName.replace(/^models\//, '');
      for (const apiVer of ['v1beta', 'v1']) {
        try {
          const restRes = await fetch(
            `https://generativelanguage.googleapis.com/${apiVer}/models/${cleanModelName}:generateContent?key=${cleanedKey}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': cleanedKey,
              },
              body: JSON.stringify({
                contents: [{ parts: [{ text: 'Respond with OK' }] }],
              }),
            }
          );

          if (restRes.ok) {
            const restData = await restRes.json();
            const reply = restData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (reply) {
              successfulModel = cleanModelName;
              responseSnippet = reply.trim();
              break;
            }
          } else {
            const errData = await restRes.json().catch(() => ({}));
            lastExecError = errData.error?.message || `HTTP ${restRes.status}`;
          }
        } catch (err: any) {
          lastExecError = err.message;
        }
      }

      if (successfulModel) break;
    }

    // Step 3: Try GoogleGenerativeAI SDK as secondary fallback
    if (!successfulModel) {
      try {
        const genAI = new GoogleGenerativeAI(cleanedKey);
        for (const modelName of candidateList) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName.replace(/^models\//, '') });
            const result = await model.generateContent('Respond with OK');
            const text = result.response.text().trim();
            if (text) {
              successfulModel = modelName;
              responseSnippet = text;
              break;
            }
          } catch (sdkErr: any) {
            lastExecError = sdkErr.message;
          }
        }
      } catch (e: any) {
        lastExecError = e.message;
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

    // If failed, return clear troubleshooting details
    const detailedError = listModelsError || lastExecError || 'Gemini API authentication failed. Please generate a new free key at https://aistudio.google.com/app/apikey.';

    return NextResponse.json(
      { 
        success: false, 
        error: `Gemini API Authentication Error: ${detailedError}. Please verify that your key is created from Google AI Studio (https://aistudio.google.com) and has Generative Language API enabled.` 
      },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gemini API test encountered an unexpected error.' },
      { status: 500 }
    );
  }
}
