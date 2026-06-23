-- Add yearly tuition fee columns (L1/L2/L3) to universite_filieres

BEGIN;

ALTER TABLE IF EXISTS public.universite_filieres
  ADD COLUMN IF NOT EXISTS frais_l1 text,
  ADD COLUMN IF NOT EXISTS frais_l2 text,
  ADD COLUMN IF NOT EXISTS frais_l3 text;
  
-- Master's years (M1/M2/M3)
ALTER TABLE IF EXISTS public.universite_filieres
  ADD COLUMN IF NOT EXISTS frais_m1 text,
  ADD COLUMN IF NOT EXISTS frais_m2 text,
  ADD COLUMN IF NOT EXISTS frais_m3 text;

COMMIT;
