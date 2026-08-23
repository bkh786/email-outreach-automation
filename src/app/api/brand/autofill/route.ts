import { NextRequest, NextResponse } from 'next/server';
import { scrapeWebsite, cleanUrl } from '@/lib/scraper';
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { website_url, company_name, contact_person, apiKey } = body;

    if (!website_url || website_url.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid official website URL to analyze.' },
        { status: 400 }
      );
    }

    const activeKey = apiKey || process.env.GEMINI_API_KEY;
    if (!activeKey || activeKey.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Gemini API Key is required for AI autofill. Please configure your key in Settings & BYOK.' },
        { status: 400 }
      );
    }

    const cleanedKey = activeKey.trim().replace(/^['"]|['"]$/g, '');

    // Step 1: Scrape the official company website
    const targetUrl = cleanUrl(website_url);
    const scraped = await scrapeWebsite(targetUrl);

    const scrapedContext = scraped.bodyText || `${scraped.title} - ${scraped.description}`;

    // Step 2: Build structured analysis prompt for Gemini
    const prompt = `
You are an expert enterprise freight forwarding business development executive and brand strategist.
Your task is to analyze the scraped website content of a freight forwarding / logistics company and synthesize their official brand profile.

### TARGET COMPANY CONTEXT:
- Provided Website URL: ${targetUrl}
- Known Company Name: ${company_name || 'Extract from website'}
- Contact Person / Signatory: ${contact_person || 'Operations Lead'}
- Scraped Page Title: ${scraped.title || 'N/A'}
- Scraped Meta Description: ${scraped.description || 'N/A'}
- Detected Services: ${scraped.servicesFound?.join(', ') || 'Freight & Logistics'}
- Scraped Website Text:
"""
${scrapedContext.substring(0, 3000)}
"""

### REQUIRED OUTPUT:
Synthesize a comprehensive, high-converting B2B brand profile in JSON format matching this exact schema:
{
  "company_name": "Official company name (e.g. Anirise Logistics Pvt. Ltd.)",
  "unique_selling_proposition": "A concise, impactful 2-3 sentence value proposition highlighting their speed, experience, proprietary advantages, client-centered approach, technology, or network reliability.",
  "strengths_and_certifications": "Comma-separated list of accreditations, certifications, network licenses, and key credentials (e.g. IATA Cargo Agent, WCA Partner, FIATA Member, ISO 9001:2015, AEO Certified, 20+ Years Industry Experience).",
  "services_offered": [
    "Customs Clearance & Bonded CFS",
    "Air Freight Expedited & Charters",
    "Ocean FCL & LCL Consolidation",
    "Road Transport & Rail Freight",
    "Warehousing & 3PL Distribution",
    "Project Cargo & Heavy Lift",
    "Cold Chain & Pharma Logistics",
    "Cargo Insurance & Risk Management"
  ],
  "target_markets": [
    "India -> North America Air & Ocean FCL/LCL",
    "India -> Europe Multimodal Corridors",
    "India -> Middle East Supply Chain",
    "Domestic Pan-India Road & Rail Transport",
    "Asia -> North America",
    "Europe -> North America"
  ],
  "email_signature": "Best regards,\\n\\n${contact_person || 'Himanshu Kumar Singh'}\\n${company_name || 'Anirise Logistics Pvt. Ltd.'}\\nEmail: info@${targetUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '')}\\nPlot No-62 & 62A, Ground Floor, Block-WE, Mohan Garden, Uttam Nagar, New Delhi-110059 | Phone: +91-1143466415 | Website: ${targetUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}"
}

Return ONLY valid JSON matching this schema without code fences or extra commentary.
`;

    // Step 3: Execute AI inference with candidate model fallback
    let synthesizedResult: any = null;

    // Try REST across candidate models
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
                generationConfig: { responseMimeType: 'application/json' }
              })
            }
          );

          if (restRes.ok) {
            const restData = await restRes.json();
            let replyText = restData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (replyText) {
              replyText = replyText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
              synthesizedResult = JSON.parse(replyText);
              break;
            }
          }
        } catch {
          // continue
        }
      }
      if (synthesizedResult) break;
    }

    // Secondary attempt: GoogleGenerativeAI SDK
    if (!synthesizedResult) {
      try {
        const genAI = new GoogleGenerativeAI(cleanedKey);
        for (const modelName of CANDIDATE_MODELS) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName.replace(/^models\//, '') });
            const result = await model.generateContent(prompt);
            let text = result.response.text();
            text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
            synthesizedResult = JSON.parse(text);
            if (synthesizedResult) break;
          } catch {
            continue;
          }
        }
      } catch {
        // ignore
      }
    }

    if (!synthesizedResult) {
      return NextResponse.json(
        { success: false, error: 'AI analysis could not be completed. Please verify your Gemini API key in Settings.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Website analyzed and brand profile synthesized successfully!',
      profile: {
        company_name: synthesizedResult.company_name || company_name || 'Anirise Logistics Pvt. Ltd.',
        website_url: targetUrl,
        unique_selling_proposition: synthesizedResult.unique_selling_proposition || '',
        strengths_and_certifications: synthesizedResult.strengths_and_certifications || '',
        services_offered: Array.isArray(synthesizedResult.services_offered) ? synthesizedResult.services_offered : [],
        target_markets: Array.isArray(synthesizedResult.target_markets) ? synthesizedResult.target_markets : [],
        email_signature: synthesizedResult.email_signature || '',
      }
    });
  } catch (error: any) {
    console.error('Brand autofill error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error during brand autofill' },
      { status: 500 }
    );
  }
}
