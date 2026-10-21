-- Migración 0014: Feed Social de Alto Impacto (Likes, Comentarios Anidados, Compartir/Reposts)

-- 1. Columnas de contadores en posts
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shares_count integer NOT NULL DEFAULT 0;

-- 2. Tabla de Me Gusta / Reacciones
CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL DEFAULT 'like',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.post_likes TO authenticated;
GRANT SELECT ON public.post_likes TO anon;
GRANT ALL ON public.post_likes TO service_role;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS read_post_likes ON public.post_likes;
CREATE POLICY read_post_likes ON public.post_likes FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS insert_post_likes ON public.post_likes;
CREATE POLICY insert_post_likes ON public.post_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS delete_post_likes ON public.post_likes;
CREATE POLICY delete_post_likes ON public.post_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS post_likes_user_id ON public.post_likes(user_id);

-- 3. Tabla de Comentarios y Respuestas Anidadas
CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_role text NOT NULL DEFAULT 'aie',
  author_avatar text,
  content text NOT NULL,
  parent_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_comments TO authenticated;
GRANT SELECT ON public.post_comments TO anon;
GRANT ALL ON public.post_comments TO service_role;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS read_post_comments ON public.post_comments;
CREATE POLICY read_post_comments ON public.post_comments FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS insert_post_comments ON public.post_comments;
CREATE POLICY insert_post_comments ON public.post_comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS delete_post_comments ON public.post_comments;
CREATE POLICY delete_post_comments ON public.post_comments FOR DELETE TO authenticated USING (author_id = auth.uid());

CREATE INDEX IF NOT EXISTS post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS post_comments_parent_id ON public.post_comments(parent_id);

-- 4. Tabla de Compartir / Repostear
CREATE TABLE IF NOT EXISTS public.post_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.post_shares TO authenticated;
GRANT SELECT ON public.post_shares TO anon;
GRANT ALL ON public.post_shares TO service_role;
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS read_post_shares ON public.post_shares;
CREATE POLICY read_post_shares ON public.post_shares FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS insert_post_shares ON public.post_shares;
CREATE POLICY insert_post_shares ON public.post_shares FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS delete_post_shares ON public.post_shares;
CREATE POLICY delete_post_shares ON public.post_shares FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS post_shares_post_id ON public.post_shares(post_id);

-- 5. Triggers para actualizar contadores automáticos
CREATE OR REPLACE FUNCTION public.update_post_interactions_count() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_TABLE_NAME = 'post_likes' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'post_comments' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'post_shares' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.posts SET shares_count = shares_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.posts SET shares_count = GREATEST(shares_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_post_likes_count ON public.post_likes;
CREATE TRIGGER trg_post_likes_count AFTER INSERT OR DELETE ON public.post_likes FOR EACH ROW EXECUTE FUNCTION public.update_post_interactions_count();

DROP TRIGGER IF EXISTS trg_post_comments_count ON public.post_comments;
CREATE TRIGGER trg_post_comments_count AFTER INSERT OR DELETE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.update_post_interactions_count();

DROP TRIGGER IF EXISTS trg_post_shares_count ON public.post_shares;
CREATE TRIGGER trg_post_shares_count AFTER INSERT OR DELETE ON public.post_shares FOR EACH ROW EXECUTE FUNCTION public.update_post_interactions_count();
