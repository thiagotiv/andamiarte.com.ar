ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS experience_years integer NOT NULL DEFAULT 0 CHECK (experience_years >= 0 AND experience_years <= 60),
  ADD COLUMN IF NOT EXISTS institution_kind text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact text NOT NULL DEFAULT '';

GRANT UPDATE (billing, education, experience, experience_years, institution_kind, contact)
  ON public.profiles TO authenticated;

ALTER TABLE public.family_needs
  ADD COLUMN IF NOT EXISTS child_age text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS schooling text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS supports text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS schedule text NOT NULL DEFAULT '';
