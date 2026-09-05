import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getLiveGeminiModels } from '@/lib/gemini-models';
import { enforceEmailSignature, formatSignatureAsHtml } from '@/lib/gemini';
import { Lead, Profile } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lead, userProfile, apiKey, instruction } = body as {
      lead: Partial<Lead>;
      userProfile: Partial<Profile>;
      apiKey?: string;
      instruction?: string;
    };

    if (!lead || !lead.company_name) {
      return NextResponse.json(
        { success: false, error: 'Lead company name is required' },
        { status: 400 }
      );
    }

    const rawKey = apiKey || process.env.GEMINI_API_KEY;
    const hasPanelSignature = Boolean(userProfile?.email_signature && userProfile.email_signature.trim().length > 0);
    const panelSignature = userProfile?.email_signature?.trim() || '';
    const senderWebsite = userProfile?.website_url || '';

    const portfolioUrl = userProfile?.portfolio_url || (userProfile as any)?.['portfolio-link'];
    const customDirective = instruction && instruction.trim().length > 0 
      ? instruction.trim() 
      : 'Rewrite to maximize reply rates. Ensure high personalization, clear value differentiation, crisp readability, and low-friction closing.';

    if (!rawKey || rawKey.trim() === '') {
      return NextResponse.json({
        success: true,
        email_subject: lead.email_subject || `Strategic partnership & growth for ${lead.company_name}`,
        email_body: generateFallbackRewrite(lead, userProfile, panelSignature, portfolioUrl),
      });
    }

    const cleanedKey = rawKey.trim().replace(/^['"]|['"]$/g, '');
    const candidateModels = await getLiveGeminiModels(cleanedKey);

    const signatureInstructions = hasPanelSignature
      ? `### SENDER SIGNATURE POLICY:
The sender has their official, verified email signature pre-configured in their settings panel.
CRITICAL MANDATE:
DO NOT generate or output ANY closing sign-off (e.g., do NOT write "Best regards,", "Thanks & Regards,", "Sincerely,", etc.), and do NOT generate any sender name, company name, address, phone number, or signature block at all.
Stop the email body IMMEDIATELY after your final Call to Action sentence. The system will automatically attach the verified signature from the signature panel.`
      : `### SENDER SIGNATURE POLICY:
The signature panel is currently blank.
MANDATE:
Generate a professional, high-credibility closing sign-off and sender signature synthesized directly from the sender's website (${senderWebsite || 'https://www.digipresence.in'}), company name (${userProfile?.company_name || 'Digi Presence Solutions'}), contact person (${userProfile?.contact_person || 'Operations & Growth Team'}), and core services. Include the sender's website and contact touchpoints.`;

    const prompt = `
You are an expert B2B cold email copywriter specializing in high-converting outreach.
Your task is to REWRITE and POLISH the cold outreach email for the following prospect.

### REWRITE INSTRUCTION / DESIRED TONE:
${customDirective}

### SENDER'S BRAND PROFILE:
- Company Name: ${userProfile?.company_name || 'Digi Presence Solutions'}
- Core Services: ${Array.isArray(userProfile?.services_offered) ? userProfile.services_offered.join(', ') : 'Custom Automation & Outreach Systems'}
- Target Markets: ${Array.isArray(userProfile?.target_markets) ? userProfile.target_markets.join(', ') : 'Global B2B Markets'}
- Unique Value Proposition (USP): ${userProfile?.unique_selling_proposition || 'Delivering measurable growth and operational efficiency.'}
- Certifications / Strengths: ${userProfile?.strengths_and_certifications || 'Enterprise verified'}
${portfolioUrl ? `- Company Credentials / Portfolio Deck (URL): ${portfolioUrl}` : ''}

${signatureInstructions}

### PROSPECT DATA:
- Company Name: ${lead.company_name}
- Contact Person: ${lead.contact_person || 'Operations Lead'}
- Country / Region: ${lead.country || 'International'}
- Website URL: ${lead.website_url || 'N/A'}
- Operational Synopsis: ${lead.company_profile || 'Active commercial enterprise'}
- Current Draft Subject: ${lead.email_subject || 'N/A'}
- Current Draft Body:
"""
${lead.email_body ? lead.email_body.slice(0, 1500) : 'None'}
"""

### OUTPUT SPECIFICATIONS:
Respond ONLY with a valid JSON object matching this schema:
{
  "email_subject": "A fresh, compelling, 4-7 word subject line tailored to the prospect (no spam triggers).",
  "email_body": "A tailored, high-converting B2B cold outreach email formatted in clean, professional HTML with inline styles. Use <p style='margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; font-size: 14.5px; line-height: 1.65; color: #1e293b;'> for paragraphs. Use <strong> for emphasis. Include a styled callout box (<div style='margin: 16px 0; padding: 14px 18px; background-color: #f8fafc; border-left: 3px solid #0d9488; border-radius: 0 8px 8px 0; font-size: 14px; line-height: 1.6; color: #334155;'>...</div>) for core value proposition. End with a low-friction CTA (reply to email or call). ${hasPanelSignature ? 'STOP immediately after the CTA. DO NOT include any closing sign-off or signature block.' : 'Conclude with a professional closing sign-off and signature synthesized from the website and brand profile.'}"
}
`;

    // 1. Try REST fetch with discovered models
    for (const modelName of candidateModels) {
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
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json' },
              }),
            }
          );

          if (restRes.ok) {
            const restData = await restRes.json();
            let replyText = restData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (replyText) {
              replyText = replyText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
              const parsed = JSON.parse(replyText);
              if (parsed.email_subject && parsed.email_body) {
                return NextResponse.json({
                  success: true,
                  email_subject: parsed.email_subject,
                  email_body: enforceEmailSignature(parsed.email_body, hasPanelSignature ? panelSignature : '', userProfile),
                });
              }
            }
          }
        } catch {
          // try next
        }
      }
    }

    // 2. Try SDK fallback
    const genAI = new GoogleGenerativeAI(cleanedKey);
    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName.replace(/^models\//, '') });
        const res = await model.generateContent(prompt);
        let text = res.response.text();
        text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
        const parsed = JSON.parse(text);
        if (parsed.email_subject && parsed.email_body) {
          return NextResponse.json({
            success: true,
            email_subject: parsed.email_subject,
            email_body: enforceEmailSignature(parsed.email_body, hasPanelSignature ? panelSignature : '', userProfile),
          });
        }
      } catch {
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      email_subject: lead.email_subject || `Accelerating operational reach for ${lead.company_name}`,
      email_body: generateFallbackRewrite(lead, userProfile, panelSignature, portfolioUrl),
    });
  } catch (error: any) {
    console.error('Lead rewrite API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error while rewriting lead draft' },
      { status: 500 }
    );
  }
}

function generateFallbackRewrite(
  lead: Partial<Lead>,
  userProfile?: Partial<Profile>,
  targetSignature?: string,
  portfolioUrl?: string
): string {
  const contactName = lead.contact_person ? lead.contact_person.split(' ')[0] : 'there';
  const company = lead.company_name || 'Your Company';
  const senderCompany = userProfile?.company_name || 'Digi Presence Solutions';
  const services = Array.isArray(userProfile?.services_offered) && userProfile?.services_offered.length > 0
    ? userProfile.services_offered.slice(0, 2).join(' & ')
    : 'Custom AI Automation & Outreach Systems';

  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14.5px; line-height: 1.65; color: #1e293b; max-width: 620px;">
  <p style="margin: 0 0 16px 0;">Hi ${contactName},</p>
  
  <p style="margin: 0 0 16px 0;">
    I noticed <strong>${company}</strong>'s growing footprint and wanted to share how we are currently helping enterprises in your sector scale operations with zero downtime.
  </p>

  <div style="margin: 18px 0; padding: 14px 18px; background-color: #f8fafc; border-left: 3px solid #0d9488; border-radius: 0 8px 8px 0; font-size: 14px; line-height: 1.6; color: #334155;">
    At <strong>${senderCompany}</strong>, our core expertise is in <strong>${services}</strong>. We help organizations unlock higher margins, automate repetitive tasks, and secure consistent client pipelines.
  </div>

  <p style="margin: 0 0 16px 0;">
    ${userProfile?.unique_selling_proposition || 'We combine robust technological execution with dedicated industry strategy.'}
  </p>

  ${portfolioUrl ? `
  <div style="margin: 18px 0;">
    <a href="${portfolioUrl.startsWith('http') ? portfolioUrl : `https://${portfolioUrl}`}" target="_blank" style="display: inline-block; padding: 7px 14px; background-color: #f0fdfa; color: #0d9488; border: 1px solid #ccfbf1; border-radius: 8px; font-weight: 600; font-size: 12.5px; text-decoration: none;">
      📄 View Company Credentials &amp; Portfolio &rarr;
    </a>
  </div>` : ''}

  <p style="margin: 0 0 16px 0;">
    Are you open to a brief exchange? Feel free to reply directly to this email or reach out on the contact number below.
  </p>

  ${formatSignatureAsHtml(targetSignature || userProfile?.email_signature || '', userProfile)}
</div>`.trim();
}
