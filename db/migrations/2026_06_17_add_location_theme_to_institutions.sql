-- Store location and theme color for both institution types.

BEGIN;

ALTER TABLE IF EXISTS public.universites
  ADD COLUMN IF NOT EXISTS ville text,
  ADD COLUMN IF NOT EXISTS primary_color text;

ALTER TABLE IF EXISTS public.centres_formation
  ADD COLUMN IF NOT EXISTS ville text,
  ADD COLUMN IF NOT EXISTS primary_color text;

COMMIT;
