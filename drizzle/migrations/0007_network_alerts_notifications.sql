CREATE TABLE public.saved_profiles (
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, profile_id),
  CHECK (owner_id <> profile_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_profiles TO authenticated;
GRANT ALL ON public.saved_profiles TO service_role;
ALTER TABLE public.saved_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_own_saved ON public.saved_profiles FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY save_profiles ON public.saved_profiles FOR INSERT TO authenticated WITH CHECK (
  owner_id = auth.uid()
  AND (public.has_role(auth.uid(), 'centro') OR public.has_role(auth.uid(), 'familia'))
  AND public.has_role(profile_id, 'aie'));
CREATE POLICY unsave_profiles ON public.saved_profiles FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE TABLE public.job_alerts (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  zones text[] NOT NULL DEFAULT '{}',
  levels text[] NOT NULL DEFAULT '{}',
  tools text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_alerts TO authenticated;
GRANT ALL ON public.job_alerts TO service_role;
ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_alerts ON public.job_alerts FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'aie'));

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE (read_at) ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_own_notifications ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY mark_own_notifications ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

CREATE OR REPLACE FUNCTION public.notify_job_alerts() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT NEW.active THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (user_id, title, body, job_id)
  SELECT a.user_id, '¡Nueva alerta!',
    format('%s acaba de publicar una vacante que coincide con tu perfil (%s).', NEW.organization, NEW.zone),
    NEW.id
  FROM public.job_alerts a
  WHERE a.user_id <> NEW.owner_id
    AND cardinality(a.zones) + cardinality(a.levels) + cardinality(a.tools) > 0
    AND (cardinality(a.zones) = 0 OR EXISTS (SELECT 1 FROM unnest(a.zones) z WHERE lower(z) = lower(NEW.zone)))
    AND (cardinality(a.levels) = 0 OR EXISTS (SELECT 1 FROM unnest(a.levels) l
      WHERE (NEW.title || ' ' || NEW.description || ' ' || array_to_string(NEW.skills, ' ')) ILIKE '%' || l || '%'))
    AND (cardinality(a.tools) = 0 OR EXISTS (SELECT 1 FROM unnest(a.tools) t, unnest(NEW.skills) s WHERE lower(s) = lower(t)));
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.notify_job_alerts() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_job_published AFTER INSERT ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.notify_job_alerts();

INSERT INTO public.saved_profiles (owner_id, profile_id)
SELECT '82f99bd4-0d83-41d4-b213-d7bc5a0c0e3b', 'e44f8394-be2c-4cfe-a08c-35500f26a396'
WHERE EXISTS (SELECT 1 FROM public.profiles WHERE id = '82f99bd4-0d83-41d4-b213-d7bc5a0c0e3b')
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = 'e44f8394-be2c-4cfe-a08c-35500f26a396')
ON CONFLICT DO NOTHING;
INSERT INTO public.job_alerts (user_id, zones, levels, tools)
SELECT 'e44f8394-be2c-4cfe-a08c-35500f26a396', '{CABA}', '{Nivel Primario}', '{Pictogramas}'
WHERE EXISTS (SELECT 1 FROM public.profiles WHERE id = 'e44f8394-be2c-4cfe-a08c-35500f26a396')
ON CONFLICT DO NOTHING;
INSERT INTO public.notifications (user_id, title, body, job_id)
SELECT 'e44f8394-be2c-4cfe-a08c-35500f26a396', '¡Nueva alerta!',
  'El Instituto Horizonte acaba de publicar una vacante que coincide con tu perfil (CABA, Nivel Primario).',
  (SELECT id FROM public.jobs WHERE organization = 'Instituto Horizonte' ORDER BY created_at LIMIT 1)
WHERE EXISTS (SELECT 1 FROM public.profiles WHERE id = 'e44f8394-be2c-4cfe-a08c-35500f26a396');