-- Función para sincronizar cambios del perfil con los metadatos del usuario
CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar los metadatos del usuario en auth.users
  UPDATE auth.users 
  SET raw_user_meta_data = 
    CASE 
      WHEN raw_user_meta_data IS NULL THEN 
        jsonb_build_object('full_name', NEW.full_name, 'avatar_url', NEW.avatar_url)
      ELSE 
        raw_user_meta_data || 
        jsonb_build_object('full_name', NEW.full_name, 'avatar_url', NEW.avatar_url)
    END
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para sincronizar cambios del perfil
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_update();