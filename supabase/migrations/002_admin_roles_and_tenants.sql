-- ==============================================================================
-- FreightPulse AI: Migration 002 - Super Admin & Tenant Roles
-- ==============================================================================

-- 1. Add role column to profiles table if it doesn't already exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client' CHECK (role IN ('super_admin', 'admin', 'client'));

-- 2. Allow Super Admins to view and manage all profiles, configs, leads, and logs
CREATE POLICY "Super Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Super Admins can view all leads" ON public.leads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Super Admins can view all user configs" ON public.user_configs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Super Admins can view all campaign logs" ON public.campaign_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
        )
    );
