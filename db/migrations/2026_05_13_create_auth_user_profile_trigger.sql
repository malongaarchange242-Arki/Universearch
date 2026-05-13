-- services/identity-service/db/migrations/2026_05_13_create_auth_user_profile_trigger.sql

-- Trigger pour créer automatiquement un profil à partir d'un nouvel utilisateur Supabase
-- Ce trigger doit copier les métadonnées de l'utilisateur auth vers la table profiles.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    nom,
    prenom,
    telephone,
    profile_type,
    date_naissance,
    genre
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'nom',
    NEW.raw_user_meta_data->>'prenom',
    NEW.raw_user_meta_data->>'telephone',
    NEW.raw_user_meta_data->>'profile_type',
    NULLIF(NEW.raw_user_meta_data->>'date_naissance', '')::date,
    NEW.raw_user_meta_data->>'genre'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
