import { NextRequest, NextResponse } from 'next/server';
import { scrapeWebsite } from '@/lib/scraper';
import { enrichLeadWithGemini } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lead, userProfile, userConfig, apiKey } = body;

    if (!lead || !lead.company_name) {
      return NextResponse.json(
        { success: false, error: 'Lead company name is required' },
        { status: 400 }
      );
    }

    const effectiveSignature = 
      userProfile?.email_signature?.trim() || 
      userConfig?.email_signature?.trim() || 
      '';

    const effectiveProfile = {
      ...(userProfile || {}),
      email_signature: effectiveSignature,
      portfolio_url: userProfile?.portfolio_url || userConfig?.portfolio_url || (userConfig as any)?.['portfolio-link'],
    };

    // Step 1: Web Scraping if URL is provided
    let scrapedData = null;
    if (lead.website_url && lead.website_url.trim()) {
      try {
        scrapedData = await scrapeWebsite(lead.website_url);
      } catch (err: any) {
        console.warn(`Scraping warning for ${lead.website_url}:`, err.message);
      }
    }

    // Step 2: Gemini AI Analysis & Cold Email Drafting
    const enrichment = await enrichLeadWithGemini(
      lead,
      scrapedData,
      effectiveProfile,
      apiKey
    );

    return NextResponse.json({
      success: true,
      scrapedData,
      enrichment,
    });
  } catch (error: any) {
    console.error('Enrichment API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error during enrichment' },
      { status: 500 }
    );
  }
}
