import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getLiveGeminiModels } from '@/lib/gemini-models';
import { enforceEmailSignature, formatSignatureAsHtml } from '@/lib/gemini';
import { Lead, Profile, UserConfig } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lead, userProfile, userConfig, apiKey, instruction } = body as {
      lead: Partial<Lead>;
      userProfile: Partial<Profile>;
      userConfig?: Partial<UserConfig>;
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
    const effectiveSignature = 
      userProfile?.email_signature?.trim() || 
      userConfig?.email_signature?.trim() || 
      '';
    const hasPanelSignature = Boolean(effectiveSignature.length > 0);
    const panelSignature = effectiveSignature;
    const senderWebsite = userProfile?.website_url || userConfig?.portfolio_url || '';

    const effectiveProfile: Partial<Profile> = {
      ...(userProfile || {}),
      email_signature: effectiveSignature,
    };

    const portfolioUrl = userProfile?.portfolio_url || (userProfile as any)?.['portfolio-link'] || userConfig?.portfolio_url || (userConfig as any)?.['portfolio-link'];
    const customDirective = instruction && instruction.trim().length > 0 
      ? instruction.trim() 
      : 'Rewrite to maximize reply rates. Ensure high personalization, clear value differentiation, crisp readability, and low-friction closing.';

    if (!rawKey || rawKey.trim() === '') {
      return NextResponse.json({
        success: true,
        email_subject: lead.email_subject || `Strategic partnership & growth for ${lead.company_name}`,
        email_body: generateFallbackRewrite(lead, effectiveProfile, panelSignature, portfolioUrl),
      });
    }

    const cleanedKey = rawKey.trim().replace(/^['"]|['"]$/g, '');
    const candidateModels = await getLiveGeminiModels(cleanedKey);

    const signatureInstructions = hasPanelSignature
      ? `### SENDER SIGNATURE POLICY:
The sender has their official, verified email signature pre-configured in their settings panel.
CRITICAL MANDATE:
- DO NOT generate or output ANY closing sign-off (e.g., do NOT write "Best regards,", "Thanks & Regards,", "Sincerely,", etc.).
- DO NOT generate ANY sender name (e.g., do NOT write "${effectiveProfile.contact_person || ''}").
- DO NOT generate the company name ("${effectiveProfile.company_name}") or any sender contact block at the bottom of the email.
- DO NOT generate any contact lines (no Email:, no Phone:, no Address:, no Website:, no LinkedIn:) at the end.
- DO NOT generate any signature block or horizontal divider line.
Stop the email body IMMEDIATELY after your final Call to Action sentence. The system will automatically attach the verified signature from the signature panel.`
      : `### SENDER SIGNATURE POLICY:
The signature panel is currently blank.
MANDATE:
Generate a single, professional closing sign-off and sender signature synthesized directly from the sender's website (${senderWebsite || 'https://www.digipresence.in'}), company name (${effectiveProfile?.company_name || 'Digi Presence Solutions'}), contact person (${effectiveProfile?.contact_person || 'Operations & Growth Team'}), and core services. Include the sender's website and contact touchpoints.`;

    let cleanPreviousBody = (lead.email_body || '')
      .replace(/<div style="margin-top:\s*24px;[\s\S]*$/i, '')
      .replace(/(?:<hr[^>]*>\s*)?(?:<p[^>]*>|\n|\s)*(?:Thanks\s*(?:&|and)?\s*Regards|Best\s*regards|Warm\s*regards|Sincerely|Kind\s*regards|Cheers|With\s*regards|Regards)[\s\S]*$/i, '')
      .trim();

    while (true) {
      const before = cleanPreviousBody;
      cleanPreviousBody = cleanPreviousBody.replace(/<hr[^>]*>\s*$/i, '').trim();
      cleanPreviousBody = cleanPreviousBody.replace(/<p[^>]*>\s*<\/p>\s*$/i, '').trim();

      const lastPMatch = cleanPreviousBody.match(/<p[^>]*>((?:(?!<p[\s>])[\s\S])*?)<\/p>\s*$/i);
      if (lastPMatch) {
        const fullMatch = lastPMatch[0];
        const content = lastPMatch[1];
        const lower = content.toLowerCase();
        const isContactBlock = 
          (lower.includes('email:') || lower.includes('@')) &&
          (lower.includes('phone') || lower.includes('address') || lower.includes('plot') || lower.includes('tel:') || lower.includes('linkedin') || lower.includes('website') || lower.includes('http') || lower.includes('wa:'));
        const isSignOff = /^(?:<br\s*\/?>|\s)*(?:thanks|best|warm|sincerely|regards|cheers|with regards)/i.test(content.trim());
        if (isContactBlock || isSignOff) {
          cleanPreviousBody = cleanPreviousBody.slice(0, cleanPreviousBody.length - fullMatch.length).trim();
          continue;
        }
      }
      if (cleanPreviousBody === before) break;
    }

    const prompt = `
You are an expert B2B cold email copywriter specializing in high-converting outreach.
Your task is to REWRITE and POLISH the cold outreach email for the following prospect.

### REWRITE INSTRUCTION / DESIRED TONE:
${customDirective}

### SENDER'S BRAND PROFILE:
- Company Name: ${effectiveProfile?.company_name || 'Digi Presence Solutions'}
- Core Services: ${Array.isArray(effectiveProfile?.services_offered) ? effectiveProfile.services_offered.join(', ') : 'Custom Automation & Outreach Systems'}
- Target Markets: ${Array.isArray(effectiveProfile?.target_markets) ? effectiveProfile.target_markets.join(', ') : 'Global B2B Markets'}
- Unique Value Proposition (USP): ${effectiveProfile?.unique_selling_proposition || 'Delivering measurable growth and operational efficiency.'}
- Certifications / Strengths: ${effectiveProfile?.strengths_and_certifications || 'Enterprise verified'}
${portfolioUrl ? `- Company Credentials / Portfolio Deck (URL): ${portfolioUrl}
MANDATE: The sender has provided their verified Company Credentials / Portfolio link (${portfolioUrl}). Mention this link naturally in the email body by default so the prospect can review credentials.` : ''}

${signatureInstructions}

### PROSPECT DATA:
- Company Name: ${lead.company_name}
- Contact Person: ${lead.contact_person || 'Operations Lead'}
- Country / Region: ${lead.country || 'International'}
- Website URL: ${lead.website_url || 'N/A'}
- Operational Synopsis: ${lead.company_profile || 'Active commercial enterprise'}
- Current Draft Subject: ${lead.email_subject || 'N/A'}
- Current Draft Body (reference only for facts, do NOT copy signature):
"""
${cleanPreviousBody ? cleanPreviousBody.slice(0, 1500) : 'None'}
"""

### OUTPUT SPECIFICATIONS:
Respond ONLY with a valid JSON object matching this schema:
{
  "email_subject": "A fresh, compelling, 4-7 word subject line tailored to the prospect (no spam triggers).",
  "email_body": "A tailored, high-converting B2B cold outreach email formatted in clean, professional HTML with inline styles. Use <p style='margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; font-size: 14.5px; line-height: 1.65; color: #1e293b;'> for paragraphs. Use <strong> for emphasis. Include a styled callout box (<div style='margin: 16px 0; padding: 14px 18px; background-color: #f8fafc; border-left: 3px solid #0d9488; border-radius: 0 8px 8px 0; font-size: 14px; line-height: 1.6; color: #334155;'>...</div>) for core value proposition. End with a low-friction CTA (reply to email or call). ${portfolioUrl ? `Include a natural mention inviting the prospect to review our company credentials deck (${portfolioUrl}). ` : ''}${hasPanelSignature ? 'CRITICAL: STOP immediately after the CTA. DO NOT include any closing sign-off, sender name, company name, or contact block.' : 'Conclude with a single professional closing sign-off and signature synthesized from the website and brand profile.'}"
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
                  email_body: enforceEmailSignature(parsed.email_body, hasPanelSignature ? panelSignature : '', effectiveProfile),
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
            email_body: enforceEmailSignature(parsed.email_body, hasPanelSignature ? panelSignature : '', effectiveProfile),
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
