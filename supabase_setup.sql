-- 🚀 FutsalPro Database Setup
-- Ejecuta este script en el editor SQL de Supabase

-- 1. Crear tabla de perfiles
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

-- 2. Crear tabla de torneos
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

-- 3. Crear tabla de equipos
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

-- 4. Crear tabla de jugadores (máximo 12 por equipo)
CREATE TABLE IF NOT EXISTS public.players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  jersey_number INTEGER,
  position TEXT CHECK (position IN ('goalkeeper', 'defender', 'midfielder', 'forward')),
  birth_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, jersey_number)
);

-- 5. Crear tabla de equipos en torneos
CREATE TABLE IF NOT EXISTS public.tournament_teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('registered', 'confirmed', 'withdrawn')) DEFAULT 'registered',
  group_name TEXT,
  UNIQUE(tournament_id, team_id)
);

-- 6. Crear tabla de partidos
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

-- 7. Crear tabla de eventos del partido
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

-- 8. Crear tabla de estadísticas de jugadores
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

-- Políticas para profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Helper: función para detectar superAdmin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'superAdmin'
  );
$$;

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

-- ✅ CONSTRAINTS ADICIONALES

-- Máximo 12 jugadores por equipo
CREATE OR REPLACE FUNCTION check_max_players()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM players WHERE team_id = NEW.team_id AND is_active = true) >= 12 THEN
    RAISE EXCEPTION 'Un equipo no puede tener más de 12 jugadores activos';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_max_players
  BEFORE INSERT OR UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION check_max_players();

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

-- Aplicar trigger de updated_at a todas las tablas relevantes
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 🎉 ¡BASE DE DATOS CONFIGURADA!
-- Ahora puedes usar datos reales en tu aplicación
