-- Moderointitaulut: ilmiannot ja estot (Apple Guideline 1.2 UGC-vaatimus)
-- Aja Supabase Dashboardissa: SQL Editor → New query → liitä → Run

-- 1) Ilmiannot (sopimaton sisältö / käyttäjä)
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('comment', 'user', 'pr')),
  target_id uuid NOT NULL,
  reason text NOT NULL CHECK (length(reason) > 0 AND length(reason) <= 500),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Insert own reports" ON reports;
CREATE POLICY "Insert own reports" ON reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Read own reports" ON reports;
CREATE POLICY "Read own reports" ON reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id);

-- 2) Estot (käyttäjä ei näe estetyn käyttäjän sisältöä eikä toisinpäin)
CREATE TABLE IF NOT EXISTS blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_id);

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read own blocks" ON blocks;
CREATE POLICY "Read own blocks" ON blocks
  FOR SELECT TO authenticated USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Insert own blocks" ON blocks;
CREATE POLICY "Insert own blocks" ON blocks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Delete own blocks" ON blocks;
CREATE POLICY "Delete own blocks" ON blocks
  FOR DELETE TO authenticated USING (auth.uid() = blocker_id);

-- 3) Trigger: kun käyttäjä estää toisen, poistetaan myös mahd. ystävyys
CREATE OR REPLACE FUNCTION remove_friendship_on_block()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM friendships
  WHERE (user_id = NEW.blocker_id AND friend_id = NEW.blocked_id)
     OR (user_id = NEW.blocked_id AND friend_id = NEW.blocker_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_removes_friendship ON blocks;
CREATE TRIGGER trg_block_removes_friendship
  AFTER INSERT ON blocks
  FOR EACH ROW EXECUTE FUNCTION remove_friendship_on_block();
