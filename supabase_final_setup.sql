-- 🚀 FutsalPro - Script Final de Configuración
-- Ejecuta este script completo en el editor SQL de Supabase
-- Este script maneja la creación segura de todas las tablas y políticas

-- 1. Crear tabla de perfiles (si no existe)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('superAdmin','capitan','invitado')) DEFAULT 'invitado',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Ensure role column exists on existing installations
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_role_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check CHECK (role IN ('superAdmin','capitan','invitado'));
  END IF;
END $$;
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'invitado';
UPDATE public.profiles SET role = 'invitado' WHERE role IS NULL;

-- 2. Crear tabla de torneos (si no existe)
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('draft', 'active', 'completed', 'paused')) DEFAULT 'draft',
  format TEXT CHECK (format IN ('single_elimination', 'double_elimination', 'round_robin', 'groups')) NOT NULL,
  max_teams INTEGER NOT NULL DEFAULT 16,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  registration_deadline TIMESTAMPTZ,
  rules TEXT,
  prize_description TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Crear tabla de equipos (si no existe)
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  captain_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Crear tabla de jugadores con posiciones de futsal y foto
CREATE TABLE IF NOT EXISTS public.players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  jersey_number INTEGER,
  position TEXT CHECK (position IN ('portero', 'cierre', 'ala', 'pivote')),
  birth_date DATE,
  photo_url TEXT,
  is_captain BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, jersey_number)
);

-- 5. Crear tabla de equipos en torneos (si no existe)
CREATE TABLE IF NOT EXISTS public.tournament_teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('registered', 'confirmed', 'withdrawn')) DEFAULT 'registered',
  group_name TEXT,
  UNIQUE(tournament_id, team_id)
);

-- 6. Crear tabla de partidos (si no existe)
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  home_team_id UUID REFERENCES teams(id),
  away_team_id UUID REFERENCES teams(id),
  scheduled_at TIMESTAMPTZ,
  venue TEXT,
  round_name TEXT,
  status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  winner_team_id UUID REFERENCES teams(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Crear tabla de eventos del partido (si no existe)
CREATE TABLE IF NOT EXISTS public.match_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  team_id UUID REFERENCES teams(id),
  event_type TEXT CHECK (event_type IN ('goal', 'yellow_card', 'red_card', 'substitution')) NOT NULL,
  minute INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Crear tabla de estadísticas de jugadores (si no existe)
CREATE TABLE IF NOT EXISTS public.player_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  matches_played INTEGER DEFAULT 0,
  minutes_played INTEGER DEFAULT 0,
  UNIQUE(player_id, tournament_id)
);

-- 🔐 CONFIGURAR ROW LEVEL SECURITY (RLS)

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen (para evitar errores de duplicación)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

DROP POLICY IF EXISTS "Public tournaments are viewable by everyone" ON public.tournaments;
DROP POLICY IF EXISTS "Users can insert own tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Users can update own tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Users can delete own tournaments" ON public.tournaments;

DROP POLICY IF EXISTS "Teams are viewable by everyone" ON public.teams;
DROP POLICY IF EXISTS "Users can insert own teams" ON public.teams;
DROP POLICY IF EXISTS "Users can update own teams" ON public.teams;
DROP POLICY IF EXISTS "Users can delete own teams" ON public.teams;

DROP POLICY IF EXISTS "Players are viewable by everyone" ON public.players;
DROP POLICY IF EXISTS "Team creators can manage players" ON public.players;

DROP POLICY IF EXISTS "Tournament teams are viewable by everyone" ON public.tournament_teams;
DROP POLICY IF EXISTS "Tournament creators and team owners can manage registrations" ON public.tournament_teams;

DROP POLICY IF EXISTS "Matches are viewable by everyone" ON public.matches;
DROP POLICY IF EXISTS "Tournament creators can manage matches" ON public.matches;

DROP POLICY IF EXISTS "Match events are viewable by everyone" ON public.match_events;
DROP POLICY IF EXISTS "Tournament creators can manage match events" ON public.match_events;

DROP POLICY IF EXISTS "Player stats are viewable by everyone" ON public.player_stats;
DROP POLICY IF EXISTS "Tournament creators can manage player stats" ON public.player_stats;

-- Recrear todas las políticas

-- Políticas para profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Helper: función para detectar superAdmin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE plpgsql STABLE AS $$
DECLARE has_user_profiles BOOLEAN;
BEGIN
  SELECT to_regclass('public.user_profiles') IS NOT NULL INTO has_user_profiles;
  IF has_user_profiles THEN
    RETURN EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'superAdmin'
    );
  ELSE
    RETURN EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'superAdmin'
    );
  END IF;
END;
$$;

-- Ampliar políticas con superAdmin (bypass)
DROP POLICY IF EXISTS "Users can insert own tournaments" ON public.tournaments;
CREATE POLICY "Users can insert own tournaments" ON public.tournaments
  FOR INSERT WITH CHECK (creator_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "Users can update own tournaments" ON public.tournaments;
CREATE POLICY "Users can update own tournaments" ON public.tournaments
  FOR UPDATE USING (creator_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "Users can delete own tournaments" ON public.tournaments;
CREATE POLICY "Users can delete own tournaments" ON public.tournaments
  FOR DELETE USING (creator_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "Users can insert own teams" ON public.teams;
CREATE POLICY "Users can insert own teams" ON public.teams
  FOR INSERT WITH CHECK (created_by = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "Users can update own teams" ON public.teams;
CREATE POLICY "Users can update own teams" ON public.teams
  FOR UPDATE USING (created_by = auth.uid() OR captain_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "Users can delete own teams" ON public.teams;
CREATE POLICY "Users can delete own teams" ON public.teams
  FOR DELETE USING (created_by = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "Team creators can manage players" ON public.players;
CREATE POLICY "Team creators can manage players" ON public.players
  FOR ALL USING (
    public.is_super_admin() OR
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid() OR captain_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Tournament creators and team owners can manage registrations" ON public.tournament_teams;
CREATE POLICY "Tournament creators and team owners can manage registrations" ON public.tournament_teams
  FOR ALL USING (
    public.is_super_admin() OR
    tournament_id IN (SELECT id FROM tournaments WHERE creator_id = auth.uid())
    OR team_id IN (SELECT id FROM teams WHERE created_by = auth.uid() OR captain_id = auth.uid())
  );

DROP POLICY IF EXISTS "Tournament creators can manage matches" ON public.matches;
CREATE POLICY "Tournament creators can manage matches" ON public.matches
  FOR ALL USING (
    public.is_super_admin() OR
    tournament_id IN (SELECT id FROM tournaments WHERE creator_id = auth.uid())
  );

DROP POLICY IF EXISTS "Tournament creators can manage match events" ON public.match_events;
CREATE POLICY "Tournament creators can manage match events" ON public.match_events
  FOR ALL USING (
    public.is_super_admin() OR
    match_id IN (
      SELECT id FROM matches 
      WHERE tournament_id IN (
        SELECT id FROM tournaments WHERE creator_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Tournament creators can manage player stats" ON public.player_stats;
CREATE POLICY "Tournament creators can manage player stats" ON public.player_stats
  FOR ALL USING (
    public.is_super_admin() OR
    tournament_id IN (SELECT id FROM tournaments WHERE creator_id = auth.uid())
  );

-- 9. Solicitudes de participación de equipos a torneos
CREATE TABLE IF NOT EXISTS public.tournament_join_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending','approved','rejected','cancelled')) DEFAULT 'pending',
  message TEXT,
  decided_by UUID REFERENCES auth.users(id),
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice único para evitar múltiples solicitudes pendientes por equipo/torneo
CREATE UNIQUE INDEX IF NOT EXISTS ux_pending_join_requests
ON public.tournament_join_requests(tournament_id, team_id)
WHERE status = 'pending';

-- RLS para tournament_join_requests
ALTER TABLE public.tournament_join_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Join requests are viewable by requester, owner, or superAdmin" ON public.tournament_join_requests;
CREATE POLICY "Join requests are viewable by requester, owner, or superAdmin" ON public.tournament_join_requests
  FOR SELECT USING (
    requester_id = auth.uid()
    OR tournament_id IN (SELECT id FROM public.tournaments WHERE creator_id = auth.uid())
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "Captains can create join requests for own team" ON public.tournament_join_requests;
CREATE POLICY "Captains can create join requests for own team" ON public.tournament_join_requests
  FOR INSERT WITH CHECK (
    requester_id = auth.uid()
    AND team_id IN (SELECT id FROM public.teams WHERE created_by = auth.uid() OR captain_id = auth.uid())
  );

DROP POLICY IF EXISTS "Tournament owner approves or rejects requests" ON public.tournament_join_requests;
CREATE POLICY "Tournament owner approves or rejects requests" ON public.tournament_join_requests
  FOR UPDATE USING (
    public.is_super_admin() OR
    tournament_id IN (SELECT id FROM public.tournaments WHERE creator_id = auth.uid())
  ) WITH CHECK (
    public.is_super_admin() OR
    tournament_id IN (SELECT id FROM public.tournaments WHERE creator_id = auth.uid())
  );

DROP POLICY IF EXISTS "Requester can cancel own pending request" ON public.tournament_join_requests;
CREATE POLICY "Requester can cancel own pending request" ON public.tournament_join_requests
  FOR UPDATE USING (
    requester_id = auth.uid() AND status = 'pending'
  ) WITH CHECK (
    requester_id = auth.uid()
  );

-- updated_at trigger para tournament_join_requests
DROP TRIGGER IF EXISTS update_tjr_updated_at ON public.tournament_join_requests;
CREATE TRIGGER update_tjr_updated_at BEFORE UPDATE ON public.tournament_join_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger de efectos al cambiar el estado
CREATE OR REPLACE FUNCTION public.handle_join_request_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.tournament_teams (tournament_id, team_id, status)
    VALUES (NEW.tournament_id, NEW.team_id, 'registered')
    ON CONFLICT (tournament_id, team_id) DO NOTHING;
    NEW.decided_by := COALESCE(NEW.decided_by, auth.uid());
    NEW.decided_at := COALESCE(NEW.decided_at, NOW());
  ELSIF NEW.status IN ('rejected','cancelled') AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    NEW.decided_by := COALESCE(NEW.decided_by, auth.uid());
    NEW.decided_at := COALESCE(NEW.decided_at, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_handle_join_request_status ON public.tournament_join_requests;
CREATE TRIGGER trg_handle_join_request_status
  BEFORE UPDATE ON public.tournament_join_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_join_request_status();

-- Restricción: capitan solo puede crear un equipo; invitado no puede crear
CREATE OR REPLACE FUNCTION public.check_team_creation_limit()
RETURNS TRIGGER AS $$
DECLARE v_role TEXT; v_count INT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role IS NULL THEN v_role := 'invitado'; END IF;

  IF v_role = 'invitado' THEN
    RAISE EXCEPTION 'No tienes permisos para crear equipos (rol invitado)';
  ELSIF v_role = 'capitan' THEN
    SELECT COUNT(*) INTO v_count FROM public.teams WHERE created_by = auth.uid();
    IF v_count >= 1 THEN
      RAISE EXCEPTION 'Los capitanes solo pueden crear un equipo';
    END IF;
  END IF;
  RETURN NEW;
END;$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_team_creation_limit ON public.teams;
CREATE TRIGGER trg_check_team_creation_limit
  BEFORE INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.check_team_creation_limit();

-- Restricción: capacidad de torneos
CREATE OR REPLACE FUNCTION public.check_tournament_capacity()
RETURNS TRIGGER AS $$
DECLARE max_slots INT; current_count INT;
BEGIN
  SELECT max_teams INTO max_slots FROM public.tournaments WHERE id = NEW.tournament_id;
  SELECT COUNT(*) INTO current_count FROM public.tournament_teams 
    WHERE tournament_id = NEW.tournament_id AND status IN ('registered','confirmed');
  IF max_slots IS NOT NULL AND current_count >= max_slots THEN
    RAISE EXCEPTION 'Este torneo no tiene cupos disponibles';
  END IF;
  RETURN NEW;
END;$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_tournament_capacity ON public.tournament_teams;
CREATE TRIGGER trg_check_tournament_capacity
  BEFORE INSERT ON public.tournament_teams
  FOR EACH ROW EXECUTE FUNCTION public.check_tournament_capacity();

-- Políticas para tournaments
CREATE POLICY "Public tournaments are viewable by everyone" ON public.tournaments
  FOR SELECT USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can insert own tournaments" ON public.tournaments
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update own tournaments" ON public.tournaments
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Users can delete own tournaments" ON public.tournaments
  FOR DELETE USING (creator_id = auth.uid());

-- Políticas para teams
CREATE POLICY "Teams are viewable by everyone" ON public.teams
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own teams" ON public.teams
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own teams" ON public.teams
  FOR UPDATE USING (created_by = auth.uid() OR captain_id = auth.uid());

CREATE POLICY "Users can delete own teams" ON public.teams
  FOR DELETE USING (created_by = auth.uid());

-- Políticas para players
CREATE POLICY "Players are viewable by everyone" ON public.players
  FOR SELECT USING (true);

CREATE POLICY "Team creators can manage players" ON public.players
  FOR ALL USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid() OR captain_id = auth.uid()
    )
  );

-- Políticas para tournament_teams
CREATE POLICY "Tournament teams are viewable by everyone" ON public.tournament_teams
  FOR SELECT USING (true);

CREATE POLICY "Tournament creators and team owners can manage registrations" ON public.tournament_teams
  FOR ALL USING (
    tournament_id IN (SELECT id FROM tournaments WHERE creator_id = auth.uid())
    OR team_id IN (SELECT id FROM teams WHERE created_by = auth.uid() OR captain_id = auth.uid())
  );

-- Políticas para matches
CREATE POLICY "Matches are viewable by everyone" ON public.matches
  FOR SELECT USING (true);

CREATE POLICY "Tournament creators can manage matches" ON public.matches
  FOR ALL USING (
    tournament_id IN (SELECT id FROM tournaments WHERE creator_id = auth.uid())
  );

-- Políticas para match_events
CREATE POLICY "Match events are viewable by everyone" ON public.match_events
  FOR SELECT USING (true);

CREATE POLICY "Tournament creators can manage match events" ON public.match_events
  FOR ALL USING (
    match_id IN (
      SELECT id FROM matches 
      WHERE tournament_id IN (
        SELECT id FROM tournaments WHERE creator_id = auth.uid()
      )
    )
  );

-- Políticas para player_stats
CREATE POLICY "Player stats are viewable by everyone" ON public.player_stats
  FOR SELECT USING (true);

CREATE POLICY "Tournament creators can manage player stats" ON public.player_stats
  FOR ALL USING (
    tournament_id IN (SELECT id FROM tournaments WHERE creator_id = auth.uid())
  );

-- ✅ FUNCIONES Y TRIGGERS

-- Función para verificar máximo 12 jugadores por equipo
CREATE OR REPLACE FUNCTION check_max_players()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM players WHERE team_id = NEW.team_id AND is_active = true) >= 12 THEN
    RAISE EXCEPTION 'Un equipo no puede tener más de 12 jugadores activos';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para verificar máximo de jugadores
DROP TRIGGER IF EXISTS trigger_check_max_players ON players;
CREATE TRIGGER trigger_check_max_players
  BEFORE INSERT OR UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION check_max_players();

-- Función para verificar solo un capitán por equipo
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

-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at en todas las tablas relevantes
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_tournaments_updated_at ON tournaments;
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
DROP TRIGGER IF EXISTS update_players_updated_at ON players;
DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 🎉 ¡BASE DE DATOS CONFIGURADA COMPLETAMENTE!
-- Este script incluye:
-- ✅ Todas las tablas con campos actualizados
-- ✅ Posiciones de futsal: portero, cierre, ala, pivote
-- ✅ Campo photo_url para fotos de jugadores
-- ✅ Sistema de capitán único por equipo
-- ✅ Máximo 12 jugadores por equipo
-- ✅ Políticas de seguridad (RLS)
-- ✅ Triggers automáticos

SELECT 'Base de datos configurada exitosamente para FutsalPro! 🚀⚽' as status;
