-- Migración 0012: Contenido Enriquecido en Comunidad y Métricas / Profile Analytics

-- 1. Ampliación de posts con adjuntos, encuestas y etiquetas
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS poll_data jsonb,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

GRANT UPDATE ON public.posts TO authenticated;
DROP POLICY IF EXISTS update_posts ON public.posts;
CREATE POLICY update_posts ON public.posts FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. Métricas y Estadísticas (Profile Views)
CREATE TABLE IF NOT EXISTS public.profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  viewer_role text NOT NULL DEFAULT 'anon',
  viewer_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.profile_views TO authenticated;
GRANT ALL ON public.profile_views TO service_role;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY read_own_profile_views ON public.profile_views FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY record_profile_view ON public.profile_views FOR INSERT TO authenticated
  WITH CHECK (true);

-- 3. Métricas y Estadísticas (Search Appearances)
CREATE TABLE IF NOT EXISTS public.search_appearances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tag text NOT NULL,
  query text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.search_appearances TO authenticated;
GRANT ALL ON public.search_appearances TO service_role;
ALTER TABLE public.search_appearances ENABLE ROW LEVEL SECURITY;

CREATE POLICY read_own_search_appearances ON public.search_appearances FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY record_search_appearance ON public.search_appearances FOR INSERT TO authenticated
  WITH CHECK (true);

-- 4. Seed de datos de prueba para Comunidad y Métricas
DO $$
DECLARE
  thiago_id uuid := '82f99bd4-0d83-41d4-b213-d7bc5a0c0e3b';
  sofia_id uuid := 'e44f8394-be2c-4cfe-a08c-35500f26a396';
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = sofia_id) THEN
    -- Post con recurso PDF descargable
    INSERT INTO public.posts (
      author_id, author_name, content, kind, attachment_url, attachment_name, attachment_type, tags
    ) VALUES (
      sofia_id,
      'Lic. Sofía Albarracín',
      'Les comparto este material que armé para facilitar la anticipación de la jornada escolar y el pasaje entre materias en primer ciclo. Incluye secuencias de inicio, recreo y despedida listas para imprimir y plastificar.',
      'recurso',
      '/docs/guia-anticipacion-visual-pictogramas.pdf',
      'Guía práctica de anticipación visual y pictogramas para Nivel Primario.pdf',
      'application/pdf',
      ARRAY['#RecursoPedagógico', '#Pictogramas', '#InclusiónÁulica']
    );
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = thiago_id) THEN
    -- Post con encuesta interactiva
    INSERT INTO public.posts (
      author_id, author_name, content, kind, poll_data, tags
    ) VALUES (
      thiago_id,
      'Thiago Rivas',
      'Abrimos debate para acompañantes y docentes de primer ciclo: ¿qué estrategia les ha dado mejores resultados para anticipar los cambios de actividad sin generar ansiedad en el aula?',
      'encuesta',
      '{"question": "¿Qué herramienta les resulta más efectiva para la transición entre actividades en primer ciclo?", "options": [{"id": "opt-1", "text": "Reloj de arena / Temporizador visual", "votes": 14}, {"id": "opt-2", "text": "Canción o rima de transición", "votes": 9}, {"id": "opt-3", "text": "Pictograma paso a paso", "votes": 22}], "voters": {}}'::jsonb,
      ARRAY['#Debate', '#EstrategiasAula', '#InclusiónÁulica']
    );

    -- Vistas de perfil para Thiago Rivas
    INSERT INTO public.profile_views (profile_id, viewer_role, viewer_name, created_at)
    VALUES
      (thiago_id, 'centro', 'Instituto Horizonte', now() - interval '1 day'),
      (thiago_id, 'centro', 'Instituto Horizonte', now() - interval '2 days'),
      (thiago_id, 'familia', 'Familia de Palermo (CABA)', now() - interval '3 days'),
      (thiago_id, 'familia', 'Familia Gómez', now() - interval '4 days'),
      (thiago_id, 'centro', 'Colegio San Martín', now() - interval '5 days'),
      (thiago_id, 'aie', 'Colega AIE de Belgrano', now() - interval '6 days');

    -- Apariciones en búsquedas para Thiago Rivas
    INSERT INTO public.search_appearances (profile_id, tag, query)
    VALUES
      (thiago_id, 'Pictogramas', 'pictogramas primer ciclo'),
      (thiago_id, 'CABA', 'acompañante escolar caba'),
      (thiago_id, 'Adaptaciones pedagógicas', 'adaptaciones curriculares'),
      (thiago_id, 'Pictogramas', 'herramientas tea'),
      (thiago_id, 'CABA', 'aie palermo');
  END IF;
END $$;
