BEGIN;

ALTER TABLE IF EXISTS public.universites
  ADD COLUMN IF NOT EXISTS nom_representant text;

ALTER TABLE IF EXISTS public.centres_formation
  ADD COLUMN IF NOT EXISTS nom_representant text;

COMMIT;
