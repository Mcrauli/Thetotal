-- PR-verifikaatio: erottaa kuntosalissa tehdyt nostot itse ilmoitetuista arvoista
-- Aja tämä Supabase Dashboardissa: SQL Editor → New query → liitä → Run

-- 1) Lisää verified-kolumni personal_records-tauluun
ALTER TABLE personal_records
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT true;

-- 2) Vanhat manuaalisesti syötetyt SBD-arvot oletuksena vahvistamattomia
--    (vain ensimmäisessä migraatiossa - kaikki nyt oletetaan vahvistamattomiksi paitsi
--    jos haluat säilyttää treenistä syntyneet vahvistettuina, jätä tämä ajamatta)
-- UPDATE personal_records SET verified = false;

-- 3) Verifikaatio-taulu: kuka kaveri vahvisti minkä PR:n
CREATE TABLE IF NOT EXISTS pr_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_id uuid NOT NULL REFERENCES personal_records(id) ON DELETE CASCADE,
  verifier_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(pr_id, verifier_id)
);

CREATE INDEX IF NOT EXISTS idx_pr_verifications_pr_id ON pr_verifications(pr_id);
CREATE INDEX IF NOT EXISTS idx_pr_verifications_verifier_id ON pr_verifications(verifier_id);

ALTER TABLE pr_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read all verifications" ON pr_verifications;
CREATE POLICY "Read all verifications" ON pr_verifications
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Insert own verifications" ON pr_verifications;
CREATE POLICY "Insert own verifications" ON pr_verifications
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = verifier_id
    AND NOT EXISTS (
      SELECT 1 FROM personal_records pr
      WHERE pr.id = pr_id AND pr.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Delete own verifications" ON pr_verifications;
CREATE POLICY "Delete own verifications" ON pr_verifications
  FOR DELETE TO authenticated USING (auth.uid() = verifier_id);

-- 4) Trigger: kun joku vahvistaa PR:n, merkitse se vahvistetuksi
CREATE OR REPLACE FUNCTION verify_pr_on_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE personal_records SET verified = true WHERE id = NEW.pr_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_verify_pr ON pr_verifications;
CREATE TRIGGER trg_verify_pr
  AFTER INSERT ON pr_verifications
  FOR EACH ROW EXECUTE FUNCTION verify_pr_on_insert();
