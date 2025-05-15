-- Create database if it doesn't exist
CREATE DATABASE tris_game;

-- Connect to the database
\c tris_game;

-- Create enum types
CREATE TYPE game_status AS ENUM ('waiting', 'in_progress', 'completed', 'abandoned');

-- Create users table
CREATE TABLE IF NOT EXISTS "user" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname VARCHAR(20) UNIQUE NOT NULL,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  games_lost INTEGER DEFAULT 0,
  games_tied INTEGER DEFAULT 0,
  is_online BOOLEAN DEFAULT FALSE,
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create games table
CREATE TABLE IF NOT EXISTS game (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_x_id UUID REFERENCES "user"(id),
  player_o_id UUID REFERENCES "user"(id),
  status game_status DEFAULT 'waiting',
  winner_id UUID REFERENCES "user"(id),
  is_draw BOOLEAN DEFAULT FALSE,
  current_turn VARCHAR(1) DEFAULT 'X',
  board JSONB DEFAULT '[
    [null, null, null],
    [null, null, null],
    [null, null, null]
  ]'::jsonb,
  move_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create moves table
CREATE TABLE IF NOT EXISTS move (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES game(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES "user"(id),
  row INTEGER NOT NULL,
  col INTEGER NOT NULL,
  symbol VARCHAR(1) NOT NULL,
  is_undone BOOLEAN DEFAULT FALSE,
  move_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_game_status ON game(status);
CREATE INDEX idx_game_player_x ON game(player_x_id);
CREATE INDEX idx_game_player_o ON game(player_o_id);
CREATE INDEX idx_move_game ON move(game_id);
CREATE INDEX idx_move_player ON move(player_id);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_user_updated_at
BEFORE UPDATE ON "user"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_updated_at
BEFORE UPDATE ON game
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
