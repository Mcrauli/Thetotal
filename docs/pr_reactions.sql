-- PR reactions table: emoji-pohjaiset reaktiot kaverien PR:lle
-- Aja tämä Supabase Dashboardissa: SQL Editor → New query → liitä tämä → Run

CREATE TABLE IF NOT EXISTS pr_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_id uuid NOT NULL REFERENCES personal_records(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji text NOT NULL CHECK (emoji IN ('fire', 'muscle', 'clap', 'eyes')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(pr_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_pr_reactions_pr_id ON pr_reactions(pr_id);
CREATE INDEX IF NOT EXISTS idx_pr_reactions_user_id ON pr_reactions(user_id);

ALTER TABLE pr_reactions ENABLE ROW LEVEL SECURITY;

-- Kaikki authentikoidut käyttäjät voivat lukea reaktioita
DROP POLICY IF EXISTS "Read all reactions" ON pr_reactions;
CREATE POLICY "Read all reactions" ON pr_reactions
  FOR SELECT TO authenticated USING (true);

-- Käyttäjä voi lisätä omia reaktioitaan
DROP POLICY IF EXISTS "Insert own reactions" ON pr_reactions;
CREATE POLICY "Insert own reactions" ON pr_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Käyttäjä voi poistaa omat reaktionsa
DROP POLICY IF EXISTS "Delete own reactions" ON pr_reactions;
CREATE POLICY "Delete own reactions" ON pr_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
