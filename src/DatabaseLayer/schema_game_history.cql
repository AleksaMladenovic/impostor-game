-- ================================================
-- CASSANDRA SCHEMA ZA GAME HISTORY
-- ================================================
-- Tabele za čuvanje istorije igara sa mogućnošću replaya

-- Glavna tabela za čuvanje osnovnih info o igri
CREATE TABLE IF NOT EXISTS game_history (
    game_id uuid PRIMARY KEY,
    room_id text,
    players text,  -- JSON lista igrača
    end_time timestamp,
    created_at timestamp
);

-- Tabela za sve događaje igre sa vremenom
-- Omogućava query sa range na timestamp
CREATE TABLE IF NOT EXISTS game_events (
    game_id uuid,
    event_time timestamp,
    event_type text,  -- "message", "clue", "vote"
    event_round int,
    username text,
    voter text,
    target text,
    content text,
    PRIMARY KEY (game_id, event_time)
) WITH CLUSTERING ORDER BY (event_time ASC);

-- Pomoćna tabela za bitne događaje (clue/vote)
CREATE TABLE IF NOT EXISTS game_significant_events (
    game_id uuid,
    event_time timestamp,
    event_type text,  -- "clue", "vote"
    event_round int,
    username text,
    voter text,
    target text,
    content text,
    PRIMARY KEY (game_id, event_time)
) WITH CLUSTERING ORDER BY (event_time ASC);

-- Pomoćna tabela za brzu pretragu igara po korisniku
CREATE TABLE IF NOT EXISTS game_history_by_user (
    username text,
    end_time timestamp,
    game_id uuid,
    room_id text,
    PRIMARY KEY (username, end_time, game_id)
) WITH CLUSTERING ORDER BY (end_time DESC, game_id DESC);

-- Indeksi
CREATE INDEX IF NOT EXISTS idx_game_events_type ON game_events (event_type);
CREATE INDEX IF NOT EXISTS idx_game_history_room_id ON game_history (room_id);
CREATE INDEX IF NOT EXISTS idx_game_significant_events_type ON game_significant_events (event_type);
