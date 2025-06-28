-- 🔄 Actualización de tabla players para futsal
-- Ejecuta este script en el editor SQL de Supabase

-- Actualizar las posiciones específicas de futsal
ALTER TABLE public.players 
DROP CONSTRAINT IF EXISTS players_position_check;

ALTER TABLE public.players 
ADD CONSTRAINT players_position_check 
CHECK (position IN ('portero', 'cierre', 'ala', 'pivote'));

-- Agregar campos para foto y capitán
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS is_captain BOOLEAN DEFAULT false;

-- Constraint para asegurar solo un capitán por equipo
CREATE OR REPLACE FUNCTION check_single_captain()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el jugador se está marcando como capitán
  IF NEW.is_captain = true THEN
    -- Desmarcar cualquier otro capitán en el mismo equipo
    UPDATE players 
    SET is_captain = false 
    WHERE team_id = NEW.team_id 
    AND id != NEW.id 
    AND is_captain = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para el constraint de capitán único
DROP TRIGGER IF EXISTS trigger_check_single_captain ON players;
CREATE TRIGGER trigger_check_single_captain
  BEFORE INSERT OR UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION check_single_captain();

-- 📝 Posiciones de Futsal:
-- - portero: Guardameta
-- - cierre: Defensor central
-- - ala: Jugador de banda (derecho/izquierdo)  
-- - pivote: Delantero centro