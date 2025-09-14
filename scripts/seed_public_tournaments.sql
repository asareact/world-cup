-- Seed de torneos públicos con equipos y partidos
-- Uso: pega este script en el editor SQL de Supabase y ejecútalo.
-- Nota: requiere que exista al menos un usuario en auth.users. Preferirá un superAdmin de profiles.

DO $$
DECLARE
  admin_id uuid;
  team1 uuid; team2 uuid; team3 uuid; team4 uuid; team5 uuid; team6 uuid;
  t_round_robin uuid; t_groups uuid; t_single_elim uuid;
BEGIN
  -- Elegir un usuario para ser creador de los torneos y equipos
  -- Preferir user_profiles (si existe), luego profiles, y por último cualquier usuario de auth.users
  BEGIN
    SELECT up.id INTO admin_id
    FROM public.user_profiles up
    WHERE up.role = 'superAdmin'
    LIMIT 1;
  EXCEPTION WHEN undefined_table THEN
    admin_id := NULL; -- Tabla user_profiles no existe; seguimos con fallback
  END;

  IF admin_id IS NULL THEN
    BEGIN
      SELECT p.id INTO admin_id
      FROM public.profiles p
      WHERE p.role = 'superAdmin'
      LIMIT 1;
    EXCEPTION WHEN undefined_table THEN
      admin_id := NULL; -- Tabla profiles no existe; seguimos con fallback
    END;
  END IF;

  IF admin_id IS NULL THEN
    SELECT u.id INTO admin_id FROM auth.users u LIMIT 1;
  END IF;

  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'No existen usuarios en auth.users. Crea un usuario primero.';
  END IF;

  -- Crear equipos base
  INSERT INTO public.teams (name, description, logo_url, captain_id, created_by, contact_email, contact_phone)
  VALUES
    ('Futsal Titans', 'Equipo competitivo con juego de posesión', NULL, admin_id, admin_id, 'titans@futsal.pro', '+34 600 111 111')
  RETURNING id INTO team1;

  INSERT INTO public.teams (name, description, logo_url, captain_id, created_by, contact_email, contact_phone)
  VALUES
    ('Rápidos FC', 'Transiciones rápidas y presión alta', NULL, admin_id, admin_id, 'rapidos@futsal.pro', '+34 600 222 222')
  RETURNING id INTO team2;

  INSERT INTO public.teams (name, description, logo_url, captain_id, created_by, contact_email, contact_phone)
  VALUES
    ('Leones de Barrio', 'Intensidad y garra en defensa', NULL, admin_id, admin_id, 'leones@futsal.pro', '+34 600 333 333')
  RETURNING id INTO team3;

  INSERT INTO public.teams (name, description, logo_url, captain_id, created_by, contact_email, contact_phone)
  VALUES
    ('Vikings 5', 'Juego directo y remate exterior', NULL, admin_id, admin_id, 'vikings@futsal.pro', '+34 600 444 444')
  RETURNING id INTO team4;

  INSERT INTO public.teams (name, description, logo_url, captain_id, created_by, contact_email, contact_phone)
  VALUES
    ('Panteras Negras', 'Posesión paciente y rotaciones', NULL, admin_id, admin_id, 'panteras@futsal.pro', '+34 600 555 555')
  RETURNING id INTO team5;

  INSERT INTO public.teams (name, description, logo_url, captain_id, created_by, contact_email, contact_phone)
  VALUES
    ('Cóndores', 'Ataques por bandas y diagonales', NULL, admin_id, admin_id, 'condores@futsal.pro', '+34 600 666 666')
  RETURNING id INTO team6;

  -- Torneo 1: Round Robin (activo)
  INSERT INTO public.tournaments (
    name, description, creator_id, status, format, max_teams,
    start_date, end_date, registration_deadline, rules, prize_description, is_public
  ) VALUES (
    'Liga Metropolitana Futsal', 'Todos contra todos a doble vuelta', admin_id, 'active', 'round_robin', 6,
    NOW() - INTERVAL '7 days', NOW() + INTERVAL '21 days', NOW() - INTERVAL '10 days',
    'Reglas FIFA Futsal, 2x20 cronometrado', 'Trofeo + medallas', true
  ) RETURNING id INTO t_round_robin;

  -- Inscripciones
  INSERT INTO public.tournament_teams (tournament_id, team_id, status) VALUES
    (t_round_robin, team1, 'confirmed'),
    (t_round_robin, team2, 'confirmed'),
    (t_round_robin, team3, 'confirmed'),
    (t_round_robin, team4, 'confirmed');

  -- Partidos programados / jugados
  INSERT INTO public.matches (
    tournament_id, home_team_id, away_team_id, scheduled_at, venue, round_name, status, home_score, away_score, winner_team_id
  ) VALUES
    (t_round_robin, team1, team2, NOW() - INTERVAL '2 days', 'Pabellón Central', 'Jornada 1', 'completed', 3, 2, team1),
    (t_round_robin, team3, team4, NOW() - INTERVAL '2 days', 'Pabellón Central', 'Jornada 1', 'completed', 1, 1, NULL),
    (t_round_robin, team2, team3, NOW() + INTERVAL '2 days', 'Pista Norte', 'Jornada 2', 'scheduled', 0, 0, NULL);

  -- Torneo 2: Grupos (pausado)
  INSERT INTO public.tournaments (
    name, description, creator_id, status, format, max_teams,
    start_date, end_date, registration_deadline, rules, prize_description, is_public
  ) VALUES (
    'Copa Invierno Futsal', 'Fase de grupos + eliminatorias', admin_id, 'paused', 'groups', 8,
    NOW() + INTERVAL '5 days', NOW() + INTERVAL '40 days', NOW() + INTERVAL '2 days',
    '2x20, 1 time out por parte', 'Premios en especie', true
  ) RETURNING id INTO t_groups;

  -- Inscripciones con grupos
  INSERT INTO public.tournament_teams (tournament_id, team_id, status, group_name) VALUES
    (t_groups, team1, 'registered', 'Grupo A'),
    (t_groups, team2, 'registered', 'Grupo A'),
    (t_groups, team5, 'registered', 'Grupo B'),
    (t_groups, team6, 'registered', 'Grupo B');

  -- Partidos de grupos programados
  INSERT INTO public.matches (
    tournament_id, home_team_id, away_team_id, scheduled_at, venue, round_name, status
  ) VALUES
    (t_groups, team1, team2, NOW() + INTERVAL '7 days', 'Polideportivo Sur', 'Grupo A - J1', 'scheduled'),
    (t_groups, team5, team6, NOW() + INTERVAL '7 days', 'Polideportivo Sur', 'Grupo B - J1', 'scheduled');

  -- Torneo 3: Eliminación Directa (borrador)
  INSERT INTO public.tournaments (
    name, description, creator_id, status, format, max_teams,
    start_date, end_date, registration_deadline, rules, prize_description, is_public
  ) VALUES (
    'Open Primavera Futsal', 'Eliminación directa a partido único', admin_id, 'draft', 'single_elimination', 4,
    NULL, NULL, NOW() + INTERVAL '10 days',
    'Cambios ilimitados, faltas acumuladas', 'Inscripción gratuita', true
  ) RETURNING id INTO t_single_elim;

  -- Inscripciones iniciales
  INSERT INTO public.tournament_teams (tournament_id, team_id, status) VALUES
    (t_single_elim, team3, 'registered'),
    (t_single_elim, team4, 'registered');

END $$;
