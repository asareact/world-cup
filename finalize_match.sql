-- finalize_match.sql
-- Recreates the finalize_match routine ensuring player and team statistics remain consistent.

CREATE TABLE IF NOT EXISTS public.match_player_participation (
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (match_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_match_player_participation_player ON public.match_player_participation (player_id);
CREATE INDEX IF NOT EXISTS idx_match_player_participation_tournament ON public.match_player_participation (tournament_id);
CREATE INDEX IF NOT EXISTS idx_match_player_participation_match ON public.match_player_participation (match_id);

DROP FUNCTION IF EXISTS finalize_match(uuid, int, int, jsonb, uuid[]);

CREATE OR REPLACE FUNCTION finalize_match(
    p_match_id uuid,
    p_home_score int,
    p_away_score int,
    p_events jsonb,
    p_player_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_match RECORD;
  v_events jsonb := COALESCE(p_events, '[]'::jsonb);
  v_event_record RECORD;
  v_event jsonb;
  v_player_id uuid;
  v_team_id uuid;
  v_event_type text;
  v_assist_player uuid;
  v_minute int;
  v_description text;
  v_event_subtype text;
  v_home_goals_from_events int := 0;
  v_away_goals_from_events int := 0;
  v_participant_array uuid[] := ARRAY[]::uuid[];
BEGIN
  SELECT id,
         tournament_id,
         home_team_id,
         away_team_id,
         home_keeper_id,
         away_keeper_id
  INTO v_match
  FROM public.matches
  WHERE id = p_match_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match % not found', p_match_id;
  END IF;

  IF v_match.tournament_id IS NULL THEN
    RAISE EXCEPTION 'Match % is missing tournament_id', p_match_id;
  END IF;

  IF v_match.home_team_id IS NULL OR v_match.away_team_id IS NULL THEN
    RAISE EXCEPTION 'Match % must have both teams assigned before finalizing', p_match_id;
  END IF;

  IF jsonb_typeof(v_events) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Events payload must be a JSON array';
  END IF;

  -- Validate player ids list (if provided)
  IF p_player_ids IS NOT NULL THEN
    SELECT uid INTO v_player_id
    FROM unnest(p_player_ids) AS uid
    LEFT JOIN public.players pl ON pl.id = uid
    WHERE pl.id IS NULL
    LIMIT 1;

    IF v_player_id IS NOT NULL THEN
      RAISE EXCEPTION 'Player % from player_ids was not found', v_player_id;
    END IF;

    v_player_id := NULL;

    SELECT uid INTO v_player_id
    FROM unnest(p_player_ids) AS uid
    JOIN public.players pl ON pl.id = uid
    WHERE pl.team_id NOT IN (v_match.home_team_id, v_match.away_team_id)
    LIMIT 1;

    IF v_player_id IS NOT NULL THEN
      RAISE EXCEPTION 'Player % from player_ids does not belong to the match teams', v_player_id;
    END IF;
  END IF;

  -- Remove previous events for idempotency
  DELETE FROM public.match_events WHERE match_id = p_match_id;

  -- Insert new events and compute running totals
  FOR v_event_record IN SELECT value FROM jsonb_array_elements(v_events) AS value LOOP
    v_event := v_event_record.value;
    v_player_id := NULLIF(v_event->>'player_id', '')::uuid;
    v_team_id := NULLIF(v_event->>'team_id', '')::uuid;
    v_event_type := lower(trim(v_event->>'event_type'));
    v_assist_player := NULLIF(v_event->>'assist_player_id', '')::uuid;
    v_minute := NULLIF(v_event->>'minute', '')::int;
    v_description := NULLIF(v_event->>'description', '');
    v_event_subtype := NULLIF(v_event->>'event_subtype', '');

    IF v_player_id IS NULL THEN
      RAISE EXCEPTION 'Event % is missing player_id', v_event;
    END IF;

    IF v_team_id IS NULL THEN
      RAISE EXCEPTION 'Event % is missing team_id', v_event;
    END IF;

    IF v_event_type IS NULL THEN
      RAISE EXCEPTION 'Event for player % is missing event_type', v_player_id;
    END IF;

    IF v_event_type NOT IN ('goal', 'yellow_card', 'red_card', 'own_goal', 'assist', 'save') THEN
      RAISE EXCEPTION 'Event type % is not supported', v_event_type;
    END IF;

    IF v_team_id NOT IN (v_match.home_team_id, v_match.away_team_id) THEN
      RAISE EXCEPTION 'Event team % is not part of the match', v_team_id;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.players p
      WHERE p.id = v_player_id AND p.team_id = v_team_id
    ) THEN
      RAISE EXCEPTION 'Player % does not belong to team %', v_player_id, v_team_id;
    END IF;

    IF v_assist_player IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.players ap
        WHERE ap.id = v_assist_player AND ap.team_id = v_team_id
      ) THEN
        RAISE EXCEPTION 'Assist player % does not belong to team %', v_assist_player, v_team_id;
      END IF;
    END IF;

    INSERT INTO public.match_events (
      match_id,
      player_id,
      team_id,
      event_type,
      minute,
      description,
      assist_player_id,
      event_subtype
    )
    VALUES (
      p_match_id,
      v_player_id,
      v_team_id,
      v_event_type,
      v_minute,
      v_description,
      v_assist_player,
      v_event_subtype
    );

    IF v_event_type = 'goal' THEN
      IF v_team_id = v_match.home_team_id THEN
        v_home_goals_from_events := v_home_goals_from_events + 1;
      ELSE
        v_away_goals_from_events := v_away_goals_from_events + 1;
      END IF;
    ELSIF v_event_type = 'own_goal' THEN
      IF v_team_id = v_match.home_team_id THEN
        v_away_goals_from_events := v_away_goals_from_events + 1;
      ELSE
        v_home_goals_from_events := v_home_goals_from_events + 1;
      END IF;
    END IF;
  END LOOP;

  IF p_home_score IS NULL OR p_away_score IS NULL THEN
    RAISE EXCEPTION 'Final scores cannot be null';
  END IF;

  IF v_home_goals_from_events <> p_home_score THEN
    RAISE EXCEPTION 'Home score mismatch: events % vs provided %', v_home_goals_from_events, p_home_score;
  END IF;

  IF v_away_goals_from_events <> p_away_score THEN
    RAISE EXCEPTION 'Away score mismatch: events % vs provided %', v_away_goals_from_events, p_away_score;
  END IF;

  -- Build final participant list (players involved plus keepers)
  SELECT COALESCE(array_remove(array_agg(DISTINCT player_id), NULL), ARRAY[]::uuid[])
  INTO v_participant_array
  FROM (
    SELECT unnest(COALESCE(p_player_ids, ARRAY[]::uuid[])) AS player_id
    UNION
    SELECT me.player_id FROM public.match_events me WHERE me.match_id = p_match_id
    UNION
    SELECT me.assist_player_id FROM public.match_events me WHERE me.match_id = p_match_id AND me.assist_player_id IS NOT NULL
    UNION
    SELECT v_match.home_keeper_id
    UNION
    SELECT v_match.away_keeper_id
  ) AS participants;

  -- Ensure stats rows exist for all participants
  INSERT INTO public.player_stats (player_id, tournament_id)
  SELECT DISTINCT player_id, v_match.tournament_id
  FROM (
    SELECT unnest(v_participant_array) AS player_id
  ) AS all_players
  WHERE player_id IS NOT NULL
  ON CONFLICT (player_id, tournament_id) DO NOTHING;

  -- Refresh participation table for this match
  DELETE FROM public.match_player_participation WHERE match_id = p_match_id;

  INSERT INTO public.match_player_participation (match_id, player_id, tournament_id, team_id)
  SELECT
    p_match_id,
    pl.id,
    v_match.tournament_id,
    pl.team_id
  FROM public.players pl
  WHERE pl.id = ANY(v_participant_array)
    AND pl.team_id IN (v_match.home_team_id, v_match.away_team_id);

  -- Update match record with final score and winner
  UPDATE public.matches
  SET home_score = p_home_score,
      away_score = p_away_score,
      status = 'completed',
      winner_team_id = CASE
        WHEN p_home_score > p_away_score THEN v_match.home_team_id
        WHEN p_away_score > p_home_score THEN v_match.away_team_id
        ELSE NULL
      END,
      updated_at = now()
  WHERE id = p_match_id;

  -- Aggregate statistics for the affected players within the tournament
  WITH target_players AS (
    SELECT DISTINCT player_id
    FROM public.match_player_participation mpp
    WHERE mpp.tournament_id = v_match.tournament_id
      AND mpp.player_id = ANY(v_participant_array)
  ),
  tournament_events AS (
    SELECT me.*
    FROM public.match_events me
    JOIN public.matches m ON m.id = me.match_id
    WHERE m.tournament_id = v_match.tournament_id
  ),
 
  -- Calculate base statistics
  player_event_totals AS (
    SELECT
      me.player_id,
      COUNT(*) FILTER (WHERE me.event_type = 'goal') AS goals,
      COUNT(*) FILTER (WHERE me.event_type = 'yellow_card') AS yellow_cards,
      COUNT(*) FILTER (WHERE me.event_type = 'red_card') AS red_cards,
      COUNT(*) FILTER (WHERE me.event_type = 'save') AS saves_made
    FROM tournament_events me
    GROUP BY me.player_id
  ),
  -- Add red cards for players who received double yellow (2 yellows in same match)
  player_event_totals_with_double_yellow AS (
    SELECT
      pet.player_id,
      pet.goals,
      pet.yellow_cards,
      pet.red_cards + COALESCE(double_yellow.red_card_adjustment, 0) AS red_cards,
      pet.saves_made
    FROM player_event_totals pet
    LEFT JOIN (
      SELECT
        ycc.player_id,
        COUNT(*) AS red_card_adjustment  -- Add 1 red card for each match where player had 2+ yellows
      FROM yellow_card_counts ycc
      GROUP BY ycc.player_id
    ) double_yellow ON pet.player_id = double_yellow.player_id
  ),
  assist_from_goals AS (
    SELECT
      me.assist_player_id AS player_id,
      COUNT(*) AS assists_from_goals
    FROM tournament_events me
    WHERE me.event_type = 'goal' AND me.assist_player_id IS NOT NULL
    GROUP BY me.assist_player_id
  ),
  direct_assist_totals AS (
    SELECT
      me.player_id,
      COUNT(*) AS direct_assists
    FROM tournament_events me
    WHERE me.event_type = 'assist'
    GROUP BY me.player_id
  ),
  assist_totals AS (
    SELECT
      tp.player_id,
      COALESCE(afg.assists_from_goals, 0) + COALESCE(dat.direct_assists, 0) AS assists
    FROM target_players tp
    LEFT JOIN assist_from_goals afg ON afg.player_id = tp.player_id
    LEFT JOIN direct_assist_totals dat ON dat.player_id = tp.player_id
  ),
  matches_played_totals AS (
    SELECT
      mpp.player_id,
      COUNT(*) AS matches_played
    FROM public.match_player_participation mpp
    WHERE mpp.tournament_id = v_match.tournament_id
    GROUP BY mpp.player_id
  ),
  keeper_totals AS (
    SELECT
      data.player_id,
      SUM(data.goals_conceded) AS goals_conceded,
      SUM(data.clean_sheet) AS clean_sheets
    FROM (
      SELECT
        m.home_keeper_id AS player_id,
        m.away_score AS goals_conceded,
        CASE WHEN m.away_score = 0 THEN 1 ELSE 0 END AS clean_sheet
      FROM public.matches m
      WHERE m.tournament_id = v_match.tournament_id
        AND m.status = 'completed'
        AND m.home_keeper_id IS NOT NULL
      UNION ALL
      SELECT
        m.away_keeper_id AS player_id,
        m.home_score AS goals_conceded,
        CASE WHEN m.home_score = 0 THEN 1 ELSE 0 END AS clean_sheet
      FROM public.matches m
      WHERE m.tournament_id = v_match.tournament_id
        AND m.status = 'completed'
        AND m.away_keeper_id IS NOT NULL
    ) AS data
    GROUP BY data.player_id
  ),
  final_stats AS (
    SELECT
      tp.player_id,
      COALESCE(pet.goals, 0) AS goals,
      COALESCE(ast.assists, 0) AS assists,
      COALESCE(pet.yellow_cards, 0) AS yellow_cards,
      COALESCE(pet.red_cards, 0) AS red_cards,
      COALESCE(pet.saves_made, 0) AS saves_made,
      COALESCE(kt.goals_conceded, 0) AS goals_conceded,
      COALESCE(kt.clean_sheets, 0) AS clean_sheets,
      COALESCE(mpt.matches_played, 0) AS matches_played
    FROM target_players tp
    LEFT JOIN player_event_totals_with_double_yellow pet ON pet.player_id = tp.player_id
    LEFT JOIN assist_totals ast ON ast.player_id = tp.player_id
    LEFT JOIN keeper_totals kt ON kt.player_id = tp.player_id
    LEFT JOIN matches_played_totals mpt ON mpt.player_id = tp.player_id
  )
  UPDATE public.player_stats ps
  SET goals = final_stats.goals,
      assists = final_stats.assists,
      yellow_cards = final_stats.yellow_cards,
      red_cards = final_stats.red_cards,
      saves_made = final_stats.saves_made,
      goals_conceded = final_stats.goals_conceded,
      clean_sheets = final_stats.clean_sheets,
      matches_played = final_stats.matches_played,
      matches_appeared = final_stats.matches_played
  FROM final_stats
  WHERE ps.player_id = final_stats.player_id
    AND ps.tournament_id = v_match.tournament_id;

END;
$$;
