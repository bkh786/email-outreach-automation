import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getLiveGeminiModels } from '@/lib/gemini-models';

import { DEFAULT_WELCOME_SUBJECT, DEFAULT_WELCOME_TEMPLATE } from '@/lib/welcome-constants';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { currentTemplate, promptInstructions } = body;

    // 1. Resolve Gemini API Key from database or env
    let apiKey = '';
    try {
      const adminSupabase = createAdminClient();
      const serverSupabase = createServerSupabaseClient();
      const { data: { user } } = await serverSupabase.auth.getUser();
      if (user) {
        const { data: config } = await adminSupabase
          .from('user_configs')
          .select('gemini_api_key')
          .eq('id', user.id)
          .single();
        if (config?.gemini_api_key) {
          apiKey = config.gemini_api_key;
        }
      }

      if (!apiKey) {
        const { data: anyConfig } = await adminSupabase
          .from('user_configs')
          .select('gemini_api_key')
          .not('gemini_api_key', 'is', null)
          .limit(1)
          .single();
        if (anyConfig?.gemini_api_key) {
          apiKey = anyConfig.gemini_api_key;
        }
      }
    } catch {
      // ignore
    }

    if (!apiKey) {
      apiKey = process.env.GEMINI_API_KEY || '';
    }

    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json({
        success: true,
        subject: DEFAULT_WELCOME_SUBJECT,
        template: DEFAULT_WELCOME_TEMPLATE,
        modelUsed: 'default-fallback',
        message: 'No active Gemini key found; restored high-converting default HTML template.',
      });
    }

    const cleanedKey = apiKey.trim().replace(/^['"]|['"]$/g, '');
    const candidateModels = await getLiveGeminiModels(cleanedKey);

    const systemPrompt = `You are an elite B2B enterprise client onboarding specialist and executive HTML email designer.
Your goal is to write or rewrite a welcome email template that Super Admins will send to newly created client tenants (freight forwarding companies, logistics agencies, and B2B enterprises) when their isolated portal account is provisioned.

CRITICAL REQUIREMENTS:
1. You MUST include these EXACT dynamic placeholder tags in the email body:
   - {{name}} (The client primary contact person's name)
   - {{business_name}} (The client freight company/business name)
   - {{contact_number}} (The client's contact phone number)
   - {{login_email}} (The login email address)
   - {{temporary_password}} (The temporary password for their account)
   - {{login_url}} (The platform login URL)

2. Output Format:
   - Provide a complete, modern, mobile-responsive HTML email template with inline styles (max-width: 600px, beautiful header, elegant credential table card with #0d9488 brand accents, clean call-to-action button to {{login_url}}, and professional footer).
   - Use web-safe inline fonts: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif.

3. Tone: Warm, executive, enterprise-grade, and action-oriented.

${promptInstructions ? `USER INSTRUCTION FOR REWRITE:\n"${promptInstructions}"\n` : ''}
${currentTemplate ? `EXISTING DRAFT TO REFINE / CONVERT TO HTML:\n"""\n${currentTemplate}\n"""\n` : ''}

Respond with ONLY a valid JSON object matching this schema:
{
  "subject": "A professional, clear, engaging subject line incorporating {{business_name}}",
  "template": "The full HTML email template with all placeholder tags and inline styles"
}`;

    let generatedResult: { subject: string; template: string } | null = null;
    let successfulModel = '';

    for (const modelName of candidateModels.slice(0, 4)) {
      const cleanModelName = modelName.replace(/^models\//, '');
      for (const apiVer of ['v1beta', 'v1']) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const restRes = await fetch(
            `https://generativelanguage.googleapis.com/${apiVer}/models/${cleanModelName}:generateContent?key=${cleanedKey}`,
            {
              method: 'POST',
              signal: controller.signal,
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': cleanedKey,
              },
              body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }],
                generationConfig: {
                  temperature: 0.3,
                  maxOutputTokens: 2000,
                  responseMimeType: 'application/json',
                },
              }),
            }
          );
          clearTimeout(timeoutId);

          if (!restRes.ok) continue;

          const data = await restRes.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const cleanJson = rawText.replace(/```json\n?|\n?```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            if (parsed.template && parsed.subject) {
              generatedResult = parsed;
              successfulModel = cleanModelName;
              break;
            }
          }
        } catch {
          // try next model
        }
      }
      if (generatedResult) break;
    }

    if (!generatedResult) {
      return NextResponse.json({
        success: true,
        subject: DEFAULT_WELCOME_SUBJECT,
        template: DEFAULT_WELCOME_TEMPLATE,
        modelUsed: 'template-synthesizer',
      });
    }

    return NextResponse.json({
      success: true,
      subject: generatedResult.subject,
      template: generatedResult.template,
      modelUsed: successfulModel,
    });
  } catch (error: any) {
    console.error('Gemini rewrite error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to rewrite template with Gemini' },
      { status: 500 }
    );
  }
}
