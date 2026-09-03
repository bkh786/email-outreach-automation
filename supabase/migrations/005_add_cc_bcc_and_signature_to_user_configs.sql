-- Migration 005: Add CC, BCC and Email Signature columns to user_configs
-- Enables automated CC and BCC routing on outbound emails and centralized email signature

ALTER TABLE IF EXISTS public.user_configs 
ADD COLUMN IF NOT EXISTS cc_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cc_emails TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS bcc_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bcc_emails TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS email_signature TEXT DEFAULT '';

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
