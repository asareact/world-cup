-- Function to finalize a match, save all events, and update all related player stats.
-- This is a transactional function that guarantees data consistency.
CREATE OR REPLACE FUNCTION finalize_match(
    p_match_id UUID,
    p_home_score INT,
    p_away_score INT,
    p_events JSONB,
    p_player_ids UUID[] -- Array of all players who participated in the match
)
RETURNS VOID AS $$
DECLARE
    v_tournament_id UUID;
    event JSONB;
    v_player_id UUID;
    v_event_type TEXT;
BEGIN
    -- First, get the tournament_id from the match, which is needed for player_stats
    SELECT tournament_id INTO v_tournament_id FROM public.matches WHERE id = p_match_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Match with id % not found', p_match_id;
    END IF;

    -- Step 1: Delete existing events for this match to ensure idempotency.
    DELETE FROM public.match_events WHERE match_id = p_match_id;

    -- Step 2: Insert new events and update player_stats for each event.
    IF p_events IS NOT NULL THEN
        FOR event IN SELECT * FROM jsonb_array_elements(p_events)
        LOOP
            v_player_id := (event->>'player_id')::UUID;
            v_event_type := (event->>'event_type')::TEXT;

            -- Insert the raw event
            INSERT INTO public.match_events (match_id, player_id, team_id, event_type, minute)
            VALUES (p_match_id, v_player_id, (event->>'team_id')::UUID, v_event_type, (event->>'minute')::INT);

            -- Ensure a player_stats row exists for the event player.
            INSERT INTO public.player_stats (player_id, tournament_id) VALUES (v_player_id, v_tournament_id)
            ON CONFLICT (player_id, tournament_id) DO NOTHING;

            -- Apply the specific stat update based on the event type
            CASE v_event_type
                WHEN 'goal' THEN
                    UPDATE public.player_stats SET goals = goals + 1 WHERE player_id = v_player_id AND tournament_id = v_tournament_id;
                WHEN 'assist' THEN
                    UPDATE public.player_stats SET assists = assists + 1 WHERE player_id = v_player_id AND tournament_id = v_tournament_id;
                WHEN 'yellow_card' THEN
                    UPDATE public.player_stats SET yellow_cards = yellow_cards + 1 WHERE player_id = v_player_id AND tournament_id = v_tournament_id;
                WHEN 'red_card' THEN
                    UPDATE public.player_stats SET red_cards = red_cards + 1 WHERE player_id = v_player_id AND tournament_id = v_tournament_id;
                ELSE
                    -- For 'own_goal' or other types, we don't attribute a stat to the player.
            END CASE;
        END LOOP;
    END IF;

    -- Step 3: Update matches_played for all players involved in the match.
    IF array_length(p_player_ids, 1) > 0 THEN
        -- Ensure stats rows exist for all players in the match
        INSERT INTO public.player_stats (player_id, tournament_id)
        SELECT player_id, v_tournament_id FROM unnest(p_player_ids) as player_id
        ON CONFLICT (player_id, tournament_id) DO NOTHING;

        -- Increment the matches_played count
        UPDATE public.player_stats
        SET matches_played = matches_played + 1
        WHERE tournament_id = v_tournament_id AND player_id = ANY(p_player_ids);
    END IF;

    -- Step 4: Update the match with the final score and status.
    UPDATE public.matches
    SET
        home_score = p_home_score,
        away_score = p_away_score,
        status = 'completed',
        updated_at = NOW()
    WHERE id = p_match_id;

END;
$$ LANGUAGE plpgsql;
