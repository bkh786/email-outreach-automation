export const DEFAULT_GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-pro-latest',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

export async function getLiveGeminiModels(apiKey: string): Promise<string[]> {
  const cleanedKey = apiKey.trim().replace(/^['"]|['"]$/g, '');
  try {
    for (const apiVersion of ['v1beta', 'v1']) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${cleanedKey}`,
        { 
          method: 'GET', 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.models)) {
          const contentModels = data.models
            .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
            .map((m: any) => m.name.replace(/^models\//, ''))
            .filter((name: string) => 
              !name.includes('tts') && 
              !name.includes('image') && 
              !name.includes('audio') && 
              !name.includes('embedding') && 
              !name.includes('robotics') &&
              !name.includes('preview-09') && 
              !name.includes('preview-10')
            );

          if (contentModels.length > 0) {
            const preferred = [
              'gemini-3.5-flash', 
              'gemini-3.6-flash', 
              'gemini-3.7-flash', 
              'gemini-flash-latest', 
              'gemini-3.5-flash-lite', 
              'gemini-pro-latest'
            ];
            const sorted = [
              ...preferred.filter(m => contentModels.includes(m)),
              ...contentModels.filter((m: string) => !preferred.includes(m)),
            ];
            return sorted;
          }
        }
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_GEMINI_MODELS;
}
