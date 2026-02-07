import { SupabaseClient } from '@supabase/supabase-js';

export interface RegisterPayload {
  email: string;
  password: string;
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
 * Crée uniquement le compte d'authentification
 * (AUCUNE écriture dans profiles ou autres tables)
 */
export const registerUser = async (
  supabase: SupabaseClient,
  payload: RegisterPayload
): Promise<AuthResult> => {
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
