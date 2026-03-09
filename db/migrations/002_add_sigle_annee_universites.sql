-- services/identity-service/db/migrations/002_add_sigle_annee_universites.sql
-- Migration: add sigle and annee_fondation to universites
-- Generated: 2026-02-19

BEGIN;

ALTER TABLE IF EXISTS public.universites
  ADD COLUMN IF NOT EXISTS sigle text,
  ADD COLUMN IF NOT EXISTS annee_fondation integer;

COMMIT;
