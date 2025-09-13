-- FutsalPro – Fusion SQL para corregir/fortalecer torneos y relaciones
-- Idempotente: puedes ejecutarlo múltiples veces sin romper el esquema.
-- Mantiene los estados y formatos actuales: status (draft|active|completed|paused)
-- y format (single_elimination|double_elimination|round_robin|groups)

BEGIN;

-- ========== TORNEOS ==========
-- Asegurar tabla y columnas clave (no borra datos existentes)
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'draft',
  format TEXT NOT NULL,
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

-- Columnas por si faltan (ADD COLUMN es seguro con IF NOT EXISTS)
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS creator_id UUID;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS format TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS max_teams INTEGER;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS rules TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS prize_description TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS is_public BOOLEAN;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Defaults sensatos
ALTER TABLE public.tournaments ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE public.tournaments ALTER COLUMN max_teams SET DEFAULT 16;
ALTER TABLE public.tournaments ALTER COLUMN is_public SET DEFAULT true;
ALTER TABLE public.tournaments ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE public.tournaments ALTER COLUMN updated_at SET DEFAULT NOW();

-- Clave foránea a auth.users para creator_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tournaments_creator_id_fkey'
  ) THEN
    ALTER TABLE public.tournaments
      ADD CONSTRAINT tournaments_creator_id_fkey
      FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Checks de estados y formatos (manteniendo los valores actuales)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tournaments_status_check'
      AND conrelid = 'public.tournaments'::regclass
  ) THEN
    ALTER TABLE public.tournaments
      ADD CONSTRAINT tournaments_status_check
      CHECK (status IN ('draft','active','completed','paused'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tournaments_format_check'
      AND conrelid = 'public.tournaments'::regclass
  ) THEN
    ALTER TABLE public.tournaments
      ADD CONSTRAINT tournaments_format_check
      CHECK (format IN ('single_elimination','double_elimination','round_robin','groups'));
  END IF;
END $$;

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_tournaments_creator_id ON public.tournaments(creator_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_format ON public.tournaments(format);
CREATE INDEX IF NOT EXISTS idx_tournaments_start_date ON public.tournaments(start_date);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tournaments_updated_at ON public.tournaments;
CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ========== TOURNAMENT_TEAMS ==========
CREATE TABLE IF NOT EXISTS public.tournament_teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('registered','confirmed','withdrawn')) DEFAULT 'registered',
  group_name TEXT,
  UNIQUE(tournament_id, team_id)
);

-- Reforzar FK e índices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tournament_teams_tournament_id_fkey'
  ) THEN
    ALTER TABLE public.tournament_teams
      ADD CONSTRAINT tournament_teams_tournament_id_fkey
      FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tournament_teams_team_id_fkey'
  ) THEN
    ALTER TABLE public.tournament_teams
      ADD CONSTRAINT tournament_teams_team_id_fkey
      FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tournament_teams_tournament ON public.tournament_teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_teams_team ON public.tournament_teams(team_id);

-- Trigger: capacidad del torneo (respeta max_teams)
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


-- ========== MATCHES ==========
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  home_team_id UUID REFERENCES public.teams(id),
  away_team_id UUID REFERENCES public.teams(id),
  scheduled_at TIMESTAMPTZ,
  venue TEXT,
  round_name TEXT,
  status TEXT CHECK (status IN ('scheduled','in_progress','completed','cancelled')) DEFAULT 'scheduled',
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  winner_team_id UUID REFERENCES public.teams(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de calendarización y relación
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON public.matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_scheduled_at ON public.matches(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);

DROP TRIGGER IF EXISTS update_matches_updated_at ON public.matches;
CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ========== VISTAS DE APOYO (read-only) ==========
-- KPI por torneo: totales de equipos, partidos por estado y goles acumulados
CREATE OR REPLACE VIEW public.v_tournament_kpis AS
SELECT
  t.id AS tournament_id,
  t.name,
  COUNT(DISTINCT tt.team_id) AS teams_registered,
  COALESCE(SUM(CASE WHEN m.status = 'completed' THEN 1 ELSE 0 END),0) AS matches_completed,
  COALESCE(SUM(CASE WHEN m.status = 'scheduled' THEN 1 ELSE 0 END),0) AS matches_scheduled,
  COALESCE(SUM(CASE WHEN m.status = 'in_progress' THEN 1 ELSE 0 END),0) AS matches_in_progress,
  COALESCE(SUM(m.home_score + m.away_score),0) AS goals_total
FROM public.tournaments t
LEFT JOIN public.tournament_teams tt ON tt.tournament_id = t.id
LEFT JOIN public.matches m ON m.tournament_id = t.id
GROUP BY t.id, t.name;

-- Calendario con nombres de equipos
CREATE OR REPLACE VIEW public.v_tournament_schedule AS
SELECT
  m.id AS match_id,
  m.tournament_id,
  m.scheduled_at,
  m.venue,
  m.round_name,
  m.status,
  ht.name AS home_team_name,
  at.name AS away_team_name,
  m.home_score,
  m.away_score
FROM public.matches m
LEFT JOIN public.teams ht ON ht.id = m.home_team_id
LEFT JOIN public.teams at ON at.id = m.away_team_id;

-- Próximos partidos (programados en el futuro)
CREATE OR REPLACE VIEW public.v_tournament_upcoming AS
SELECT
  m.id AS match_id,
  m.tournament_id,
  m.scheduled_at,
  m.venue,
  m.round_name,
  ht.name AS home_team_name,
  at.name AS away_team_name
FROM public.matches m
LEFT JOIN public.teams ht ON ht.id = m.home_team_id
LEFT JOIN public.teams at ON at.id = m.away_team_id
WHERE m.status = 'scheduled' AND (m.scheduled_at IS NULL OR m.scheduled_at >= NOW());

-- Últimos resultados (partidos completados)
CREATE OR REPLACE VIEW public.v_tournament_recent_results AS
SELECT
  m.id AS match_id,
  m.tournament_id,
  m.scheduled_at,
  m.venue,
  m.round_name,
  ht.name AS home_team_name,
  at.name AS away_team_name,
  m.home_score,
  m.away_score
FROM public.matches m
LEFT JOIN public.teams ht ON ht.id = m.home_team_id
LEFT JOIN public.teams at ON at.id = m.away_team_id
WHERE m.status = 'completed';

-- Helpers parametrizados para consumir desde la app con límite
CREATE OR REPLACE FUNCTION public.fn_tournament_upcoming(_tournament UUID, _limit INT DEFAULT 10)
RETURNS TABLE (
  match_id UUID,
  scheduled_at TIMESTAMPTZ,
  venue TEXT,
  round_name TEXT,
  home_team_name TEXT,
  away_team_name TEXT
) LANGUAGE sql STABLE AS $$
  SELECT m.id, m.scheduled_at, m.venue, m.round_name, ht.name, at.name
  FROM public.matches m
  LEFT JOIN public.teams ht ON ht.id = m.home_team_id
  LEFT JOIN public.teams at ON at.id = m.away_team_id
  WHERE m.tournament_id = _tournament
    AND m.status = 'scheduled'
    AND (m.scheduled_at IS NULL OR m.scheduled_at >= NOW())
  ORDER BY m.scheduled_at NULLS LAST
  LIMIT _limit;
$$;

CREATE OR REPLACE FUNCTION public.fn_tournament_recent_results(_tournament UUID, _limit INT DEFAULT 10)
RETURNS TABLE (
  match_id UUID,
  scheduled_at TIMESTAMPTZ,
  venue TEXT,
  round_name TEXT,
  home_team_name TEXT,
  away_team_name TEXT,
  home_score INT,
  away_score INT
) LANGUAGE sql STABLE AS $$
  SELECT m.id, m.scheduled_at, m.venue, m.round_name, ht.name, at.name, m.home_score, m.away_score
  FROM public.matches m
  LEFT JOIN public.teams ht ON ht.id = m.home_team_id
  LEFT JOIN public.teams at ON at.id = m.away_team_id
  WHERE m.tournament_id = _tournament
    AND m.status = 'completed'
  ORDER BY m.scheduled_at DESC NULLS LAST
  LIMIT _limit;
$$;

COMMIT;
