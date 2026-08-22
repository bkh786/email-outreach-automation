-- ==============================================================================
-- FreightPulse AI: Multi-Tenant Database Schema Migration
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (User & Self Brand Profile)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT DEFAULT 'Global Freight Dynamics Ltd.',
    website_url TEXT DEFAULT 'https://globalfreightdynamics.com',
    role TEXT DEFAULT 'client' CHECK (role IN ('super_admin', 'admin', 'client')),
    services_offered JSONB DEFAULT '["Air Freight Expedited", "Ocean FCL/LCL", "Customs Clearance", "Cold Chain Logistics", "DDP/DAP Solutions"]'::jsonb,
    target_markets TEXT[] DEFAULT ARRAY['USA', 'European Union', 'China', 'Southeast Asia', 'Middle East'],
    unique_selling_proposition TEXT DEFAULT 'Specialized in door-to-door transpacific air charter & expedited ocean consolidation with real-time GPS telemetry and guaranteed space allocations during peak seasons.',
    strengths_and_certifications TEXT DEFAULT 'IATA Cargo Agent, FIATA Member, WCA First-Tier Partner (ID: 88421), Bonded CFS Warehouse in LAX & FRA, ISO 9001:2015 Certified.',
    email_signature TEXT DEFAULT E'Best regards,\n\nOperations & Trade Lane Development Team\nGlobal Freight Dynamics\nDirect: +1 (555) 019-4820 | ops@globalfreightdynamics.com\nwww.globalfreightdynamics.com',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. USER_CONFIGS (Settings & API Credentials - BYOK & SMTP)
CREATE TABLE IF NOT EXISTS public.user_configs (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    gemini_api_key TEXT,
    smtp_host TEXT DEFAULT 'smtp.gmail.com',
    smtp_port INTEGER DEFAULT 587,
    smtp_user TEXT,
    smtp_pass TEXT,
    smtp_secure BOOLEAN DEFAULT false,
    from_name TEXT DEFAULT 'FreightPulse Operations',
    from_email TEXT DEFAULT 'outreach@freightpulse.ai',
    auto_send_enabled BOOLEAN DEFAULT false,
    max_daily_emails INTEGER DEFAULT 50,
    max_hourly_rate INTEGER DEFAULT 15,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. LEADS (Prospect Database & Enrichment State)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    country TEXT,
    website_url TEXT,
    source TEXT DEFAULT 'manual_upload',
    company_profile TEXT,
    financial_info TEXT,
    email_subject TEXT,
    email_body TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'enriching', 'drafted', 'approved', 'sent', 'failed')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CAMPAIGN_LOGS (KPI & Event Tracking)
CREATE TABLE IF NOT EXISTS public.campaign_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('uploaded', 'researched', 'drafted', 'sent', 'bounced', 'opened')),
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_user_id ON public.campaign_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_created_at ON public.campaign_logs(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for User Configs
CREATE POLICY "Users can view own configs" ON public.user_configs
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own configs" ON public.user_configs
    FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own configs" ON public.user_configs
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for Leads
CREATE POLICY "Users can view own leads" ON public.leads
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own leads" ON public.leads
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leads" ON public.leads
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own leads" ON public.leads
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Campaign Logs
CREATE POLICY "Users can view own logs" ON public.campaign_logs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON public.campaign_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Automatic Profile & User Config initialization on User Signup Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, company_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Freight Agency'));

    INSERT INTO public.user_configs (id, from_email, from_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Freight Operations'));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when auth.users row is inserted
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
