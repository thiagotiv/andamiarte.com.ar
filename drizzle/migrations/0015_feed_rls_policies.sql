-- Migración 0015: Políticas RLS Robustas para Interacciones del Feed Social y Red
-- (post_likes, post_comments, post_shares, connections)

-- 1. Asegurar RLS habilitado en todas las tablas de interacciones
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- 2. Otorgar permisos de roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_likes TO authenticated;
GRANT SELECT ON public.post_likes TO anon;
GRANT ALL ON public.post_likes TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_comments TO authenticated;
GRANT SELECT ON public.post_comments TO anon;
GRANT ALL ON public.post_comments TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_shares TO authenticated;
GRANT SELECT ON public.post_shares TO anon;
GRANT ALL ON public.post_shares TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.connections TO authenticated;
GRANT SELECT ON public.connections TO anon;
GRANT ALL ON public.connections TO service_role;

-- 3. POLÍTICAS RLS PARA LIKES (post_likes)
DROP POLICY IF EXISTS read_post_likes ON public.post_likes;
CREATE POLICY read_post_likes ON public.post_likes
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS insert_post_likes ON public.post_likes;
CREATE POLICY insert_post_likes ON public.post_likes
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.role() = 'authenticated' AND (user_id = auth.uid() OR auth.uid() IS NOT NULL)
  );

DROP POLICY IF EXISTS update_post_likes ON public.post_likes;
CREATE POLICY update_post_likes ON public.post_likes
  FOR UPDATE TO authenticated
  USING (auth.role() = 'authenticated' AND user_id = auth.uid())
  WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS delete_post_likes ON public.post_likes;
CREATE POLICY delete_post_likes ON public.post_likes
  FOR DELETE TO authenticated
  USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- 4. POLÍTICAS RLS PARA COMENTARIOS (post_comments)
DROP POLICY IF EXISTS read_post_comments ON public.post_comments;
CREATE POLICY read_post_comments ON public.post_comments
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS insert_post_comments ON public.post_comments;
CREATE POLICY insert_post_comments ON public.post_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.role() = 'authenticated' AND (author_id = auth.uid() OR auth.uid() IS NOT NULL)
  );

DROP POLICY IF EXISTS update_post_comments ON public.post_comments;
CREATE POLICY update_post_comments ON public.post_comments
  FOR UPDATE TO authenticated
  USING (auth.role() = 'authenticated' AND author_id = auth.uid())
  WITH CHECK (auth.role() = 'authenticated' AND author_id = auth.uid());

DROP POLICY IF EXISTS delete_post_comments ON public.post_comments;
CREATE POLICY delete_post_comments ON public.post_comments
  FOR DELETE TO authenticated
  USING (auth.role() = 'authenticated' AND author_id = auth.uid());

-- 5. POLÍTICAS RLS PARA COMPARTIDOS (post_shares)
DROP POLICY IF EXISTS read_post_shares ON public.post_shares;
CREATE POLICY read_post_shares ON public.post_shares
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS insert_post_shares ON public.post_shares;
CREATE POLICY insert_post_shares ON public.post_shares
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.role() = 'authenticated' AND (user_id = auth.uid() OR auth.uid() IS NOT NULL)
  );

DROP POLICY IF EXISTS delete_post_shares ON public.post_shares;
CREATE POLICY delete_post_shares ON public.post_shares
  FOR DELETE TO authenticated
  USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- 6. POLÍTICAS RLS PARA CONEXIONES (connections)
DROP POLICY IF EXISTS read_connections ON public.connections;
CREATE POLICY read_connections ON public.connections
  FOR SELECT TO authenticated
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS request_connection ON public.connections;
CREATE POLICY request_connection ON public.connections
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.role() = 'authenticated' AND (requester_id = auth.uid() OR auth.uid() IS NOT NULL) AND requester_id <> receiver_id
  );

DROP POLICY IF EXISTS update_connection ON public.connections;
CREATE POLICY update_connection ON public.connections
  FOR UPDATE TO authenticated
  USING (auth.role() = 'authenticated' AND (requester_id = auth.uid() OR receiver_id = auth.uid()))
  WITH CHECK (auth.role() = 'authenticated' AND (requester_id = auth.uid() OR receiver_id = auth.uid()));

DROP POLICY IF EXISTS delete_connection ON public.connections;
CREATE POLICY delete_connection ON public.connections
  FOR DELETE TO authenticated
  USING (auth.role() = 'authenticated' AND (requester_id = auth.uid() OR receiver_id = auth.uid()));

-- 7. Vistas de compatibilidad (likes y comments) por si se referencian sin prefijo
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'likes') THEN
    CREATE VIEW public.likes AS SELECT * FROM public.post_likes;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.likes TO authenticated;
    GRANT SELECT ON public.likes TO anon;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN
    CREATE VIEW public.comments AS SELECT * FROM public.post_comments;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
    GRANT SELECT ON public.comments TO anon;
  END IF;
END $$;
