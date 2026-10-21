CREATE OR REPLACE FUNCTION public.create_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  selected public.app_role;
BEGIN
  selected := CASE
    WHEN NEW.raw_user_meta_data->>'role'='centro' THEN 'centro'::public.app_role
    WHEN NEW.raw_user_meta_data->>'role'='familia' THEN 'familia'::public.app_role
    ELSE 'aie'::public.app_role
  END;

  INSERT INTO public.user_roles(user_id, role)
  VALUES(NEW.id, selected)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

  INSERT INTO public.profiles(
    id,
    name,
    zone,
    phone,
    public_profile
  )
  VALUES(
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
    coalesce(NEW.raw_user_meta_data->>'zone', ''),
    coalesce(NEW.raw_user_meta_data->>'phone', ''),
    selected <> 'familia'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = CASE WHEN public.profiles.name = '' OR public.profiles.name IS NULL THEN EXCLUDED.name ELSE public.profiles.name END,
    zone = CASE WHEN public.profiles.zone = '' OR public.profiles.zone IS NULL THEN EXCLUDED.zone ELSE public.profiles.zone END,
    phone = CASE WHEN public.profiles.phone = '' OR public.profiles.phone IS NULL THEN EXCLUDED.phone ELSE public.profiles.phone END;

  IF selected = 'familia' THEN
    INSERT INTO public.family_needs(user_id)
    VALUES(NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_acompaname_signup ON auth.users;
CREATE TRIGGER on_acompaname_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_profile();
