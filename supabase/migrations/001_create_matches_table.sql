-- Create matches table for EPL historical data
CREATE TABLE if not exists matches (
  id SERIAL PRIMARY KEY,
  match_id TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  result_home INTEGER,
  result_away INTEGER,
  odds_opening JSONB,
  odds_closing JSONB,
  xg JSONB,
  market TEXT DEFAULT '1X2',
  league TEXT DEFAULT 'Premier League',
  season TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_team_date ON matches(home_team, away_team, date);
CREATE INDEX IF NOT EXISTS idx_matches_league_date ON matches(league, date);
CREATE INDEX IF NOT EXISTS idx_matches_season ON matches(season);
CREATE INDEX IF NOT EXISTS idx_matches_match_id ON matches(match_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE OR REPLACE TRIGGER update_matches_updated_at 
    BEFORE UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create team metadata table for normalization
CREATE TABLE if not exists teams (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  aliases TEXT[], -- Array of alternative names
  league TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);



-- Enable Row Level Security
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
DROP POLICY IF EXISTS "Allow public read access on matches" ON matches;
CREATE POLICY "Allow public read access on matches" ON matches
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on teams" ON teams;
CREATE POLICY "Allow public read access on teams" ON teams
  FOR SELECT USING (true);