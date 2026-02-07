<<<<<<< HEAD
=======
// src/modules/auth/auth.service.ts
>>>>>>> 99dc8c3 (Initial commit - identity service)
import { SupabaseClient } from '@supabase/supabase-js';

export interface RegisterPayload {
  email: string;
  password: string;
<<<<<<< HEAD
=======
  nom: string;
  prenom?: string | null;
  telephone: string;
  profileType:
    | 'utilisateur'
    | 'admin'
    | 'superviseur'
    | 'universite'
    | 'bde'
    | 'centre_formation';
  userType?: 'bachelier' | 'etudiant' | 'parent';
  dateNaissance?: string;
  genre?: string;
>>>>>>> 99dc8c3 (Initial commit - identity service)
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResult {
  userId: string;
  email: string;
}

export interface LoginResult {
  userId: string;
  email: string | null;
  token: string;
}

/**
<<<<<<< HEAD
 * Crée uniquement le compte d'authentification
 * (AUCUNE écriture dans profiles ou autres tables)
=======
 * Crée un utilisateur Supabase + profile + table spécifique
>>>>>>> 99dc8c3 (Initial commit - identity service)
 */
export const registerUser = async (
  supabase: SupabaseClient,
  payload: RegisterPayload
): Promise<AuthResult> => {
<<<<<<< HEAD
  const { data, error } = await supabase.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(`Auth creation failed: ${error?.message}`);
  }

  return {
    userId: data.user.id,
    email: data.user.email!,
  };
};

/**
 * Login utilisateur
=======
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
    });

  if (authError || !authData.user) {
    throw new Error(`Auth creation failed: ${authError?.message}`);
  }

  const userId = authData.user.id;

  // Création du profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      nom: payload.nom,
      prenom: payload.prenom ?? null,
      telephone: payload.telephone,
      email: payload.email,
      profile_type: payload.profileType,
      date_naissance: payload.dateNaissance ?? null,
      genre: payload.genre ?? null,
    });

  if (profileError) {
    throw new Error(`Profile creation failed: ${profileError.message}`);
  }

  // Table spécifique selon profileType
  switch (payload.profileType) {
    case 'utilisateur': {
      if (!payload.userType) throw new Error('userType is required for utilisateur');

      const { error } = await supabase.from('utilisateurs').insert({
        id: userId,
        user_type: payload.userType,
      });

      if (error) {
        // Rollback: supprimer le profile et l'utilisateur en cas d'erreur
        await supabase.from('profiles').delete().eq('id', userId);
        await supabase.auth.admin.deleteUser(userId);
        throw new Error(`Utilisateur creation failed: ${error.message}`);
      }
      break;
    }

    case 'admin': {
      const { error } = await supabase.from('admins').insert({ id: userId });
      
      if (error) {
        // Rollback
        await supabase.from('profiles').delete().eq('id', userId);
        await supabase.auth.admin.deleteUser(userId);
        throw new Error(`Admin creation failed: ${error.message}`);
      }
      break;
    }

    case 'superviseur': {
      const { error } = await supabase.from('superviseurs').insert({ id: userId });
      
      if (error) {
        // Rollback
        await supabase.from('profiles').delete().eq('id', userId);
        await supabase.auth.admin.deleteUser(userId);
        throw new Error(`Superviseur creation failed: ${error.message}`);
      }
      break;
    }

    case 'universite': {
      const { error } = await supabase.from('universites').insert({
        id: userId,
        profile_id: userId,
        nom: payload.nom,
        email: payload.email,
        statut: 'PENDING',
        date_creation: new Date().toISOString(),
      });

      if (error) {
        // Rollback: supprimer le profile et l'utilisateur en cas d'erreur
        await supabase.from('profiles').delete().eq('id', userId);
        await supabase.auth.admin.deleteUser(userId);
        throw new Error(`Universite creation failed: ${error.message}`);
      }
      break;
    }

    case 'centre_formation': {
      const { error } = await supabase.from('centres_formation').insert({
        id: userId,
        profile_id: userId,
        nom: payload.nom,
        email: payload.email,
        statut: 'PENDING',
        date_creation: new Date().toISOString(),
      });

      if (error) {
        // Rollback: supprimer le profile et l'utilisateur en cas d'erreur
        await supabase.from('profiles').delete().eq('id', userId);
        await supabase.auth.admin.deleteUser(userId);
        throw new Error(`Centre creation failed: ${error.message}`);
      }
      break;
    }

    default:
      break;
  }

  return { userId, email: payload.email };
};

/**
 * Login utilisateur via email/password
>>>>>>> 99dc8c3 (Initial commit - identity service)
 */
export const loginUser = async (
  supabase: SupabaseClient,
  payload: LoginPayload
): Promise<LoginResult> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (error || !data.session?.user || !data.session?.access_token) {
    throw new Error(error?.message || 'Invalid credentials');
  }

  return {
    userId: data.session.user.id,
    email: data.session.user.email ?? null,
    token: data.session.access_token,
  };
};
