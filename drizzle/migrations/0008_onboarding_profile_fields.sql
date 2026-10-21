ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS years_experience integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS institution_type text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact text NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD CONSTRAINT profiles_years_experience_range CHECK (years_experience BETWEEN 0 AND 60);
UPDATE public.profiles SET onboarded = true;
ALTER TABLE public.family_needs
  ADD COLUMN IF NOT EXISTS child_age integer,
  ADD COLUMN IF NOT EXISTS schooling text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS supports text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS shifts text NOT NULL DEFAULT '';
ALTER TABLE public.family_needs ADD CONSTRAINT family_needs_child_age_range CHECK (child_age IS NULL OR child_age BETWEEN 0 AND 25);