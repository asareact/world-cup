-- 🏆 FUTSALPRO - Script para Generar Eventos de Partidos con Asistencias (Versión Corregida)
-- Este script inserta eventos de partidos con goles, asistencias y tarjetas

-- Verificar que las extensiones estén aplicadas
-- Aseguramos que la columna assist_player_id exista
ALTER TABLE public.match_events ADD COLUMN IF NOT EXISTS assist_player_id UUID;

-- Agregar la restricción de clave foránea si no existe
DO $$ 
BEGIN
  -- Verificamos si la restricción ya existe
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'match_events_assist_player_id_fkey' 
    AND table_name = 'match_events'
  ) THEN
    ALTER TABLE public.match_events 
    ADD CONSTRAINT match_events_assist_player_id_fkey 
    FOREIGN KEY (assist_player_id) REFERENCES players(id);
  END IF;
END $$;

-- Función para insertar eventos de ejemplo con asistencias
DO $$
DECLARE
    match_rec RECORD;  -- Cambiado de match_record a match_rec para evitar ambigüedad
    player1 UUID;
    player2 UUID;
    player3 UUID;
    player4 UUID;
    player5 UUID;
    player6 UUID;
    player7 UUID;
    player8 UUID;
    player9 UUID;
    player10 UUID;
    home_team_id_var UUID;
    away_team_id_var UUID;
    random_minute INTEGER;
    event_count INTEGER;
    i INTEGER;
BEGIN
    -- Obtener los IDs de partidos existentes
    FOR match_rec IN 
        SELECT m.id AS match_id, m.home_team_id AS home_team_id_val, m.away_team_id AS away_team_id_val 
        FROM matches m 
        WHERE m.status != 'cancelled'
    LOOP
        -- Asignar a variables locales con nombres diferentes
        home_team_id_var := match_rec.home_team_id_val;
        away_team_id_var := match_rec.away_team_id_val;
        
        -- Obtener jugadores del equipo local
        SELECT id INTO player1 FROM players WHERE team_id = home_team_id_var LIMIT 1 OFFSET 0;
        SELECT id INTO player2 FROM players WHERE team_id = home_team_id_var LIMIT 1 OFFSET 1;
        SELECT id INTO player3 FROM players WHERE team_id = home_team_id_var LIMIT 1 OFFSET 2;
        SELECT id INTO player4 FROM players WHERE team_id = home_team_id_var LIMIT 1 OFFSET 3;
        SELECT id INTO player5 FROM players WHERE team_id = home_team_id_var LIMIT 1 OFFSET 4;
        
        -- Obtener jugadores del equipo visitante
        SELECT id INTO player6 FROM players WHERE team_id = away_team_id_var LIMIT 1 OFFSET 0;
        SELECT id INTO player7 FROM players WHERE team_id = away_team_id_var LIMIT 1 OFFSET 1;
        SELECT id INTO player8 FROM players WHERE team_id = away_team_id_var LIMIT 1 OFFSET 2;
        SELECT id INTO player9 FROM players WHERE team_id = away_team_id_var LIMIT 1 OFFSET 3;
        SELECT id INTO player10 FROM players WHERE team_id = away_team_id_var LIMIT 1 OFFSET 4;
        
        -- Generar entre 3 y 8 eventos por partido
        event_count := FLOOR(RANDOM() * 6 + 3)::INTEGER;
        
        FOR i IN 1..event_count LOOP
            random_minute := FLOOR(RANDOM() * 91)::INTEGER;
            
            -- Generar un evento aleatorio
            CASE FLOOR(RANDOM() * 100)::INTEGER
                WHEN 0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19 THEN -- 20% - Gol del equipo local
                    IF player1 IS NOT NULL AND player2 IS NOT NULL THEN
                        INSERT INTO match_events (match_id, player_id, team_id, event_type, minute, assist_player_id, description)
                        VALUES (match_rec.match_id, player1, home_team_id_var, 'goal', random_minute, player2, 'Gol del equipo local con asistencia');
                    END IF;
                WHEN 20,21,22,23,24,25,26,27,28,29,30,31,32,33 THEN -- 14% - Gol del equipo visitante
                    IF player6 IS NOT NULL AND player7 IS NOT NULL THEN
                        INSERT INTO match_events (match_id, player_id, team_id, event_type, minute, assist_player_id, description)
                        VALUES (match_rec.match_id, player6, away_team_id_var, 'goal', random_minute, player7, 'Gol del equipo visitante con asistencia');
                    END IF;
                WHEN 34,35,36,37 THEN -- 4% - Gol en propia puerta
                    IF player1 IS NOT NULL THEN
                        INSERT INTO match_events (match_id, player_id, team_id, event_type, minute, assist_player_id, description)
                        VALUES (match_rec.match_id, player1, home_team_id_var, 'own_goal', random_minute, NULL, 'Gol en propia puerta');
                    ELSIF player6 IS NOT NULL THEN
                        INSERT INTO match_events (match_id, player_id, team_id, event_type, minute, assist_player_id, description)
                        VALUES (match_rec.match_id, player6, away_team_id_var, 'own_goal', random_minute, NULL, 'Gol en propia puerta');
                    END IF;
                WHEN 38,39,40,41 THEN -- 4% - Asistencia (evento aparte)
                    IF player2 IS NOT NULL THEN
                        INSERT INTO match_events (match_id, player_id, team_id, event_type, minute, assist_player_id, description)
                        VALUES (match_rec.match_id, player2, home_team_id_var, 'assist', random_minute, NULL, 'Asistencia registrada');
                    END IF;
                WHEN 42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63 THEN -- 22% - Tarjeta amarilla
                    IF RANDOM() > 0.5 AND player1 IS NOT NULL THEN
                        INSERT INTO match_events (match_id, player_id, team_id, event_type, minute, assist_player_id, description)
                        VALUES (match_rec.match_id, player1, home_team_id_var, 'yellow_card', random_minute, NULL, 'Tarjeta amarilla');
                    ELSIF player6 IS NOT NULL THEN
                        INSERT INTO match_events (match_id, player_id, team_id, event_type, minute, assist_player_id, description)
                        VALUES (match_rec.match_id, player6, away_team_id_var, 'yellow_card', random_minute, NULL, 'Tarjeta amarilla');
                    END IF;
                WHEN 64,65,66,67,68,69,70,71 THEN -- 8% - Tarjeta roja
                    IF RANDOM() > 0.5 AND player2 IS NOT NULL THEN
                        INSERT INTO match_events (match_id, player_id, team_id, event_type, minute, assist_player_id, description)
                        VALUES (match_rec.match_id, player2, home_team_id_var, 'red_card', random_minute, NULL, 'Tarjeta roja');
                    ELSIF player7 IS NOT NULL THEN
                        INSERT INTO match_events (match_id, player_id, team_id, event_type, minute, assist_player_id, description)
                        VALUES (match_rec.match_id, player7, away_team_id_var, 'red_card', random_minute, NULL, 'Tarjeta roja');
                    END IF;
                ELSE -- Otros eventos
                    IF RANDOM() > 0.5 AND player3 IS NOT NULL THEN
                        INSERT INTO match_events (match_id, player_id, team_id, event_type, minute, description)
                        VALUES (match_rec.match_id, player3, home_team_id_var, 'goal', random_minute, 'Gol sin asistencia');
                    ELSIF player8 IS NOT NULL THEN
                        INSERT INTO match_events (match_id, player_id, team_id, event_type, minute, description)
                        VALUES (match_rec.match_id, player8, away_team_id_var, 'goal', random_minute, 'Gol sin asistencia');
                    END IF;
            END CASE;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '✅ Eventos de partidos generados exitosamente';
END $$;

-- Mensaje de confirmación
SELECT '✅ Eventos de partidos con asistencias generados exitosamente. Ahora puedes visualizar las estadísticas con nombres de jugadores en la interfaz.' AS mensaje;

-- Consulta de ejemplo para verificar asistencias registradas
/*
SELECT 
    me.match_id,
    me.player_id,
    p.name as player_name,
    t.name as team_name,
    me.event_type,
    me.minute,
    me.assist_player_id,
    ap.name as assist_player_name
FROM match_events me
JOIN players p ON me.player_id = p.id
JOIN teams t ON me.team_id = t.id
LEFT JOIN players ap ON me.assist_player_id = ap.id
WHERE me.event_type = 'goal' AND me.assist_player_id IS NOT NULL
LIMIT 10;
*/