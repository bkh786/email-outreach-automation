import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { scrapeWebsite } from '@/lib/scraper';
import { enrichLeadWithGemini } from '@/lib/gemini';
import { sendEmail } from '@/lib/mailer';

export const maxDuration = 60; // 60 seconds max execution on Vercel

export async function GET(req: NextRequest) {
  // Allow manual trigger or Vercel Cron with optional CRON_SECRET auth
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    const urlSecret = req.nextUrl.searchParams.get('secret');
    if (urlSecret !== cronSecret && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }
  }

  const supabase = createAdminClient();
  const batchSize = 10;

  try {
    // 1. Fetch pending leads
    const { data: pendingLeads, error: leadsError } = await supabase
      .from('leads')
      .select('*, profiles:user_id(*), user_configs:user_id(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (leadsError) {
      console.warn('Database query failed or Supabase not linked:', leadsError.message);
      return NextResponse.json({
        success: true,
        message: 'Cron triggered (Supabase not connected or no pending leads found)',
        processed: 0,
      });
    }

    if (!pendingLeads || pendingLeads.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending leads in queue',
        processed: 0,
      });
    }

    const results = [];

    for (const lead of pendingLeads) {
      try {
        // Mark as enriching
        await supabase.from('leads').update({ status: 'enriching' }).eq('id', lead.id);

        const userProfile = lead.profiles || {};
        const userConfig = lead.user_configs || {};

        // 2. Web Crawl
        let scrapedData = null;
        if (lead.website_url) {
          scrapedData = await scrapeWebsite(lead.website_url);
        }

        // 3. AI Enrichment
        const enrichment = await enrichLeadWithGemini(
          lead,
          scrapedData,
          userProfile,
          userConfig.gemini_api_key
        );

        let finalStatus = 'drafted';
        let sentAt = null;

        // 4. Auto-Send if enabled
        if (userConfig.auto_send_enabled && userConfig.smtp_host && userConfig.smtp_user && userConfig.smtp_pass) {
          const smtpConfig = {
            host: userConfig.smtp_host,
            port: userConfig.smtp_port || 587,
            user: userConfig.smtp_user,
            pass: userConfig.smtp_pass,
            secure: userConfig.smtp_secure ?? false,
            fromName: userConfig.from_name || userProfile.company_name || 'Freight Operations',
            fromEmail: userConfig.from_email || userConfig.smtp_user,
          };

          const sendResult = await sendEmail({
            config: smtpConfig,
            to: lead.email,
            subject: enrichment.email_subject,
            body: enrichment.email_body,
          });

          if (sendResult.success) {
            finalStatus = 'sent';
            sentAt = new Date().toISOString();
          }
        }

        // 5. Update lead in database
        await supabase.from('leads').update({
          company_profile: enrichment.company_profile,
          financial_info: enrichment.financial_info,
          email_subject: enrichment.email_subject,
          email_body: enrichment.email_body,
          status: finalStatus,
          sent_at: sentAt,
          error_message: null,
        }).eq('id', lead.id);

        // Record log
        await supabase.from('campaign_logs').insert({
          user_id: lead.user_id,
          lead_id: lead.id,
          event_type: finalStatus === 'sent' ? 'sent' : 'drafted',
          details: { subject: enrichment.email_subject },
        });

        results.push({ id: lead.id, status: finalStatus });
      } catch (err: any) {
        await supabase.from('leads').update({
          status: 'failed',
          error_message: err.message || 'Cron lead processing failed',
        }).eq('id', lead.id);

        results.push({ id: lead.id, status: 'failed', error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Cron processing error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
