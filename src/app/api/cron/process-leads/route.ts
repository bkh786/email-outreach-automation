import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { scrapeWebsite } from '@/lib/scraper';
import { enrichLeadWithGemini } from '@/lib/gemini';
import { sendEmail } from '@/lib/mailer';
import { LeadStatus } from '@/lib/types';

export const maxDuration = 60; // 60 seconds max execution on Vercel

export async function GET(req: NextRequest) {
  // Allow manual trigger, Vercel Cron, or user-scoped background trigger
  const authHeader = req.headers.get('authorization');
  const isVercelCron = req.headers.get('x-vercel-cron') !== null;
  const cronSecret = process.env.CRON_SECRET;
  const urlSecret = req.nextUrl.searchParams.get('secret');
  const userIdParam = req.nextUrl.searchParams.get('userId');

  if (cronSecret && process.env.NODE_ENV === 'production') {
    const isAuthorized =
      isVercelCron ||
      authHeader === `Bearer ${cronSecret}` ||
      urlSecret === cronSecret ||
      Boolean(userIdParam);

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }
  }

  const supabase = createAdminClient();
  const batchSize = 15;

  try {
    // 1. Fetch pending leads without fragile foreign key joins
    let query = supabase
      .from('leads')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (userIdParam) {
      query = query.eq('user_id', userIdParam);
    }

    const { data: pendingLeads, error: leadsError } = await query;

    if (leadsError) {
      console.warn('Query for pending leads failed:', leadsError.message);
      return NextResponse.json({
        success: true,
        message: 'Cron triggered (error querying pending leads or Supabase not linked)',
        error: leadsError.message,
        processed: 0,
      });
    }

    const results: Array<{ id: string; status: string; company?: string; error?: string }> = [];

    // Cache profiles and configs by user_id to avoid repeated roundtrips
    const userCache = new Map<string, {
      profile: any;
      config: any;
      sentLastHour: number;
      sentLast24Hours: number;
    }>();

    const fetchUserData = async (userId: string) => {
      if (userCache.has(userId)) return userCache.get(userId)!;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const { data: config } = await supabase
        .from('user_configs')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Check throttle: count emails sent in past 60 minutes
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count: sentLastHour } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'sent')
        .gte('sent_at', oneHourAgo);

      // Check safeguard: count emails sent in past 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: sentLast24Hours } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'sent')
        .gte('sent_at', twentyFourHoursAgo);

      const data = {
        profile: profile || {},
        config: config || {},
        sentLastHour: sentLastHour ?? 0,
        sentLast24Hours: sentLast24Hours ?? 0,
      };

      userCache.set(userId, data);
      return data;
    };

    // Process pending leads
    if (pendingLeads && pendingLeads.length > 0) {
      for (const lead of pendingLeads) {
        const userId = lead.user_id;
        if (!userId) continue;

        try {
          // Mark status as enriching
          await supabase.from('leads').update({ status: 'enriching' }).eq('id', lead.id);

          const userData = await fetchUserData(userId);
          const userProfile = userData.profile;
          const userConfig = userData.config;

          const maxHourlyRate = userConfig.max_hourly_rate && userConfig.max_hourly_rate > 0
            ? Number(userConfig.max_hourly_rate)
            : 15;
          const maxDailyEmails = userConfig.max_daily_emails && userConfig.max_daily_emails > 0
            ? Number(userConfig.max_daily_emails)
            : 100;

          const isHourlyThrottled = userData.sentLastHour >= maxHourlyRate;
          const isDailyThrottled = userData.sentLast24Hours >= maxDailyEmails;

          // 2. Scrape website if available
          let scrapedData = null;
          if (lead.website_url) {
            try {
              scrapedData = await scrapeWebsite(lead.website_url);
            } catch (err: any) {
              console.warn(`Scrape error for ${lead.website_url}:`, err.message);
            }
          }

          // 3. AI Enrichment with synchronized profile and signature
          const effectiveProfile = {
            ...userProfile,
            email_signature: userProfile?.email_signature || userConfig?.email_signature || '',
            portfolio_url: userProfile?.portfolio_url || userConfig?.portfolio_url || userConfig?.['portfolio-link'] || '',
          };

          const enrichment = await enrichLeadWithGemini(
            lead,
            scrapedData,
            effectiveProfile,
            userConfig.gemini_api_key
          );

          let finalStatus: LeadStatus = 'drafted';
          let sentAt: string | null = null;
          let sendErrorMessage: string | null = null;

          // 4. Autonomous Dispatch with Hourly Throttle Enforcement
          if (userConfig.auto_send_enabled) {
            if (isHourlyThrottled) {
              finalStatus = 'approved';
              sendErrorMessage = `Hourly dispatch throttle active (${userData.sentLastHour}/${maxHourlyRate} sent in past hour). Queued for next window.`;
            } else if (isDailyThrottled) {
              finalStatus = 'approved';
              sendErrorMessage = `Daily limit safeguard active (${userData.sentLast24Hours}/${maxDailyEmails} sent in past 24h). Queued for next window.`;
            } else if (userConfig.smtp_host && userConfig.smtp_user && userConfig.smtp_pass) {
              const smtpConfig = {
                host: userConfig.smtp_host,
                port: userConfig.smtp_port || 587,
                user: userConfig.smtp_user,
                pass: userConfig.smtp_pass,
                secure: userConfig.smtp_secure ?? false,
                fromName: userConfig.from_name || userProfile.company_name || 'Freight Operations',
                fromEmail: userConfig.from_email || userConfig.smtp_user,
                cc_enabled: userConfig.cc_enabled !== undefined ? Boolean(userConfig.cc_enabled) : Boolean((userConfig.cc_emails || userConfig['Cc-Email'])?.trim()),
                cc_emails: userConfig.cc_emails || userConfig['Cc-Email'] || '',
                bcc_enabled: userConfig.bcc_enabled !== undefined ? Boolean(userConfig.bcc_enabled) : Boolean((userConfig.bcc_emails || userConfig['Bcc-Email'])?.trim()),
                bcc_emails: userConfig.bcc_emails || userConfig['Bcc-Email'] || '',
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
                userData.sentLastHour++;
                userData.sentLast24Hours++;
              } else {
                finalStatus = 'failed';
                sendErrorMessage = sendResult.error || 'SMTP delivery failed';
              }
            } else {
              finalStatus = 'approved';
              sendErrorMessage = 'Autonomous dispatch paused: configure SMTP credentials in Settings to enable live sending.';
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
            error_message: sendErrorMessage,
          }).eq('id', lead.id);

          // 6. Record log
          await supabase.from('campaign_logs').insert({
            user_id: lead.user_id,
            lead_id: lead.id,
            event_type: finalStatus === 'sent' ? 'sent' : 'drafted',
            details: {
              subject: enrichment.email_subject,
              auto_dispatched: finalStatus === 'sent',
              throttled: isHourlyThrottled || isDailyThrottled,
            },
          });

          results.push({ id: lead.id, status: finalStatus, company: lead.company_name });
        } catch (err: any) {
          await supabase.from('leads').update({
            status: 'failed',
            error_message: err.message || 'Cron lead processing error',
          }).eq('id', lead.id);

          results.push({ id: lead.id, status: 'failed', company: lead.company_name, error: err.message });
        }
      }
    }

    // 7. Pick up approved leads waiting for dispatch once throttle opens
    if (results.length < batchSize) {
      let approvedQuery = supabase
        .from('leads')
        .select('*')
        .eq('status', 'approved')
        .is('sent_at', null)
        .order('created_at', { ascending: true })
        .limit(batchSize - results.length);

      if (userIdParam) {
        approvedQuery = approvedQuery.eq('user_id', userIdParam);
      }

      const { data: approvedLeads } = await approvedQuery;
      if (approvedLeads && approvedLeads.length > 0) {
        for (const lead of approvedLeads) {
          const userId = lead.user_id;
          if (!userId) continue;

          try {
            const userData = await fetchUserData(userId);
            const userConfig = userData.config;
            const userProfile = userData.profile;

            const maxHourlyRate = userConfig.max_hourly_rate && userConfig.max_hourly_rate > 0
              ? Number(userConfig.max_hourly_rate)
              : 15;
            const maxDailyEmails = userConfig.max_daily_emails && userConfig.max_daily_emails > 0
              ? Number(userConfig.max_daily_emails)
              : 100;

            if (userData.sentLastHour >= maxHourlyRate || userData.sentLast24Hours >= maxDailyEmails) {
              continue; // Still throttled
            }

            if (userConfig.auto_send_enabled && userConfig.smtp_host && userConfig.smtp_user && userConfig.smtp_pass && lead.email_subject && lead.email_body) {
              const smtpConfig = {
                host: userConfig.smtp_host,
                port: userConfig.smtp_port || 587,
                user: userConfig.smtp_user,
                pass: userConfig.smtp_pass,
                secure: userConfig.smtp_secure ?? false,
                fromName: userConfig.from_name || userProfile.company_name || 'Freight Operations',
                fromEmail: userConfig.from_email || userConfig.smtp_user,
                cc_enabled: userConfig.cc_enabled !== undefined ? Boolean(userConfig.cc_enabled) : Boolean((userConfig.cc_emails || userConfig['Cc-Email'])?.trim()),
                cc_emails: userConfig.cc_emails || userConfig['Cc-Email'] || '',
                bcc_enabled: userConfig.bcc_enabled !== undefined ? Boolean(userConfig.bcc_enabled) : Boolean((userConfig.bcc_emails || userConfig['Bcc-Email'])?.trim()),
                bcc_emails: userConfig.bcc_emails || userConfig['Bcc-Email'] || '',
              };

              const sendResult = await sendEmail({
                config: smtpConfig,
                to: lead.email,
                subject: lead.email_subject,
                body: lead.email_body,
              });

              if (sendResult.success) {
                const sentAt = new Date().toISOString();
                userData.sentLastHour++;
                userData.sentLast24Hours++;

                await supabase.from('leads').update({
                  status: 'sent',
                  sent_at: sentAt,
                  error_message: null,
                }).eq('id', lead.id);

                await supabase.from('campaign_logs').insert({
                  user_id: lead.user_id,
                  lead_id: lead.id,
                  event_type: 'sent',
                  details: { subject: lead.email_subject, auto_dispatched: true, source: 'approved_queue' },
                });

                results.push({ id: lead.id, status: 'sent', company: lead.company_name });
              }
            }
          } catch (err: any) {
            console.error(`Error auto-dispatching approved lead ${lead.id}:`, err);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error('Process leads cron error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Cron processing exception' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
