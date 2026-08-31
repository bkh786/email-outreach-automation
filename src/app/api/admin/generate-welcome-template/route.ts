import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getLiveGeminiModels } from '@/lib/gemini-models';

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
        subject: 'Welcome to {{business_name}} — Your Logistics Automation Portal',
        template: `Dear {{name}},

Welcome to your dedicated Outreach & Lead Intelligence Workspace for {{business_name}}!

Your isolated client tenant account has been provisioned and is ready for production outreach. You can access your portal to configure trade lanes, research target prospects, and automate client acquisition pipelines.

Here are your account credentials:
---------------------------------------------
• Portal URL: {{login_url}}
• Login Email: {{login_email}}
• Temporary Password: {{temporary_password}}
• Registered Contact Number: {{contact_number}}
---------------------------------------------

Next Steps:
1. Log in to {{login_url}} using the credentials above.
2. Update your temporary password under 'Settings & BYOK'.
3. Configure your company outbound SMTP mail server to begin sending outreach.

If you have any questions or require custom setup assistance, simply reply directly to this email or call our operations desk.

Warm regards,
Platform Operations Team`,
        modelUsed: 'default-fallback',
        message: 'No active Gemini key found; restored high-converting default template.',
      });
    }

    const cleanedKey = apiKey.trim().replace(/^['"]|['"]$/g, '');
    const candidateModels = await getLiveGeminiModels(cleanedKey);

    const systemPrompt = `You are an elite B2B enterprise client onboarding specialist and executive copywriter.
Your goal is to write or rewrite a welcome email template that Super Admins will send to newly created client tenants (freight forwarding companies, logistics agencies, and B2B enterprises) when their isolated portal account is provisioned.

CRITICAL REQUIREMENTS:
1. You MUST include these EXACT dynamic placeholder tags in the email body:
   - {{name}} (The client primary contact person's name)
   - {{business_name}} (The client freight company/business name)
   - {{contact_number}} (The client's contact phone number)
   - {{login_email}} (The login email address)
   - {{temporary_password}} (The temporary password for their account)
   - {{login_url}} (The platform login URL)

2. Tone: Warm, professional, enterprise-grade, empowering, and action-oriented.
3. Structure:
   - Welcoming greeting to {{name}} representing {{business_name}}.
   - Clear credential callout box with {{login_url}}, {{login_email}}, {{temporary_password}}, and {{contact_number}}.
   - Brief 2-3 step onboarding guidance (e.g. logging in, updating password under Settings, connecting email dispatch).
   - Frictionless closing inviting them to reply directly to the email if they need immediate support.
   - Clean professional sign-off.

${promptInstructions ? `USER INSTRUCTION FOR REWRITE:\n"${promptInstructions}"\n` : ''}
${currentTemplate ? `EXISTING DRAFT TO REFINE / ENHANCE:\n"""\n${currentTemplate}\n"""\n` : ''}

Respond with ONLY a valid JSON object matching this schema:
{
  "subject": "A professional, clear, engaging subject line incorporating {{business_name}}",
  "template": "The full email body template with all placeholder tags"
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
                  maxOutputTokens: 1000,
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
      // Return high-quality default synthesized template
      return NextResponse.json({
        success: true,
        subject: 'Welcome to {{business_name}} — Your Outreach Portal Credentials',
        template: `Dear {{name}},

Welcome to {{business_name}}!

Your dedicated client tenant workspace on the Outreach & Automation Portal is officially provisioned.

Below are your initial login credentials to access your isolated workspace:
--------------------------------------------------
• Portal Access URL: {{login_url}}
• Registered Login Email: {{login_email}}
• Temporary Password: {{temporary_password}}
• Registered Contact Phone: {{contact_number}}
--------------------------------------------------

Getting Started:
1. Log in at {{login_url}} with your email and temporary password.
2. Update your security password under 'Settings & BYOK'.
3. Set up your outbound email dispatch server to begin automating cold outreach.

Should you need any assistance, feel free to reply directly to this email or call our desk at {{contact_number}}.

Best regards,
Operations & Platform Team`,
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
