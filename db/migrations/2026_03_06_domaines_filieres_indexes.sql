-- Migration: add domaines table, add domaine_id to filieres, and create helpful indexes

BEGIN;

-- 1) Create domaines table
CREATE TABLE IF NOT EXISTS domaines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- 2) Add domaine_id FK to filieres (nullable for existing rows)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='filieres' AND column_name='domaine_id'
  ) THEN
    ALTER TABLE filieres
    ADD COLUMN domaine_id uuid REFERENCES domaines(id) ON DELETE SET NULL;
  END IF;
END$$;

-- 3) Ensure pivot table exists (idempotent)
CREATE TABLE IF NOT EXISTS universite_filieres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  universite_id uuid NOT NULL REFERENCES universites(id) ON DELETE CASCADE,
  filiere_id uuid NOT NULL REFERENCES filieres(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT uniq_universite_filiere UNIQUE (universite_id, filiere_id)
);

-- 4) Indexes to improve search and joins
CREATE INDEX IF NOT EXISTS idx_filieres_nom ON filieres (lower(nom));
CREATE INDEX IF NOT EXISTS idx_universite_filieres_universite_id ON universite_filieres (universite_id);
CREATE INDEX IF NOT EXISTS idx_universite_filieres_filiere_id ON universite_filieres (filiere_id);

COMMIT;
