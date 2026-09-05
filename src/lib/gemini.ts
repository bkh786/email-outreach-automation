import { GoogleGenerativeAI } from '@google/generative-ai';
import { Lead, Profile, ScrapedData, AiEnrichmentResult } from './types';
import { getLiveGeminiModels } from './gemini-models';

/**
 * Converts a raw email signature into an executive, responsive HTML signature block.
 */
export function formatSignatureAsHtml(signature: string, profile?: Partial<Profile>): string {
  if (!signature || !signature.trim()) {
    const fallbackCompany = profile?.company_name || 'Digi Presence Solutions';
    const fallbackContact = profile?.contact_person || 'Operations & Growth Team';
    return `
<div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13.5px; font-weight: 500;">Thanks &amp; Regards,</p>
  <div style="font-weight: 700; color: #0f172a; font-size: 14.5px; line-height: 1.3;">${fallbackContact}</div>
  <div style="color: #0d9488; font-weight: 600; font-size: 13px; margin: 2px 0 6px 0;">${fallbackCompany}</div>
</div>`.trim();
  }

  const trimmed = signature.trim();

  // If already contains rich HTML markup
  if (/<(div|table|p|span)[^>]*>/i.test(trimmed)) {
    return trimmed;
  }

  // Parse plain text signature lines
  const rawLines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
  if (rawLines.length === 0) return '';

  let signOff = 'Thanks & Regards,';
  let restLines = rawLines;

  const signOffMatch = rawLines[0].match(/^(Thanks\s*(&|and)?\s*Regards|Best\s*regards|Warm\s*regards|Sincerely|Kind\s*regards|Cheers|With\s*regards)[,]?$/i);
  if (signOffMatch) {
    signOff = rawLines[0].endsWith(',') ? rawLines[0] : `${rawLines[0]},`;
    restLines = rawLines.slice(1);
  }

  const nameOrTitle = restLines[0] || profile?.contact_person || 'Operations & Growth Team';
  const company = restLines[1] || profile?.company_name || 'Digi Presence Solutions';
  const metadataLines = restLines.slice(2);

  const formattedMeta: string[] = [];
  for (const line of metadataLines) {
    const formattedLine = line
      .replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1" style="color: #0d9488; text-decoration: none; font-weight: 500;">$1</a>')
      .replace(/(\+?\d[\d\s-]{7,}\d)/g, '<a href="tel:$1" style="color: #475569; text-decoration: none;">$1</a>')
      .replace(/(https?:\/\/[^\s|]+)/g, '<a href="$1" target="_blank" style="color: #0d9488; text-decoration: underline;">$1</a>');
    formattedMeta.push(`<div style="margin: 2px 0; color: #475569; font-size: 12.5px; line-height: 1.5;">${formattedLine}</div>`);
  }

  return `
<div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13.5px; font-weight: 500;">${signOff}</p>
  <div style="font-weight: 700; color: #0f172a; font-size: 14.5px; line-height: 1.3;">${nameOrTitle}</div>
  <div style="color: #0d9488; font-weight: 600; font-size: 13px; margin: 2px 0 6px 0;">${company}</div>
  ${formattedMeta.join('\n')}
</div>`.trim();
}

/**
 * Converts a plain text email body into responsive, elegant HTML.
 */
export function convertPlainBodyToRichHtml(
  bodyText: string,
  userProfile?: Partial<Profile>
): string {
  if (!bodyText) return '';

  const trimmed = bodyText.trim();
  if (/<(p|div|table|h[1-6])[^>]*>/i.test(trimmed)) {
    return trimmed;
  }

  const signOffPatterns = [
    /\n\s*(Thanks\s*(&|and)?\s*Regards|Best\s*regards|Warm\s*regards|Sincerely|Kind\s*regards|Cheers|With\s*regards)[\s\S]*$/i,
    /\n\s*\[(?:Name|Team|Company Name|Phone|Email|Address|Portfolio)\][\s\S]*$/i,
  ];

  let cleaned = trimmed;
  for (const pat of signOffPatterns) {
    if (pat.test(cleaned)) {
      cleaned = cleaned.replace(pat, '').trim();
      break;
    }
  }

  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);

  const htmlParagraphs = paragraphs.map((para, idx) => {
    if (para.startsWith('-') || para.startsWith('*')) {
      const items = para.split(/\n[-*]\s*/).map(s => s.trim().replace(/^[-*]\s*/, '')).filter(Boolean);
      return `<ul style="margin: 14px 0 16px 20px; padding: 0; color: #1e293b; font-size: 14.5px; line-height: 1.65;">
        ${items.map(it => `<li style="margin-bottom: 6px;">${it}</li>`).join('')}
      </ul>`;
    }

    if (idx === 1 && paragraphs.length > 2) {
      return `<div style="margin: 16px 0; padding: 14px 18px; background-color: #f8fafc; border-left: 3px solid #0d9488; border-radius: 0 8px 8px 0; font-size: 14px; line-height: 1.6; color: #334155;">
        ${para.replace(/\n/g, '<br/>')}
      </div>`;
    }

    return `<p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14.5px; line-height: 1.65; color: #1e293b;">${para.replace(/\n/g, '<br/>')}</p>`;
  });

  const portfolioUrl = userProfile?.portfolio_url || (userProfile as any)?.['portfolio-link'];
  const portfolioCta = portfolioUrl && String(portfolioUrl).trim()
    ? `<div style="margin: 18px 0;">
        <a href="${portfolioUrl.startsWith('http') ? portfolioUrl : `https://${portfolioUrl}`}" target="_blank" style="display: inline-block; padding: 7px 14px; background-color: #f0fdfa; color: #0d9488; border: 1px solid #ccfbf1; border-radius: 8px; font-weight: 600; font-size: 12.5px; text-decoration: none;">
          📄 View Company Credentials &amp; Portfolio &rarr;
        </a>
      </div>`
    : '';

  const rawSig = userProfile?.email_signature || '';
  const htmlSig = formatSignatureAsHtml(rawSig, userProfile);

  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14.5px; line-height: 1.65; color: #1e293b; max-width: 620px;">
  ${htmlParagraphs.join('\n')}
  ${portfolioCta}
  ${htmlSig}
</div>`.trim();
}

/**
 * Enforces that the output email contains rich HTML formatting and concludes with the HTML signature.
 */
export function enforceEmailSignature(
  bodyHtmlOrText: string,
  signature: string,
  profile?: Partial<Profile>
): string {
  if (!bodyHtmlOrText) return '';

  const isHtml = /<(p|div|table|span|ul)[^>]*>/i.test(bodyHtmlOrText);

  if (!isHtml) {
    return convertPlainBodyToRichHtml(bodyHtmlOrText, {
      ...profile,
      email_signature: signature || profile?.email_signature,
    });
  }

  // If HTML already contains signature container, return as is
  if (bodyHtmlOrText.includes('border-top: 1px solid') || (signature && signature.length > 10 && bodyHtmlOrText.includes(signature.slice(0, 20)))) {
    return bodyHtmlOrText.trim();
  }

  const htmlSig = formatSignatureAsHtml(signature, profile);

  if (/<\/div>\s*$/i.test(bodyHtmlOrText)) {
    return bodyHtmlOrText.replace(/<\/div>\s*$/i, `\n  ${htmlSig}\n</div>`);
  }

  return `${bodyHtmlOrText}\n\n${htmlSig}`;
}

export async function enrichLeadWithGemini(
  lead: Partial<Lead>,
  scrapedData: ScrapedData | null,
  userProfile: Partial<Profile>,
  apiKey?: string
): Promise<AiEnrichmentResult> {
  const targetSignature = (userProfile.email_signature && userProfile.email_signature.trim().length > 0)
    ? userProfile.email_signature.trim()
    : 'Thanks & Regards\nGrowth & Strategy Team\nDigi Presence Solutions\nEmail: contact@digipresence.in\nAddress: Registered Office | Phone No.: +91 9064435909 | www.digipresence.in';

  const rawKey = apiKey || process.env.GEMINI_API_KEY;

  if (!rawKey || rawKey.trim() === '') {
    return generateFallbackEnrichment(lead, scrapedData, userProfile);
  }

  const cleanedKey = rawKey.trim().replace(/^['"]|['"]$/g, '');
  const candidateModels = await getLiveGeminiModels(cleanedKey);

  const portfolioUrl = userProfile.portfolio_url || (userProfile as any)?.['portfolio-link'];

  const prompt = `
You are an expert enterprise B2B cold outreach copywriter and business development strategist.
Your objective is to analyze a prospective client company and synthesize a highly personalized, compelling, non-generic cold outreach email from the sender's company.

### SENDER'S BRAND PROFILE (Our Company):
- Company Name: ${userProfile.company_name || 'Digi Presence Solutions'}
- Core Business Capabilities & Strengths: ${Array.isArray(userProfile.services_offered) ? userProfile.services_offered.join(', ') : 'Digital Solutions, Operations, Technology & Outreach Automation'}
- Target Markets & Industry Segments: ${Array.isArray(userProfile.target_markets) ? userProfile.target_markets.join(', ') : 'Global B2B, North America, Europe, Asia'}
- Unique Value Proposition (USP): ${userProfile.unique_selling_proposition || 'Delivering measurable ROI through custom AI workflows, dedicated strategy, and robust execution.'}
- Accreditations & Certifications: ${userProfile.strengths_and_certifications || 'Enterprise Verified, ISO Certified, Industry Leading Partner'}
${portfolioUrl ? `- Company Credentials / Portfolio Deck (URL): ${portfolioUrl}` : ''}

### SENDER'S MANDATORY EMAIL SIGNATURE:
Conclude the email strictly with this email signature:
"""
${targetSignature}
"""

### PROSPECT DATA (The Lead):
- Company Name: ${lead.company_name || 'Prospective Partner'}
- Contact Person: ${lead.contact_person || 'Business & Operations Leader'}
- Email: ${lead.email || ''}
- Country / Region: ${lead.country || 'International'}
- Website URL: ${lead.website_url || 'N/A'}
- Scraped Web Summary: ${scrapedData?.description || scrapedData?.title || 'Commercial & Enterprise Operations'}
- Detected Capabilities: ${scrapedData?.servicesFound?.join(', ') || 'Enterprise operations'}
- Scraped Website Context:
"""
${scrapedData?.bodyText ? scrapedData.bodyText.substring(0, 2000) : 'No website content available; leverage industry standard intelligence for this company type.'}
"""

### TASK:
Analyze the lead's operational focus and produce a structured JSON response matching the following schema:
{
  "company_profile": "2-3 concise sentences summarizing what this prospect does, their market focus, and their primary operational footprint.",
  "financial_info": "Observable scale indicators (e.g. estimated office count, market presence, enterprise scale, or tier bracket).",
  "email_subject": "A compelling, 4-8 word, curiosity-inducing cold email subject line customized to the prospect's company and operational focus (avoid cheesy spam phrases).",
  "email_body": "A tailored, high-converting B2B cold outreach email formatted in clean, professional HTML with inline styles. Requirements: 1. Address ${lead.contact_person ? lead.contact_person.split(' ')[0] : 'there'} naturally. 2. Reference specific aspects of ${lead.company_name}'s operations. 3. Clearly bridge sender capabilities to prospect needs using clean <p> tags and a styled callout box (<div style='margin: 16px 0; padding: 14px 18px; background-color: #f8fafc; border-left: 3px solid #0d9488; border-radius: 0 8px 8px 0;'>...</div>) with <strong> tags for key benefits. 4. Low-friction Call to Action (reply to this email or call on the number in signature). 5. Conclude cleanly with the sender's signature."
}

Return ONLY valid JSON matching this exact structure.
`;

  try {
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
              const parsed = JSON.parse(replyText) as AiEnrichmentResult;
              if (parsed.email_subject && parsed.email_body) {
                return {
                  company_profile: parsed.company_profile || `${lead.company_name} business overview.`,
                  financial_info: parsed.financial_info || 'Established enterprise market presence.',
                  email_subject: parsed.email_subject,
                  email_body: enforceEmailSignature(parsed.email_body, targetSignature, userProfile),
                };
              }
            }
          }
        } catch {
          // continue
        }
      }
    }

    const genAI = new GoogleGenerativeAI(cleanedKey);
    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName.replace(/^models\//, ''),
        });

        const response = await model.generateContent(prompt);
        let text = response.response.text();
        text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
        const parsed = JSON.parse(text) as AiEnrichmentResult;

        if (parsed.email_subject && parsed.email_body) {
          return {
            company_profile: parsed.company_profile || `${lead.company_name} enterprise profile.`,
            financial_info: parsed.financial_info || 'Enterprise commercial presence.',
            email_subject: parsed.email_subject,
            email_body: enforceEmailSignature(parsed.email_body, targetSignature, userProfile),
          };
        }
      } catch {
        continue;
      }
    }

    return generateFallbackEnrichment(lead, scrapedData, userProfile);
  } catch (err: any) {
    console.warn('Gemini API call failed, falling back to smart dynamic generator:', err.message);
    return generateFallbackEnrichment(lead, scrapedData, userProfile);
  }
}

function generateFallbackEnrichment(
  lead: Partial<Lead>,
  scrapedData: ScrapedData | null,
  userProfile: Partial<Profile>
): AiEnrichmentResult {
  const companyName = lead.company_name || 'Your Company';
  const contactName = lead.contact_person ? lead.contact_person.split(' ')[0] : 'there';
  const country = lead.country || 'Global';
  const senderCompany = userProfile.company_name || 'Digi Presence Solutions';
  const services = Array.isArray(userProfile.services_offered) && userProfile.services_offered.length > 0 
    ? userProfile.services_offered.slice(0, 2).join(' & ')
    : 'Custom AI Automation & Business Systems';
  const usp = userProfile.unique_selling_proposition || 'Delivering measurable ROI through custom AI workflows, dedicated strategy, and robust execution.';
  const portfolioUrl = userProfile.portfolio_url || (userProfile as any)?.['portfolio-link'];

  const summaryContext = scrapedData?.description || scrapedData?.title 
    ? `${scrapedData.title ? scrapedData.title + '. ' : ''}${scrapedData.description || ''}`
    : `commercial operations and enterprise services in ${country}`;

  const htmlBody = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14.5px; line-height: 1.65; color: #1e293b; max-width: 620px;">
  <p style="margin: 0 0 16px 0;">Hi ${contactName},</p>
  
  <p style="margin: 0 0 16px 0;">
    I have been following <strong>${companyName}</strong>'s market expansion across ${country}. Given your active focus on scaling operational capacity and client acquisition, I wanted to reach out directly.
  </p>

  <div style="margin: 18px 0; padding: 14px 18px; background-color: #f8fafc; border-left: 3px solid #0d9488; border-radius: 0 8px 8px 0; font-size: 14px; line-height: 1.6; color: #334155;">
    At <strong>${senderCompany}</strong>, we specialize in <strong>${services}</strong>${userProfile.strengths_and_certifications ? `, backed by our ${userProfile.strengths_and_certifications}` : ''}. We regularly help leading organizations in your sector accelerate client acquisition and automate core workflows.
  </div>

  <p style="margin: 0 0 16px 0;">
    ${usp}
  </p>

  ${portfolioUrl ? `
  <div style="margin: 18px 0;">
    <a href="${portfolioUrl.startsWith('http') ? portfolioUrl : `https://${portfolioUrl}`}" target="_blank" style="display: inline-block; padding: 7px 14px; background-color: #f0fdfa; color: #0d9488; border: 1px solid #ccfbf1; border-radius: 8px; font-weight: 600; font-size: 12.5px; text-decoration: none;">
      📄 View Company Credentials &amp; Portfolio Deck &rarr;
    </a>
  </div>` : ''}

  <p style="margin: 0 0 16px 0;">
    If this aligns with your current priorities, simply reply directly to this email or call us on the contact number below, and we'll be glad to share relevant benchmarks.
  </p>

  ${formatSignatureAsHtml(userProfile.email_signature || '', userProfile)}
</div>`.trim();

  return {
    company_profile: `${companyName} is an active commercial entity operating out of ${country}, specializing in ${summaryContext.slice(0, 140)}.`,
    financial_info: `Enterprise Tier: Mid-to-Large scale operations with active digital footprint across ${country} and regional partner networks.`,
    email_subject: `Strategic growth & operational efficiency for ${companyName}`,
    email_body: htmlBody,
  };
}

