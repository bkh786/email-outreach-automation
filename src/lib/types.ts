export type LeadStatus = 'pending' | 'enriching' | 'drafted' | 'approved' | 'sent' | 'failed';

export type EventType = 'uploaded' | 'researched' | 'drafted' | 'sent' | 'bounced' | 'opened';

export interface Profile {
  id: string;
  company_name: string;
  website_url?: string;
  services_offered: string[];
  target_markets: string[];
  unique_selling_proposition: string;
  strengths_and_certifications: string;
  email_signature: string;
  updated_at?: string;
}

export interface UserConfig {
  id: string;
  gemini_api_key?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_pass?: string;
  smtp_secure?: boolean;
  from_name?: string;
  from_email?: string;
  auto_send_enabled?: boolean;
  max_daily_emails?: number;
  max_hourly_rate?: number;
  updated_at?: string;
}

export interface Lead {
  id: string;
  user_id?: string;
  company_name: string;
  contact_person?: string;
  email: string;
  phone?: string;
  country?: string;
  website_url?: string;
  source?: string;
  company_profile?: string;
  financial_info?: string;
  email_subject?: string;
  email_body?: string;
  status: LeadStatus;
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

export interface CampaignLog {
  id: string;
  user_id?: string;
  lead_id?: string;
  event_type: EventType;
  details?: Record<string, any>;
  created_at: string;
  lead_company?: string;
}

export interface ScrapedData {
  url: string;
  title: string;
  description: string;
  bodyText: string;
  servicesFound: string[];
  locationsFound: string[];
  success: boolean;
  error?: string;
}

export interface AiEnrichmentResult {
  company_profile: string;
  financial_info: string;
  email_subject: string;
  email_body: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure?: boolean;
  fromName: string;
  fromEmail: string;
}
