-- Script de Análisis para Doble Amarilla (Red Card por acumulación de 2 amarillas)
-- Este archivo contiene consultas SQL para identificar jugadores que recibieron
-- doble amarilla (2 tarjetas amarillas en el mismo partido) pero que no fueron
-- registrados correctamente en la tabla de suspensiones

-- PASO 1: Identificar jugadores con doble amarilla sin registro de suspensión
-- Esta consulta mostrará todos los jugadores que recibieron 2 o más tarjetas
-- amarillas en el mismo partido pero que no tienen registro de suspensión por
-- doble amarilla en la tabla player_suspensions
-- NOTA: Este es el caso principal que queremos detectar: doble amarilla sin suspensión
----------------------------------------------------------------------------------
WITH players_with_two_or_more_yellows AS (
  -- Paso 1a: Encontrar jugadores que recibieron 2 o más tarjetas amarillas en el mismo partido
  SELECT 
    me.match_id,
    m.tournament_id,
    me.player_id,
    p.name AS player_name,
    t.name AS tournament_name,
    m.scheduled_at,
    m.home_team_id,
    m.away_team_id,
    h_team.name AS home_team_name,
    a_team.name AS away_team_name,
    COUNT(me.id) AS yellow_card_count,
    STRING_AGG(
      CONCAT('Minuto: ', COALESCE(me.minute::text, 'N/A'), 
             ' - ', COALESCE(me.description, 'Sin descripción')), 
      '; ' ORDER BY me.minute
    ) AS yellow_card_details
  FROM public.match_events me
  JOIN public.matches m ON m.id = me.match_id
  JOIN public.players p ON p.id = me.player_id
  JOIN public.tournaments t ON t.id = m.tournament_id
  JOIN public.teams h_team ON h_team.id = m.home_team_id
  JOIN public.teams a_team ON a_team.id = m.away_team_id
  WHERE me.event_type = 'yellow_card'
  GROUP BY me.match_id, m.tournament_id, me.player_id, p.name, t.name, m.scheduled_at, 
           m.home_team_id, m.away_team_id, h_team.name, a_team.name
  HAVING COUNT(me.id) >= 2
),
suspension_check AS (
  -- Paso 1b: Verificar si ya tienen suspensión registrada por doble amarilla
  SELECT 
    pwy.*,
    CASE 
      WHEN ps.id IS NOT NULL THEN TRUE 
      ELSE FALSE 
    END AS has_suspension_record
  FROM players_with_two_or_more_yellows pwy
  LEFT JOIN public.player_suspensions ps ON (
    ps.player_id = pwy.player_id 
    AND ps.match_id = pwy.match_id 
    AND ps.suspension_type = 'red_two_yellow'  -- Tipo específico para doble amarilla
  )
)
-- Paso 1c: Resultado - mostrar únicamente los casos donde falta el registro de suspensión
SELECT 
  sc.player_id,
  sc.player_name,
  sc.match_id,
  sc.tournament_id,
  sc.tournament_name,
  CONCAT(sc.home_team_name, ' vs ', sc.away_team_name) AS match_info,
  sc.scheduled_at,
  sc.yellow_card_count,
  sc.yellow_card_details,
  sc.has_suspension_record,
  -- Datos necesarios para crear el registro faltante
  CONCAT(
    'INSERT INTO player_suspensions (player_id, tournament_id, match_id, suspension_type, suspension_matches, reason, served) VALUES (''',
    sc.player_id, ''', ''', sc.tournament_id, ''', ''', sc.match_id, ''', ''red_two_yellow'', 1, ''Acumulación de dos tarjetas amarillas en el mismo partido que resulta en roja'', FALSE);'
  ) AS insert_command
FROM suspension_check sc
WHERE sc.has_suspension_record = FALSE
ORDER BY sc.scheduled_at DESC, sc.tournament_name, sc.player_name;

-- PASO 2: Verificación adicional - Ver todos los registros de suspensión por doble amarilla
-- Esta consulta es para verificar qué registros ya existen en la tabla de suspensiones
-- para tener una visión completa del estado actual
----------------------------------------------------------------------------------
/*
SELECT 
  ps.id,
  ps.player_id,
  p.name AS player_name,
  ps.tournament_id,
  ps.match_id,
  m.scheduled_at,
  CONCAT(h_team.name, ' vs ', a_team.name) AS match_info,
  ps.suspension_type,
  ps.suspension_matches,
  ps.reason,
  ps.served,
  ps.created_at
FROM public.player_suspensions ps
JOIN public.players p ON p.id = ps.player_id
JOIN public.matches m ON m.id = ps.match_id
JOIN public.teams h_team ON h_team.id = m.home_team_id
JOIN public.teams a_team ON a_team.id = m.away_team_id
WHERE ps.suspension_type = 'red_two_yellow'
ORDER BY ps.created_at DESC;
*/

-- PASO 3: Consulta para verificar la integridad de los datos
-- Esta consulta verifica si los eventos de tarjeta roja están alineados con los
-- eventos de doble amarilla ya que en la lógica actual no se crean eventos reales de roja
-- por doble amarilla, solo se registra la suspensión
----------------------------------------------------------------------------------
/*
WITH double_yellow_matches AS (
  SELECT 
    me.match_id,
    me.player_id,
    COUNT(me.id) AS yellow_count
  FROM public.match_events me
  WHERE me.event_type = 'yellow_card'
  GROUP BY me.match_id, me.player_id
  HAVING COUNT(me.id) >= 2
)
SELECT 
  dym.match_id,
  dym.player_id,
  dym.yellow_count,
  p.name AS player_name,
  -- Contar tarjetas rojas directas para el mismo jugador en el mismo partido
  (SELECT COUNT(*) 
   FROM public.match_events me2 
   WHERE me2.match_id = dym.match_id 
   AND me2.player_id = dym.player_id 
   AND me2.event_type = 'red_card') AS red_cards_direct
FROM double_yellow_matches dym
JOIN public.players p ON p.id = dym.player_id
ORDER BY dym.match_id, dym.player_id;
*/

-- INSTRUCCIONES DE USO:
-- 
-- 1. Ejecuta la primera consulta (PASO 1) para identificar casos donde falta 
--    el registro de suspensión por doble amarilla
-- 
-- 2. Examina los resultados para confirmar que realmente se trató de una
--    doble amarilla (ver la columna yellow_card_details)
-- 
-- 3. Si confirmas que falta el registro de suspensión, puedes usar los comandos
--    INSERT generados en la columna insert_command para agregar manualmente
--    las suspensiones faltantes
-- 
-- 4. Opcionalmente, puedes descomentar y ejecutar las consultas en PASO 2 y PASO 3
--    para tener una visión más completa del estado actual de suspensiones
-- 
-- NOTA: Recuerda hacer un respaldo de tu base de datos antes de realizar 
-- inserciones manuales en la tabla de suspensiones.

-- Fin del script