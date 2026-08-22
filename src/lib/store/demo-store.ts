import { Lead, Profile, UserConfig, CampaignLog } from '../types';

export const DEFAULT_PROFILE: Profile = {
  id: 'demo-user-1',
  company_name: 'Vanguard Global Logistics Ltd.',
  website_url: 'https://vanguardgloballogistics.com',
  services_offered: [
    'Transpacific Ocean FCL/LCL',
    'Expedited Air Freight Charters',
    'Bonded CFS & Warehousing',
    'Automated Customs Clearance',
    'Project Cargo & Oversized Freight'
  ],
  target_markets: [
    'Asia -> North America',
    'Europe -> North America',
    'Southeast Asia Transshipment',
    'Middle East Corridors'
  ],
  unique_selling_proposition: 'Guaranteed peak season allocations, real-time GPS container tracking, dedicated trade lane managers, and transparent tier-1 carrier contracts.',
  strengths_and_certifications: 'IATA Cargo Agent, FIATA Verified, WCA Partner (ID: 92834), C-TPAT Tier 2 Certified, Bonded CFS Warehouse in LAX & Chicago.',
  email_signature: `Best regards,

Alexander Wright | VP of Global Trade Lane Development
Vanguard Global Logistics Ltd.
Direct: +1 (310) 555-0149 | Cell: +1 (310) 555-0150
alexander.wright@vanguardgloballogistics.com
www.vanguardgloballogistics.com`,
  updated_at: new Date().toISOString(),
};

export const DEFAULT_USER_CONFIG: UserConfig = {
  id: 'demo-user-1',
  gemini_api_key: '',
  smtp_host: 'smtp.gmail.com',
  smtp_port: 587,
  smtp_user: 'outreach@vanguardgloballogistics.com',
  smtp_pass: '',
  smtp_secure: false,
  from_name: 'Alexander Wright | Vanguard Logistics',
  from_email: 'outreach@vanguardgloballogistics.com',
  auto_send_enabled: false,
  max_daily_emails: 50,
  max_hourly_rate: 15,
  updated_at: new Date().toISOString(),
};

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    company_name: 'Apex Transpacific Cargo',
    contact_person: 'Marcus Chen',
    email: 'mchen@apextranspacific.com',
    phone: '+1 (415) 890-2134',
    country: 'United States',
    website_url: 'https://apextranspacific.com',
    source: 'jctrans',
    company_profile: 'Mid-sized ocean consolidator operating between Shenzhen/Shanghai and West Coast USA ports with 45,000 TEU annual throughput.',
    financial_info: 'Estimated 120 employees, 3 regional CFS facilities, Class-A NVOCC license.',
    email_subject: 'Transpacific rate benchmarks & guaranteed space for Apex Transpacific Cargo',
    email_body: `Hi Marcus,

I came across Apex Transpacific's active ocean consolidation volume across the Shenzhen-LAX lane. Given recent West Coast port congestion and spot rate spikes, I wanted to reach out.

At Vanguard Global Logistics, we hold dedicated block-space agreements (BSAs) on tier-1 ocean alliances and operate our own bonded CFS facility adjacent to LAX. We have helped fellow NVOCCs cut transpacific dwell time by 3.5 days while locking in predictable quarterly capacity.

Would you be open to a 10-minute touchpoint this Thursday to review our updated Q3 transpacific contract rates?

Best regards,
Alexander Wright
Vanguard Global Logistics Ltd.`,
    status: 'drafted',
    created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
  },
  {
    id: 'lead-2',
    company_name: 'Bavaria Forwarding GmbH',
    contact_person: 'Klaus Becker',
    email: 'k.becker@bavariaforwarding.de',
    phone: '+49 89 4590 120',
    country: 'Germany',
    website_url: 'https://bavariaforwarding.de',
    source: 'csv_import',
    company_profile: 'Munich-based European road freight and air charter broker specializing in automotive and industrial machinery.',
    financial_info: 'Annual logistics turnover ~€38M, fleet of 65 Euro-6 trailers, IATA certified.',
    email_subject: 'Direct transatlantic air capacity & bonded CFS in LAX/ORD for Bavaria Forwarding',
    email_body: `Hi Klaus,

I noticed Bavaria Forwarding's strong specialization in German automotive machinery and transatlantic air freight routing.

At Vanguard Global Logistics, we operate direct bonded CFS facilities in LAX and Chicago O'Hare with same-day customs release for expedited industrial cargo. As an IATA & WCA partner, we frequently act as the premier North American destination agent for leading German forwarders.

Could we schedule a brief call this week to discuss sharing mutual agency tariffs for your North American imports?

Best regards,
Alexander Wright
Vanguard Global Logistics Ltd.`,
    status: 'approved',
    created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
  },
  {
    id: 'lead-3',
    company_name: 'SinoTech Global Supply Chain',
    contact_person: 'Wei Zhang',
    email: 'zhang.wei@sinotech-logistics.cn',
    phone: '+86 755 8320 9988',
    country: 'China',
    website_url: 'https://sinotech-logistics.cn',
    source: 'manual_upload',
    company_profile: 'Shenzhen e-commerce logistics specialist managing cross-border B2C fulfillment and weekly air charters to North America.',
    financial_info: 'Operates 80,000 sq ft smart warehouse in Baoan, handles ~150 tons weekly air freight.',
    email_subject: 'DDP solution & expedited deconsolidation for SinoTech in North America',
    email_body: `Hi Wei,

I came across SinoTech's impressive cross-border e-commerce air charter operations out of Shenzhen.

With Section 321 customs regulations evolving rapidly in the US, Vanguard Global Logistics provides automated type-86 customs clearance and nationwide last-mile sortation hubs. We ensure your e-commerce parcels clear within 4 hours of touchdown at LAX.

Are you available for a brief WeChat or Zoom discussion next Tuesday to explore how our US handling can accelerate your parcel transit?

Best regards,
Alexander Wright
Vanguard Global Logistics Ltd.`,
    status: 'sent',
    sent_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
  },
  {
    id: 'lead-4',
    company_name: 'Emirates Intermodal Logistics',
    contact_person: 'Tariq Al-Mansoor',
    email: 'tariq@emiratesintermodal.ae',
    phone: '+971 4 881 9023',
    country: 'United Arab Emirates',
    website_url: 'https://emiratesintermodal.ae',
    source: 'jctrans',
    status: 'pending',
    created_at: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
  },
  {
    id: 'lead-5',
    company_name: 'Nordic Cold Chain AB',
    contact_person: 'Astrid Lindqvist',
    email: 'astrid@nordiccoldchain.se',
    phone: '+46 31 790 4410',
    country: 'Sweden',
    website_url: 'https://nordiccoldchain.se',
    source: 'csv_import',
    status: 'pending',
    created_at: new Date(Date.now() - 3600 * 1000 * 14).toISOString(),
  },
  {
    id: 'lead-6',
    company_name: 'Tokyo Sky Express KK',
    contact_person: 'Kenji Sato',
    email: 'sato.kenji@tokyoskyexpress.jp',
    phone: '+81 3 5400 8821',
    country: 'Japan',
    website_url: 'https://tokyoskyexpress.jp',
    source: 'manual_upload',
    status: 'pending',
    created_at: new Date(Date.now() - 3600 * 1000 * 20).toISOString(),
  }
];

export const INITIAL_LOGS: CampaignLog[] = [
  {
    id: 'log-1',
    lead_id: 'lead-3',
    event_type: 'sent',
    lead_company: 'SinoTech Global Supply Chain',
    details: { subject: 'DDP solution & expedited deconsolidation for SinoTech in North America' },
    created_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
  },
  {
    id: 'log-2',
    lead_id: 'lead-2',
    event_type: 'drafted',
    lead_company: 'Bavaria Forwarding GmbH',
    details: { model: 'gemini-1.5-flash', confidence: 0.94 },
    created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
  },
  {
    id: 'log-3',
    lead_id: 'lead-1',
    event_type: 'researched',
    lead_company: 'Apex Transpacific Cargo',
    details: { pagesCrawled: 1, keywordsFound: ['ocean freight', 'fcl', 'customs clearance'] },
    created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
  },
  {
    id: 'log-4',
    event_type: 'uploaded',
    lead_company: 'Bulk CSV Batch Import',
    details: { count: 6, format: 'CSV' },
    created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
  }
];
