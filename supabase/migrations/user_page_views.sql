-- User page view tracking table
CREATE TABLE IF NOT EXISTS user_page_views (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email      TEXT,
    session_id      TEXT NOT NULL,
    page_path       TEXT NOT NULL,
    page_title      TEXT,
    duration_seconds INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_upv_user_id  ON user_page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_upv_session  ON user_page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_upv_created  ON user_page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_upv_path     ON user_page_views(page_path);

-- RLS
ALTER TABLE user_page_views ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anonymous) can insert tracking events
CREATE POLICY "insert_page_views" ON user_page_views
    FOR INSERT WITH CHECK (true);

-- Only staff can read analytics
CREATE POLICY "staff_read_page_views" ON user_page_views
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('admin', 'super_admin', 'agent')
        )
    );
