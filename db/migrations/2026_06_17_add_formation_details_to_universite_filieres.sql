-- Store formation details that are specific to one university + one filiere.

BEGIN;

ALTER TABLE IF EXISTS public.universite_filieres
  ADD COLUMN IF NOT EXISTS niveau text,
  ADD COLUMN IF NOT EXISTS niveau_detail text,
  ADD COLUMN IF NOT EXISTS duree text,
  ADD COLUMN IF NOT EXISTS lieu text,
  ADD COLUMN IF NOT EXISTS langue text,
  ADD COLUMN IF NOT EXISTS frais_inscription text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS prerequis text,
  ADD COLUMN IF NOT EXISTS alternance boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

COMMIT;
