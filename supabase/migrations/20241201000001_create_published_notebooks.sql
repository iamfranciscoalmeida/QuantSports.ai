CREATE TABLE IF NOT EXISTS published_notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sport TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  roi DECIMAL(10,2) DEFAULT 0,
  sharpe DECIMAL(10,2) DEFAULT 0,
  code TEXT NOT NULL,
  summary TEXT,
  is_public BOOLEAN DEFAULT true,
  fork_count INTEGER DEFAULT 0,
  notebook_cells JSONB DEFAULT '[]',
  performance_data JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_published_notebooks_sport ON published_notebooks(sport);
CREATE INDEX IF NOT EXISTS idx_published_notebooks_roi ON published_notebooks(roi DESC);
CREATE INDEX IF NOT EXISTS idx_published_notebooks_created_at ON published_notebooks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_published_notebooks_is_public ON published_notebooks(is_public);
CREATE INDEX IF NOT EXISTS idx_published_notebooks_author_id ON published_notebooks(author_id);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

alter publication supabase_realtime add table published_notebooks;
alter publication supabase_realtime add table users;
