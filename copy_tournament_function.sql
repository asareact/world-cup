CREATE OR REPLACE FUNCTION copy_tournament(original_tournament_id UUID, new_tournament_name TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  new_tournament_uuid UUID;
  original_tournament_record RECORD;
BEGIN
  SELECT * INTO original_tournament_record FROM tournaments WHERE id = original_tournament_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Torneo original no encontrado: %', original_tournament_id;
  END IF;

  new_tournament_uuid := gen_random_uuid();

  INSERT INTO tournaments (
    id, name, description, creator_id, status, format, max_teams,
    start_date, end_date, registration_deadline, rules,
    prize_description, is_public, created_at, updated_at,
    registration_mode, requires_approval
  )
  SELECT
    new_tournament_uuid,
    COALESCE(new_tournament_name, name || ' (Copia)'),
    description, creator_id, 'draft', format, max_teams,
    start_date, end_date, registration_deadline, rules,
    prize_description, is_public, now(), now(),
    registration_mode, requires_approval
  FROM tournaments WHERE id = original_tournament_id;

  INSERT INTO tournament_teams (
    tournament_id, team_id, registered_at, status, group_name
  )
  SELECT
    new_tournament_uuid,
    team_id,
    registered_at,
    status,
    group_name
  FROM tournament_teams
  WHERE tournament_id = original_tournament_id;

  INSERT INTO matches (
    id, tournament_id, home_team_id, away_team_id, scheduled_at,
    venue, round_name, status, home_score, away_score,
    winner_team_id, notes, created_at, updated_at,
    home_keeper_id, away_keeper_id
  )
  SELECT
    gen_random_uuid(),
    new_tournament_uuid,
    home_team_id, away_team_id, scheduled_at,
    venue, round_name, status, home_score, away_score,
    winner_team_id, notes, created_at, updated_at,
    home_keeper_id, away_keeper_id
  FROM matches
  WHERE tournament_id = original_tournament_id;

  INSERT INTO match_events (
    id, match_id, player_id, team_id, event_type,
    minute, description, created_at, assist_player_id, event_subtype
  )
  SELECT
    gen_random_uuid(),
    m2.id,
    me.player_id,
    me.team_id,
    me.event_type,
    me.minute,
    me.description,
    now(),
    me.assist_player_id,
    me.event_subtype
  FROM match_events me
  JOIN matches m1 ON me.match_id = m1.id
  JOIN matches m2 ON m2.tournament_id = new_tournament_uuid
    AND m1.home_team_id = m2.home_team_id
    AND m1.away_team_id = m2.away_team_id
    AND m1.scheduled_at = m2.scheduled_at
  WHERE m1.tournament_id = original_tournament_id;

  INSERT INTO match_player_participation (
    match_id, player_id, tournament_id, team_id, created_at
  )
  SELECT
    m2.id,
    mpp.player_id,
    new_tournament_uuid,
    mpp.team_id,
    mpp.created_at
  FROM match_player_participation mpp
  JOIN matches m1 ON mpp.match_id = m1.id
  JOIN matches m2 ON m2.tournament_id = new_tournament_uuid
    AND m1.home_team_id = m2.home_team_id
    AND m1.away_team_id = m2.away_team_id
    AND m1.scheduled_at = m2.scheduled_at
  WHERE m1.tournament_id = original_tournament_id;

  INSERT INTO player_stats (
    id, player_id, tournament_id, goals, assists,
    yellow_cards, red_cards, matches_played, minutes_played,
    saves_made, goals_conceded, clean_sheets, matches_appeared
  )
  SELECT
    gen_random_uuid(),
    ps.player_id,
    new_tournament_uuid,
    ps.goals, ps.assists,
    ps.yellow_cards, ps.red_cards, ps.matches_played, ps.minutes_played,
    ps.saves_made, ps.goals_conceded, ps.clean_sheets, ps.matches_appeared
  FROM player_stats ps
  WHERE ps.tournament_id = original_tournament_id;

  INSERT INTO player_suspensions (
    id, player_id, tournament_id, match_id, reason,
    suspension_type, suspension_matches, served, created_at
  )
  SELECT
    gen_random_uuid(),
    ps.player_id,
    new_tournament_uuid,
    NULL,
    ps.reason,
    ps.suspension_type, ps.suspension_matches, ps.served, now()
  FROM player_suspensions ps
  WHERE ps.tournament_id = original_tournament_id;

  RETURN new_tournament_uuid;
END;
$$;