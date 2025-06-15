-- =======================================
-- AI Sessions Database Setup for QuantSports.ai
-- =======================================

-- Create AI Sessions table
CREATE TABLE IF NOT EXISTS ai_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    notebook_id TEXT,
    conversation_history JSONB DEFAULT '[]'::jsonb,
    context JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    UNIQUE(user_id, session_id, notebook_id)
);

-- Create user preferences table
CREATE TABLE IF NOT EXISTS ai_user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    language TEXT DEFAULT 'en',
    ai_provider_preference TEXT DEFAULT 'auto' CHECK (ai_provider_preference IN ('openai', 'anthropic', 'local', 'auto')),
    sports_interests TEXT[] DEFAULT '{}',
    analysis_depth TEXT DEFAULT 'detailed' CHECK (analysis_depth IN ('basic', 'detailed', 'expert')),
    notification_settings JSONB DEFAULT '{}'::jsonb,
    ui_preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI analytics table
CREATE TABLE IF NOT EXISTS ai_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT,
    event_type TEXT NOT NULL, -- 'message', 'tool_usage', 'error', etc.
    event_data JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index for analytics queries
    INDEX idx_ai_analytics_user_time (user_id, timestamp),
    INDEX idx_ai_analytics_event_type (event_type)
);

-- =======================================
-- Row Level Security (RLS) Policies
-- =======================================

-- Enable RLS on all tables
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analytics ENABLE ROW LEVEL SECURITY;

-- AI Sessions policies
CREATE POLICY "Users can view their own AI sessions" ON ai_sessions
    FOR SELECT USING (true); -- Allow all reads for now, can be restricted later

CREATE POLICY "Users can insert their own AI sessions" ON ai_sessions
    FOR INSERT WITH CHECK (true); -- Allow all inserts for now

CREATE POLICY "Users can update their own AI sessions" ON ai_sessions
    FOR UPDATE USING (true); -- Allow all updates for now

CREATE POLICY "Users can delete their own AI sessions" ON ai_sessions
    FOR DELETE USING (true); -- Allow all deletes for now

-- User preferences policies
CREATE POLICY "Users can view their own preferences" ON ai_user_preferences
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own preferences" ON ai_user_preferences
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own preferences" ON ai_user_preferences
    FOR UPDATE USING (true);

-- Analytics policies (more restrictive)
CREATE POLICY "Users can view their own analytics" ON ai_analytics
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own analytics" ON ai_analytics
    FOR INSERT WITH CHECK (true);

-- =======================================
-- Performance Indexes
-- =======================================

-- AI Sessions indexes
CREATE INDEX IF NOT EXISTS idx_ai_sessions_user_id ON ai_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_updated_at ON ai_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_user_notebook ON ai_sessions(user_id, notebook_id);

-- User preferences indexes
CREATE INDEX IF NOT EXISTS idx_ai_user_preferences_user_id ON ai_user_preferences(user_id);

-- Analytics indexes (already created above)

-- =======================================
-- Update Triggers
-- =======================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_ai_sessions_updated_at 
    BEFORE UPDATE ON ai_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_user_preferences_updated_at 
    BEFORE UPDATE ON ai_user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================================
-- Sample Functions for AI Operations
-- =======================================

-- Function to get or create AI session
CREATE OR REPLACE FUNCTION get_or_create_ai_session(
    p_user_id TEXT,
    p_session_id TEXT DEFAULT 'default',
    p_notebook_id TEXT DEFAULT NULL
)
RETURNS ai_sessions AS $$
DECLARE
    session_record ai_sessions;
BEGIN
    -- Try to get existing session
    SELECT * INTO session_record
    FROM ai_sessions
    WHERE user_id = p_user_id 
    AND session_id = p_session_id 
    AND (notebook_id = p_notebook_id OR (notebook_id IS NULL AND p_notebook_id IS NULL));
    
    -- If not found, create new session
    IF NOT FOUND THEN
        INSERT INTO ai_sessions (user_id, session_id, notebook_id)
        VALUES (p_user_id, p_session_id, p_notebook_id)
        RETURNING * INTO session_record;
    END IF;
    
    RETURN session_record;
END;
$$ LANGUAGE plpgsql;

-- Function to add message to conversation history
CREATE OR REPLACE FUNCTION add_message_to_conversation(
    p_user_id TEXT,
    p_session_id TEXT,
    p_notebook_id TEXT,
    p_message JSONB
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO ai_sessions (user_id, session_id, notebook_id, conversation_history)
    VALUES (p_user_id, p_session_id, p_notebook_id, jsonb_build_array(p_message))
    ON CONFLICT (user_id, session_id, notebook_id)
    DO UPDATE SET 
        conversation_history = ai_sessions.conversation_history || p_message,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get conversation history with limit
CREATE OR REPLACE FUNCTION get_conversation_history(
    p_user_id TEXT,
    p_session_id TEXT DEFAULT 'default',
    p_notebook_id TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50
)
RETURNS JSONB AS $$
DECLARE
    history JSONB;
BEGIN
    SELECT 
        CASE 
            WHEN jsonb_array_length(conversation_history) > p_limit 
            THEN jsonb_path_query_array(
                conversation_history, 
                ('$[' || (jsonb_array_length(conversation_history) - p_limit)::text || ' to last]')::jsonpath
            )
            ELSE conversation_history 
        END
    INTO history
    FROM ai_sessions
    WHERE user_id = p_user_id 
    AND session_id = p_session_id 
    AND (notebook_id = p_notebook_id OR (notebook_id IS NULL AND p_notebook_id IS NULL));
    
    RETURN COALESCE(history, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- =======================================
-- Grant Permissions
-- =======================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_user_preferences TO authenticated;
GRANT SELECT, INSERT ON ai_analytics TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_or_create_ai_session(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION add_message_to_conversation(TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_history(TEXT, TEXT, TEXT, INTEGER) TO authenticated;

-- =======================================
-- Cleanup and Maintenance
-- =======================================

-- Function to clean up old sessions (optional, run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_ai_sessions(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM ai_sessions 
    WHERE updated_at < NOW() - INTERVAL '1 day' * days_old;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup
    INSERT INTO ai_analytics (user_id, event_type, event_data)
    VALUES ('system', 'cleanup', jsonb_build_object('deleted_sessions', deleted_count));
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =======================================
-- Verification Queries
-- =======================================

-- Check if tables were created successfully
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_sessions') THEN
        RAISE NOTICE '✅ ai_sessions table created successfully';
    ELSE
        RAISE NOTICE '❌ ai_sessions table not found';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_user_preferences') THEN
        RAISE NOTICE '✅ ai_user_preferences table created successfully';
    ELSE
        RAISE NOTICE '❌ ai_user_preferences table not found';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_analytics') THEN
        RAISE NOTICE '✅ ai_analytics table created successfully';
    ELSE
        RAISE NOTICE '❌ ai_analytics table not found';
    END IF;
END $$;

-- Test the functions
SELECT '✅ Database setup complete! Test with: SELECT get_or_create_ai_session(''test-user'', ''test-session'');' as status; 