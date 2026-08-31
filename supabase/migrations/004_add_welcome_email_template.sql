-- ==============================================================================
-- FreightPulse AI / MarketPulse: Migration 004 - Welcome Email Template for Super Admin
-- ==============================================================================

-- 1. Add welcome email template columns to user_configs table if not already present
ALTER TABLE public.user_configs 
ADD COLUMN IF NOT EXISTS welcome_email_subject TEXT DEFAULT 'Welcome to Your Logistics Outreach Portal — Access Credentials Inside';

ALTER TABLE public.user_configs 
ADD COLUMN IF NOT EXISTS welcome_email_template TEXT;
