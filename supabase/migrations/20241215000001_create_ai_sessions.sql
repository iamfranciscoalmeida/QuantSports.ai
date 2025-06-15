-- Create AI Sessions table for persistent memory
CREATE TABLE IF NOT EXISTS ai_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    notebook_id TEXT,
    context JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    messages JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS ai_sessions_user_id_idx ON ai_sessions(user_id);
CREATE INDEX IF NOT EXISTS ai_sessions_notebook_id_idx ON ai_sessions(notebook_id);
CREATE INDEX IF NOT EXISTS ai_sessions_user_notebook_idx ON ai_sessions(user_id, notebook_id);
CREATE INDEX IF NOT EXISTS ai_sessions_updated_at_idx ON ai_sessions(updated_at DESC);

-- Create unique constraint for user-notebook combination
CREATE UNIQUE INDEX IF NOT EXISTS ai_sessions_user_notebook_unique 
ON ai_sessions(user_id, COALESCE(notebook_id, ''));

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS ai_sessions_updated_at_trigger ON ai_sessions;
CREATE TRIGGER ai_sessions_updated_at_trigger
    BEFORE UPDATE ON ai_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_sessions_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own sessions
CREATE POLICY "Users can manage their own AI sessions" ON ai_sessions
    FOR ALL USING (auth.uid()::text = user_id);

-- Grant necessary permissions
GRANT ALL ON ai_sessions TO authenticated;
GRANT ALL ON ai_sessions TO service_role;

-- Add comments for documentation
COMMENT ON TABLE ai_sessions IS 'Stores AI assistant conversation history and context for users';
COMMENT ON COLUMN ai_sessions.user_id IS 'User identifier (can be auth.uid() or anonymous ID)';
COMMENT ON COLUMN ai_sessions.notebook_id IS 'Optional notebook identifier for scoped conversations';
COMMENT ON COLUMN ai_sessions.context IS 'Current session context (team preferences, strategy settings, etc.)';
COMMENT ON COLUMN ai_sessions.preferences IS 'User AI preferences (provider, model, behavior settings)';
COMMENT ON COLUMN ai_sessions.messages IS 'Array of conversation messages with role, content, and timestamp'; 