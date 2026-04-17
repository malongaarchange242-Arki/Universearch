-- Migration: Create frais_scolarite table for tuition fee management
-- Date: 2026-04-17
-- Purpose: Store tuition fees by university, level (L1, L2, L3, Master), and pole (Commercial, Polytechnique, Droit)

-- Create the main frais_scolarite table
CREATE TABLE IF NOT EXISTS frais_scolarite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key to universities
  universite_id uuid NOT NULL,
  
  -- Level and pole information
  level text NOT NULL CHECK (level IN ('L1', 'L2', 'L3', 'Master')),
  pole text NOT NULL CHECK (pole IN ('Commercial', 'Polytechnique', 'Droit', 'Medecine', 'Sciences', 'Lettres', 'Arts', 'Autres')),
  
  -- Pricing information
  monthly_price numeric(12, 2) NOT NULL DEFAULT 0,
  yearly_price numeric(12, 2) NOT NULL DEFAULT 0,
  
  -- Currency (always XAF for Cameroon)
  currency text NOT NULL DEFAULT 'XAF',
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT fk_frais_universite 
    FOREIGN KEY (universite_id)
    REFERENCES universites(id) 
    ON DELETE CASCADE,
  
  -- Ensure one entry per university/level/pole combination
  CONSTRAINT unique_frais_per_level_pole 
    UNIQUE (universite_id, level, pole)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_frais_universite_id ON frais_scolarite(universite_id);
CREATE INDEX IF NOT EXISTS idx_frais_level_pole ON frais_scolarite(level, pole);
CREATE INDEX IF NOT EXISTS idx_frais_created_at ON frais_scolarite(created_at DESC);

-- Create a view for easy retrieval of all fees for a university
CREATE OR REPLACE VIEW v_frais_by_universite AS
SELECT 
  fs.universite_id,
  fs.level,
  fs.pole,
  fs.monthly_price,
  fs.yearly_price,
  fs.currency,
  fs.created_at,
  fs.updated_at
FROM frais_scolarite fs
ORDER BY fs.level, fs.pole;

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_frais_scolarite_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_frais_scolarite_timestamp ON frais_scolarite;
CREATE TRIGGER trigger_update_frais_scolarite_timestamp
  BEFORE UPDATE ON frais_scolarite
  FOR EACH ROW
  EXECUTE FUNCTION update_frais_scolarite_timestamp();

-- Grant access to authenticated users (adjust as needed)
GRANT SELECT, INSERT, UPDATE ON frais_scolarite TO authenticated;
GRANT USAGE ON SEQUENCE frais_scolarite_id_seq TO authenticated;
