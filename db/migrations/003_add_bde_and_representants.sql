CREATE TABLE IF NOT EXISTS bde (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  universite_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  description TEXT,
  logo_url TEXT,
  video_url TEXT,

  -- Président du BDE
  pres_lastname TEXT,
  pres_firstname TEXT,
  pres_phone TEXT,
  pres_email TEXT,

  statut VARCHAR(20) DEFAULT 'actif'
    CHECK (statut IN ('actif', 'inactif', 'suspendu')),

  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🔥 IMPORTANT : un seul BDE ACTIF par université
CREATE UNIQUE INDEX unique_active_bde_per_university
ON bde (universite_id)
WHERE statut = 'actif';

CREATE INDEX idx_bde_profile_id ON bde(profile_id);
CREATE INDEX idx_bde_statut ON bde(statut);

CREATE TABLE IF NOT EXISTS representants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  centre_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  fonction TEXT NOT NULL,

  statut VARCHAR(20) DEFAULT 'actif'
    CHECK (statut IN ('actif', 'inactif', 'suspendu')),

  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_representants_centre_id ON representants(centre_id);
CREATE INDEX idx_representants_profile_id ON representants(profile_id);
CREATE INDEX idx_representants_statut ON representants(statut);