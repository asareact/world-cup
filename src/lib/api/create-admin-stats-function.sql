-- Create a view or function to get player stats with all related info
-- This creates a simplified approach to get all player stats with related data

-- First, make sure we have the proper RLS policies for user_profiles if the table exists
DO $$ 
BEGIN
  -- Check if user_profiles table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    -- Enable RLS if not already enabled
    ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
    
    -- Create policies for user_profiles if they don't exist
    CREATE POLICY IF NOT EXISTS "Admins can manage user profiles" ON public.user_profiles
      FOR ALL USING ( EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = ANY(ARRAY['superAdmin'::text, 'arbitro'::text])
      ));
  END IF;
END $$;

-- Create a function that returns player stats with all related info
CREATE OR REPLACE FUNCTION get_filtered_player_stats(
  p_tournament_id UUID DEFAULT NULL,
  p_team_id UUID DEFAULT NULL,
  p_player_name TEXT DEFAULT NULL,
  p_position TEXT DEFAULT NULL,
  p_min_goals INTEGER DEFAULT NULL,
  p_max_goals INTEGER DEFAULT NULL,
  p_min_assists INTEGER DEFAULT NULL,
  p_max_assists INTEGER DEFAULT NULL,
  p_min_minutes INTEGER DEFAULT NULL,
  p_max_minutes INTEGER DEFAULT NULL,
  p_sort_field TEXT DEFAULT 'goals',
  p_sort_order TEXT DEFAULT 'desc',
  p_offset INTEGER DEFAULT 0,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  player_id UUID,
  tournament_id UUID,
  goals INTEGER,
  assists INTEGER,
  yellow_cards INTEGER,
  red_cards INTEGER,
  matches_played INTEGER,
  minutes_played INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  player_name TEXT,
  player_position TEXT,
  team_name TEXT,
  tournament_name TEXT
) AS $$
BEGIN
  RETURN QUERY EXECUTE format('
    SELECT 
      ps.id,
      ps.player_id,
      ps.tournament_id,
      ps.goals,
      ps.assists,
      ps.yellow_cards,
      ps.red_cards,
      ps.matches_played,
      ps.minutes_played,
      ps.created_at,
      ps.updated_at,
      p.name AS player_name,
      p.position AS player_position,
      t.name AS team_name,
      tr.name AS tournament_name
    FROM player_stats ps
    JOIN players p ON ps.player_id = p.id
    JOIN teams t ON p.team_id = t.id
    JOIN tournaments tr ON ps.tournament_id = tr.id
    WHERE ($1 IS NULL OR ps.tournament_id = $1)
      AND ($2 IS NULL OR p.team_id = $2)
      AND ($3 IS NULL OR LOWER(p.name) LIKE LOWER(''%%'' || $3 || ''%%''))
      AND ($4 IS NULL OR p.position = $4)
      AND ($5 IS NULL OR ps.goals >= $5)
      AND ($6 IS NULL OR ps.goals <= $6)
      AND ($7 IS NULL OR ps.assists >= $7)
      AND ($8 IS NULL OR ps.assists <= $8)
      AND ($9 IS NULL OR ps.minutes_played >= $9)
      AND ($10 IS NULL OR ps.minutes_played <= $10)
    ORDER BY %I %s
    LIMIT $11 OFFSET $12',
    p_sort_field,
    CASE WHEN p_sort_order = 'asc' THEN 'ASC' ELSE 'DESC' END
  ) 
  USING 
    p_tournament_id,
    p_team_id,
    p_player_name,
    p_position,
    p_min_goals,
    p_max_goals,
    p_min_assists,
    p_max_assists,
    p_min_minutes,
    p_max_minutes,
    p_limit,
    p_offset;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get total count of filtered records
CREATE OR REPLACE FUNCTION get_filtered_player_stats_count(
  p_tournament_id UUID DEFAULT NULL,
  p_team_id UUID DEFAULT NULL,
  p_player_name TEXT DEFAULT NULL,
  p_position TEXT DEFAULT NULL,
  p_min_goals INTEGER DEFAULT NULL,
  p_max_goals INTEGER DEFAULT NULL,
  p_min_assists INTEGER DEFAULT NULL,
  p_max_assists INTEGER DEFAULT NULL,
  p_min_minutes INTEGER DEFAULT NULL,
  p_max_minutes INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO count_result
  FROM player_stats ps
  JOIN players p ON ps.player_id = p.id
  JOIN teams t ON p.team_id = t.id
  JOIN tournaments tr ON ps.tournament_id = tr.id
  WHERE ($1 IS NULL OR ps.tournament_id = $1)
    AND ($2 IS NULL OR p.team_id = $2)
    AND ($3 IS NULL OR LOWER(p.name) LIKE LOWER('%' || $3 || '%'))
    AND ($4 IS NULL OR p.position = $4)
    AND ($5 IS NULL OR ps.goals >= $5)
    AND ($6 IS NULL OR ps.goals <= $6)
    AND ($7 IS NULL OR ps.assists >= $7)
    AND ($8 IS NULL OR ps.assists <= $8)
    AND ($9 IS NULL OR ps.minutes_played >= $9)
    AND ($10 IS NULL OR ps.minutes_played <= $10);

  RETURN count_result;
END;
$$ LANGUAGE plpgsql;