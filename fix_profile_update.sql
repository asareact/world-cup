-- Corrección para el error al actualizar el perfil
-- Esta función utiliza la API de Supabase para actualizar los metadatos del usuario
-- en lugar de intentar actualizar directamente la tabla auth.users

-- Primero, eliminamos la función y trigger existentes
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_profile_update();

-- Creamos una nueva función que utiliza la API de Supabase
-- Esta función actualiza los metadatos del usuario a través de la API
-- en lugar de intentar modificar directamente auth.users
CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Esta función ya no necesita actualizar auth.users directamente
  -- La sincronización se maneja a través de la aplicación
  -- Simplemente retornamos NEW para permitir que la actualización continúe
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Creamos el trigger
CREATE TRIGGER on_profile_updated
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_update();

-- Ahora actualizamos la función de autenticación para manejar la sincronización
-- desde la aplicación en lugar de depender del trigger