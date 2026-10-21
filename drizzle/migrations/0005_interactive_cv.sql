ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS billing text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS education jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS experience jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE public.skill_endorsements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endorser_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill text NOT NULL CHECK (char_length(skill) BETWEEN 1 AND 80),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, endorser_id, skill),
  CHECK (profile_id <> endorser_id)
);
GRANT SELECT, INSERT, DELETE ON public.skill_endorsements TO authenticated;
GRANT ALL ON public.skill_endorsements TO service_role;
ALTER TABLE public.skill_endorsements ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_endorsements ON public.skill_endorsements FOR SELECT TO authenticated USING (true);
CREATE POLICY colleagues_endorse ON public.skill_endorsements FOR INSERT TO authenticated
  WITH CHECK (endorser_id = auth.uid() AND public.has_role(auth.uid(), 'aie') AND public.has_role(profile_id, 'aie'));
CREATE POLICY remove_own_endorsement ON public.skill_endorsements FOR DELETE TO authenticated USING (endorser_id = auth.uid());

CREATE TABLE public.family_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT '',
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1500),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, author_id)
);
GRANT SELECT, INSERT, DELETE ON public.family_reviews TO authenticated;
GRANT ALL ON public.family_reviews TO service_role;
ALTER TABLE public.family_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_reviews ON public.family_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY families_review ON public.family_reviews FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND public.has_role(auth.uid(), 'familia') AND public.has_role(profile_id, 'aie'));
CREATE POLICY remove_own_review ON public.family_reviews FOR DELETE TO authenticated USING (author_id = auth.uid());

UPDATE public.profiles SET
  name = 'Thiago Rivas', zone = 'CABA', billing = 'Monotributista',
  education = '[{"period":"2025 – Actualidad","title":"Licenciatura en Psicología — 2° año","place":"Universidad de Buenos Aires (UBA)"}]'::jsonb,
  experience = '[{"period":"2024 – Actualidad","title":"Acompañante Personal No Docente (APND)","place":"Nivel primario"}]'::jsonb,
  skills = ARRAY['Pictogramas','Adaptaciones pedagógicas','Comunicación aumentativa']
WHERE id = '82f99bd4-0d83-41d4-b213-d7bc5a0c0e3b';