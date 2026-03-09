-- services/identity-service/db/migrations/003_create_followers_tables.sql
-- Migration: create followers tables for universites and centres_formation
-- Generated: 2026-03-09

BEGIN;

-- Table: followers_universites
-- Permet aux utilisateurs de suivre les universités
CREATE TABLE IF NOT EXISTS public.followers_universites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  universite_id uuid NOT NULL,
  date_follow timestamptz DEFAULT now(),
  
  CONSTRAINT fk_followers_universites_user
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,
  
  CONSTRAINT fk_followers_universites_universite
    FOREIGN KEY (universite_id)
    REFERENCES public.universites(id)
    ON DELETE CASCADE,
  
  CONSTRAINT unique_user_universite
    UNIQUE (user_id, universite_id)
);

CREATE INDEX IF NOT EXISTS idx_followers_universites_user 
  ON public.followers_universites(user_id);

CREATE INDEX IF NOT EXISTS idx_followers_universites_universite 
  ON public.followers_universites(universite_id);


-- Table: followers_centres_formation
-- Permet aux utilisateurs de suivre les centres de formation
CREATE TABLE IF NOT EXISTS public.followers_centres_formation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  centre_id uuid NOT NULL,
  date_follow timestamptz DEFAULT now(),
  
  CONSTRAINT fk_followers_centres_user
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,
  
  CONSTRAINT fk_followers_centres_centre
    FOREIGN KEY (centre_id)
    REFERENCES public.centres_formation(id)
    ON DELETE CASCADE,
  
  CONSTRAINT unique_user_centre
    UNIQUE (user_id, centre_id)
);

CREATE INDEX IF NOT EXISTS idx_followers_centres_user 
  ON public.followers_centres_formation(user_id);

CREATE INDEX IF NOT EXISTS idx_followers_centres_centre 
  ON public.followers_centres_formation(centre_id);

COMMIT;
