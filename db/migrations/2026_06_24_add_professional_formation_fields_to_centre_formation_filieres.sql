-- Add professional formation fields to centre_formation_filieres table for centres

BEGIN;

ALTER TABLE IF EXISTS public.centre_formation_filieres
  ADD COLUMN IF NOT EXISTS nom_formation text,
  ADD COLUMN IF NOT EXISTS categorie_domaine text,
  ADD COLUMN IF NOT EXISTS type_certification text,
  ADD COLUMN IF NOT EXISTS duree text,
  ADD COLUMN IF NOT EXISTS cout_formation text,
  ADD COLUMN IF NOT EXISTS lieu text,
  ADD COLUMN IF NOT EXISTS mode_formation text,
  ADD COLUMN IF NOT EXISTS langue text DEFAULT 'Français',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS prerequis text,
  ADD COLUMN IF NOT EXISTS stage_alternance boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

COMMIT;
