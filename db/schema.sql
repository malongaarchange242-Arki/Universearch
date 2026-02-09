-- services/identity-service/db/schema.sql

-- Table: profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY,                          -- id fourni par Supabase Auth
  email text NOT NULL,
  nom text,
  prenom text,
  telephone text,
  profile_type text NOT NULL,                   -- rôle/type de profil
  date_naissance date,
  genre text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT profiles_profile_type_check CHECK (
    profile_type IN (
      'utilisateur','admin','superviseur','universite','bde','centre_formation'
    )
  ),
  CONSTRAINT profiles_email_unique UNIQUE (email)
);
CREATE INDEX IF NOT EXISTS idx_profiles_profile_type ON profiles(profile_type);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Table: utilisateurs (détails pour profile_type = 'utilisateur')
CREATE TABLE IF NOT EXISTS utilisateurs (
  id uuid PRIMARY KEY,           -- FK vers profiles.id (même UUID que supabase.auth user)
  user_type text NOT NULL,       -- 'bachelier' | 'etudiant' | 'parent'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT utilisateurs_user_type_check CHECK (
    user_type IN ('bachelier','etudiant','parent')
  ),
  CONSTRAINT fk_utilisateurs_profiles FOREIGN KEY (id)
    REFERENCES profiles(id) ON DELETE CASCADE
);

-- Table: admins
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_admins_profiles FOREIGN KEY (id)
    REFERENCES profiles(id) ON DELETE CASCADE
);

-- Table: superviseurs
CREATE TABLE IF NOT EXISTS superviseurs (
  id uuid PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_superviseurs_profiles FOREIGN KEY (id)
    REFERENCES profiles(id) ON DELETE CASCADE
);

-- Notes:
-- 1) Les UUID `id` sont fournis par Supabase Auth (insertées après createUser()).
-- 2) Si vous préférez référencer directement `auth.users(id)`, remplacez les FOREIGN KEY par
--    REFERENCES auth.users(id) ON DELETE CASCADE (vérifiez l'existence du schéma/table).
-- 3) En production, ajoutez triggers pour maintenir `updated_at` et contrôles additionnels.


<<<<<<< HEAD




ALTER TABLE universites
DROP COLUMN IF EXISTS score_pora,
DROP COLUMN IF EXISTS score_pora_prev,
DROP COLUMN IF EXISTS score_details;

CREATE TABLE universites_scores (
    universites_id uuid PRIMARY KEY,
    score_current double precision,
    score_previous double precision,
    score_details jsonb,
    updated_at timestamptz DEFAULT now()
=======
CREATE TABLE public.universites (
  id uuid PRIMARY KEY, -- même id que le user Supabase
  nom text NOT NULL,
  description text,
  contacts text,
  email text,
  lien_site text,
  logo_url text,
  couverture_logo_url text,
  domaine text,
  bde_id uuid,
  statut text NOT NULL DEFAULT 'PENDING',
  video_url text,
  date_creation timestamp without time zone DEFAULT now(),
  profile_id uuid NOT NULL,

  CONSTRAINT fk_universite_profile
    FOREIGN KEY (profile_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE
);


CREATE TABLE public.centres_formation (
  id uuid PRIMARY KEY, -- même id que le user Supabase
  nom text NOT NULL,
  description text,
  contacts text,
  email text,
  lien_site text,
  logo_url text,
  couverture_logo_url text,
  domaine text,
  statut text NOT NULL DEFAULT 'PENDING',
  video_url text,
  date_creation timestamp without time zone DEFAULT now(),
  profile_id uuid NOT NULL,

  CONSTRAINT fk_centre_profile
    FOREIGN KEY (profile_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE
);

ALTER TABLE public.universites
ADD CONSTRAINT universites_statut_check
CHECK (statut IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'));

ALTER TABLE public.centres_formation
ADD CONSTRAINT centres_statut_check
CHECK (statut IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'));


-- Crée un bucket public nommé "logos"
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true);

CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos'
);


CREATE POLICY "Public select on logos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'logos'
>>>>>>> 99dc8c3 (Initial commit - identity service)
);


create table posts (
  id uuid primary key default gen_random_uuid(),

  author_id uuid not null, -- = id universite ou centre
  author_type text not null check (author_type in ('universite','centre_formation')),

  titre text,
  description text,

  media_url text,      -- image ou vidéo
  media_type text check (media_type in ('image','video')),

  statut text not null default 'PUBLISHED' check (statut in ('PUBLISHED','ARCHIVED')),

  date_creation timestamp default now()
);


create index posts_author_idx on posts(author_id);
create index posts_date_idx on posts(date_creation desc);
create index posts_statut_idx on posts(statut);


create table post_likes (
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  date_like timestamp default now(),
  primary key (user_id, post_id)
);

create table post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  contenu text not null,
  date_comment timestamp default now()
);

create table post_shares (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  date_share timestamp default now()
);

create table post_views (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id),
  view_duration integer, -- secondes regardées
  date_view timestamp default now()
);

