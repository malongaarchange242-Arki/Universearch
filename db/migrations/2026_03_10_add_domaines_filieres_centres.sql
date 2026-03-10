-- Migration: add domaines_centre table, add domaine_id to filieres_centre, and create helpful indexes for centres

BEGIN;

-- 1) Create domaines_centre table (mirrors "domaines" used by universités)
CREATE TABLE IF NOT EXISTS domaines_centre (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

-- 2) Ensure filieres_centre has domaine_id FK (should already exist from earlier schema, but double-check idempotently)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='filieres_centre' AND column_name='domaine_id'
  ) THEN
    ALTER TABLE filieres_centre
    ADD COLUMN domaine_id uuid REFERENCES domaines_centre(id) ON DELETE SET NULL;
  END IF;
END$$;

-- 3) Pivot table between centres and filieres (mirrors universite_filieres migration)
CREATE TABLE IF NOT EXISTS centre_formation_filieres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id uuid NOT NULL REFERENCES centres_formation(id) ON DELETE CASCADE,
  filiere_id uuid NOT NULL REFERENCES filieres_centre(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT uniq_centre_filiere UNIQUE (centre_id, filiere_id)
);

-- 4) Indexes to improve search and joins
CREATE INDEX IF NOT EXISTS idx_filieres_centre_nom ON filieres_centre (lower(nom));
CREATE INDEX IF NOT EXISTS idx_centre_filieres_centre_id ON centre_formation_filieres (centre_id);
CREATE INDEX IF NOT EXISTS idx_centre_filieres_filiere_id ON centre_formation_filieres (filiere_id);

COMMIT;