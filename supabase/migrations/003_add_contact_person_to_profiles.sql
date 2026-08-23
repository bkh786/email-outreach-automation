-- Add contact_person column to public.profiles if it does not exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_person TEXT DEFAULT 'Operations Contact';
