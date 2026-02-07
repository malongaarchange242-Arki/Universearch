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
);
