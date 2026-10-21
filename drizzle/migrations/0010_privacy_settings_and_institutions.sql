ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS dni text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS exact_location text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS privacy_settings jsonb NOT NULL DEFAULT '{"show_phone":true,"show_dni":false,"show_exact_location":false,"public_profile_visible":true,"family_needs_visibility":"private","show_contact":true}'::jsonb;

ALTER TABLE public.family_needs
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'network_only', 'applied_professionals'));

GRANT UPDATE (phone, dni, exact_location, privacy_settings) ON public.profiles TO authenticated;
GRANT UPDATE (visibility) ON public.family_needs TO authenticated;
