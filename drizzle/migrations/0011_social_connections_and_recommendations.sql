CREATE TABLE IF NOT EXISTS public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester_id, receiver_id),
  CHECK (requester_id <> receiver_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.connections TO authenticated;
GRANT ALL ON public.connections TO service_role;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY read_connections ON public.connections FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY request_connection ON public.connections FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid() AND requester_id <> receiver_id);

CREATE POLICY update_connection ON public.connections FOR UPDATE TO authenticated
  USING (requester_id = auth.uid() OR receiver_id = auth.uid())
  WITH CHECK (requester_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY delete_connection ON public.connections FOR DELETE TO authenticated
  USING (requester_id = auth.uid() OR receiver_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT '',
  author_role text NOT NULL DEFAULT '',
  relationship_context text NOT NULL DEFAULT '',
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2500),
  highlighted_skills text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('pending_request', 'published', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (professional_id <> author_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommendations TO authenticated;
GRANT ALL ON public.recommendations TO service_role;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY read_recommendations ON public.recommendations FOR SELECT TO authenticated
  USING (status = 'published' OR professional_id = auth.uid() OR author_id = auth.uid());

CREATE POLICY insert_recommendations ON public.recommendations FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() OR professional_id = auth.uid());

CREATE POLICY update_recommendations ON public.recommendations FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR professional_id = auth.uid())
  WITH CHECK (author_id = auth.uid() OR professional_id = auth.uid());

CREATE POLICY delete_recommendations ON public.recommendations FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR professional_id = auth.uid());

DROP POLICY IF EXISTS colleagues_endorse ON public.skill_endorsements;
DROP POLICY IF EXISTS authenticated_endorse ON public.skill_endorsements;
CREATE POLICY authenticated_endorse ON public.skill_endorsements FOR INSERT TO authenticated
  WITH CHECK (endorser_id = auth.uid() AND endorser_id <> profile_id AND public.has_role(profile_id, 'aie'));

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link text NOT NULL DEFAULT '';
GRANT INSERT ON public.notifications TO authenticated;
DROP POLICY IF EXISTS authenticated_insert_notifications ON public.notifications;
CREATE POLICY authenticated_insert_notifications ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Seed / Mock Inicial para Thiago Rivas ('82f99bd4-0d83-41d4-b213-d7bc5a0c0e3b')
DO $$
DECLARE
  thiago_id uuid := '82f99bd4-0d83-41d4-b213-d7bc5a0c0e3b';
  other_id uuid := 'e44f8394-be2c-4cfe-a08c-35500f26a396';
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = thiago_id) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = other_id) THEN
    -- Solicitud de conexión pendiente hacia Thiago
    INSERT INTO public.connections (requester_id, receiver_id, status)
    VALUES (other_id, thiago_id, 'pending')
    ON CONFLICT (requester_id, receiver_id) DO NOTHING;

    -- Validaciones activas de aptitudes (+1)
    INSERT INTO public.skill_endorsements (profile_id, endorser_id, skill)
    VALUES
      (thiago_id, other_id, 'Pictogramas'),
      (thiago_id, other_id, 'Adaptaciones pedagógicas'),
      (thiago_id, other_id, 'Comunicación aumentativa')
    ON CONFLICT (profile_id, endorser_id, skill) DO NOTHING;

    -- Recomendación 1: Familia
    INSERT INTO public.recommendations (
      professional_id, author_id, author_name, author_role, relationship_context, content, highlighted_skills, status
    ) VALUES (
      thiago_id,
      other_id,
      'Familia Gómez',
      'familia',
      'Acompañó a nuestro hijo en 1° y 2° grado (2024–2025)',
      'Thiago demostró un compromiso y calidez excepcionales. Las adaptaciones pedagógicas y los pictogramas que diseñó marcaron una diferencia enorme en la integración escolar y en la alegría de nuestro hijo por ir al colegio cada mañana.',
      ARRAY['Pictogramas', 'Adaptaciones pedagógicas'],
      'published'
    );

    -- Recomendación 2: Centro (Instituto Horizonte)
    INSERT INTO public.recommendations (
      professional_id, author_id, author_name, author_role, relationship_context, content, highlighted_skills, status
    ) VALUES (
      thiago_id,
      other_id,
      'Instituto Horizonte',
      'centro',
      'Equipo de Integración Escolar (2023–2025)',
      'Excelente profesional, proactivo y con gran solvencia técnica en comunicación aumentativa y adaptaciones curriculares en el aula.',
      ARRAY['Comunicación aumentativa', 'Adaptaciones pedagógicas'],
      'published'
    );

    -- Notificación de prueba
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (
      thiago_id,
      'Nueva solicitud de conexión',
      'Tenés una nueva solicitud de conexión pendiente en tu red.',
      '/mi-red'
    );
  END IF;
END $$;
