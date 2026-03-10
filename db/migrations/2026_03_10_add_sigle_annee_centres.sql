-- services/identity-service/db/migrations/2026_03_10_add_sigle_annee_centres.sql
-- Migration: add sigle and annee_fondation to centres_formation
-- Generated: 2026-03-10

BEGIN;

ALTER TABLE IF EXISTS public.centres_formation
  ADD COLUMN IF NOT EXISTS sigle text,
  ADD COLUMN IF NOT EXISTS annee_fondation integer;

COMMIT;