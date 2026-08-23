import { GoogleGenerativeAI } from '@google/generative-ai';
import { Lead, Profile, ScrapedData, AiEnrichmentResult } from './types';

const CANDIDATE_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',
  'gemini-1.5-pro',
  'gemini-1.5-pro-latest',
  'gemini-pro'
];

export async function enrichLeadWithGemini(
  lead: Partial<Lead>,
  scrapedData: ScrapedData | null,
  userProfile: Partial<Profile>,
  apiKey?: string
): Promise<AiEnrichmentResult> {
  const rawKey = apiKey || process.env.GEMINI_API_KEY;

  if (!rawKey || rawKey.trim() === '') {
    return generateFallbackEnrichment(lead, scrapedData, userProfile);
  }

  const cleanedKey = rawKey.trim().replace(/^['"]|['"]$/g, '');

  const prompt = `
You are an expert enterprise B2B cold outreach copywriter and business development strategist.
Your objective is to analyze a prospective client company and synthesize a highly personalized, compelling, non-generic cold outreach email from the sender's company.

### SENDER'S BRAND PROFILE (Our Company):
- Company Name: ${userProfile.company_name || 'Digi Presence Solutions'}
- Core Business Capabilities & Strengths: ${Array.isArray(userProfile.services_offered) ? userProfile.services_offered.join(', ') : 'Digital Solutions, Operations, Technology & Outreach Automation'}
- Target Markets & Industry Segments: ${Array.isArray(userProfile.target_markets) ? userProfile.target_markets.join(', ') : 'Global B2B, North America, Europe, Asia'}
- Unique Value Proposition (USP): ${userProfile.unique_selling_proposition || 'Delivering measurable ROI through custom AI workflows, dedicated strategy, and robust execution.'}
- Accreditations & Certifications: ${userProfile.strengths_and_certifications || 'Enterprise Verified, ISO Certified, Industry Leading Partner'}
- Email Signature:
${userProfile.email_signature || 'Best regards,\nBusiness Development Team'}

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
  "email_body": "A tailored, high-converting B2B cold outreach email (approx 120-180 words). The email MUST:\n1. Address ${lead.contact_person ? lead.contact_person.split(' ')[0] : 'there'} naturally.\n2. Reference a specific aspect of ${lead.company_name}'s operations or market focus based on the scraped context.\n3. Clearly bridge how ${userProfile.company_name || 'our company'}'s strengths (${Array.isArray(userProfile.services_offered) ? userProfile.services_offered.slice(0, 2).join(' & ') : 'our solutions'}) directly address bottlenecks and deliver measurable value.\n4. Include a low-friction call to action (e.g. sharing relevant benchmarks or a brief 10-minute discovery call).\n5. Conclude cleanly with the sender's full signature."
}

Return ONLY valid JSON matching this exact structure.
`;

  try {
    // Attempt REST fetch first across v1beta and v1
    for (const modelName of CANDIDATE_MODELS) {
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
              }),
            }
          );

          if (restRes.ok) {
            const restData = await restRes.json();
            let replyText = restData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (replyText) {
              // Strip code fences if model wrapped in ```json ... ```
              replyText = replyText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
              const parsed = JSON.parse(replyText) as AiEnrichmentResult;
              if (parsed.email_subject && parsed.email_body) {
                return {
                  company_profile: parsed.company_profile || `${lead.company_name} logistics partner profile.`,
                  financial_info: parsed.financial_info || 'Commercial freight volume.',
                  email_subject: parsed.email_subject,
                  email_body: parsed.email_body,
                };
              }
            }
          }
        } catch {
          // continue
        }
      }
    }

    // Secondary attempt: GoogleGenerativeAI SDK
    const genAI = new GoogleGenerativeAI(cleanedKey);
    for (const modelName of CANDIDATE_MODELS) {
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
            company_profile: parsed.company_profile || `${lead.company_name} is an international freight and trade organization.`,
            financial_info: parsed.financial_info || 'Mid-market freight volume with regional multi-modal distribution footprint.',
            email_subject: parsed.email_subject,
            email_body: parsed.email_body,
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
  const contactName = lead.contact_person ? lead.contact_person.split(' ')[0] : 'Logistics Team';
  const country = lead.country || 'Global';
  const senderCompany = userProfile.company_name || 'Global Freight Dynamics';
  const services = Array.isArray(userProfile.services_offered) && userProfile.services_offered.length > 0 
    ? userProfile.services_offered.slice(0, 2).join(' and ')
    : 'Expedited Air and Ocean FCL/LCL';
  const markets = Array.isArray(userProfile.target_markets) && userProfile.target_markets.length > 0
    ? userProfile.target_markets.slice(0, 2).join(' & ')
    : 'Asia-North America and Transatlantic';
  const signature = userProfile.email_signature || `Best regards,\n\nTrade Lane Development Team\n${senderCompany}`;

  const detectedServices = scrapedData?.servicesFound?.length
    ? scrapedData.servicesFound.slice(0, 3).join(', ')
    : 'multimodal forwarding and supply chain solutions';

  return {
    company_profile: `${companyName} is an active commercial entity operating out of ${country}, focusing on ${detectedServices}. Their operations demonstrate steady cargo velocity across key international shipping corridors.`,
    financial_info: `Enterprise Tier: Mid-to-Large scale commercial logistics volume with established routing across ${country} and regional partner networks.`,
    email_subject: `Rate benchmarks & space allocation for ${companyName} (${country} corridors)`,
    email_body: `Hi ${contactName},

I have been following ${companyName}'s growth and active trade footprint in ${country}. Given the current capacity tight spots and rate fluctuations across major ${markets} lanes, I wanted to reach out directly.

At ${senderCompany}, we specialize in ${services} backed by our ${userProfile.strengths_and_certifications || 'IATA & WCA network certifications'}. We've helped partners in your corridor lock in guaranteed space allocations and reduce transit variance by up to 18%.

${userProfile.unique_selling_proposition ? `Specifically, ${userProfile.unique_selling_proposition.toLowerCase()}` : 'We offer end-to-end milestone visibility and competitive contract rates.'}

Would you be open to a quick 10-minute touchpoint this Thursday to review our updated Q3 lane tariff sheet for ${companyName}?

${signature}`,
  };
}
