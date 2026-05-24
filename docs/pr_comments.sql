-- PR comments table: tekstipohjaiset kommentit kaverien PR:lle
-- Aja tämä Supabase Dashboardissa: SQL Editor → New query → liitä tämä → Run

CREATE TABLE IF NOT EXISTS pr_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_id uuid NOT NULL REFERENCES personal_records(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(body) > 0 AND length(body) <= 500),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pr_comments_pr_id ON pr_comments(pr_id);
CREATE INDEX IF NOT EXISTS idx_pr_comments_created_at ON pr_comments(created_at);

ALTER TABLE pr_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read all comments" ON pr_comments;
CREATE POLICY "Read all comments" ON pr_comments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Insert own comments" ON pr_comments;
CREATE POLICY "Insert own comments" ON pr_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Delete own comments" ON pr_comments;
CREATE POLICY "Delete own comments" ON pr_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
