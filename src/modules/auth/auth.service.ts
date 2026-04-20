// src/modules/auth/auth.service.ts

import { SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import path from 'path';

export interface RegisterPayload {
  email: string;
  password?: string; // Made optional
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
}

export interface LoginPayload {
  // Login par email ET téléphone (sans password)
  email: string;
  telephone?: string;
  password?: string;
}

export interface AuthResult {
  userId: string;
  email: string;
  token?: string | null;
  refreshToken?: string | null;
  userType?: 'bachelier' | 'etudiant' | 'parent';
  gender?: string | null;
}

export interface LoginResult {
  userId: string;
  email: string | null;
  token: string;
  refreshToken: string;
}

export interface AuthTokenPayload {
  id: string;
  email: string | null;
  role: string;
}

export interface RefreshTokenPayload {
  id: string;
  type: 'refresh';
}

export interface RefreshResult {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string | null;
    role: string;
  };
}

const getJwtSecret = (): string => {
  let secret = process.env.JWT_SECRET;
  if (!secret) {
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });
    secret = process.env.JWT_SECRET;
  }
  if (!secret) {
    throw new Error('Missing JWT_SECRET configuration');
  }
  return secret;
};

export const generateToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: '7d',
  });
};

const generateRefreshTokenJwt = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: '30d',
  });
};

const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

const issueRefreshToken = async (
  supabase: SupabaseClient,
  userId: string
): Promise<string> => {
  const refreshToken = generateRefreshTokenJwt({
    id: userId,
    type: 'refresh',
  });

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const tokenHash = hashToken(refreshToken);

  const { error } = await supabase.from('auth_refresh_tokens').insert({
    id: crypto.randomUUID(),
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(`Refresh token creation failed: ${error.message}`);
  }

  return refreshToken;
};

export const revokeRefreshToken = async (
  supabase: SupabaseClient,
  refreshToken: string
): Promise<void> => {
  const tokenHash = hashToken(refreshToken);

  const { error } = await supabase
    .from('auth_refresh_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token_hash', tokenHash)
    .is('revoked_at', null);

  if (error) {
    throw new Error(`Failed to revoke refresh token: ${error.message}`);
  }
};

export const refreshAccessToken = async (
  supabase: SupabaseClient,
  refreshToken: string
): Promise<RefreshResult> => {
  let decoded: string | Record<string, any>;

  try {
    decoded = jwt.verify(refreshToken, getJwtSecret());
  } catch (e) {
    throw new Error(`Invalid refresh token: ${(e as Error).message}`);
  }

  if (
    typeof decoded === 'string' ||
    !decoded.id ||
    decoded.type !== 'refresh'
  ) {
    throw new Error('Invalid refresh token payload');
  }

  const tokenHash = hashToken(refreshToken);
  const now = new Date().toISOString();

  const { data: storedToken, error: tokenError } = await supabase
    .from('auth_refresh_tokens')
    .select('id, user_id, expires_at, revoked_at')
    .eq('token_hash', tokenHash)
    .single();

  if (tokenError || !storedToken) {
    throw new Error('Refresh token not found');
  }

  if ((storedToken as any).revoked_at) {
    throw new Error('Refresh token has been revoked');
  }

  if ((storedToken as any).expires_at <= now) {
    throw new Error('Refresh token has expired');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, profile_type')
    .eq('id', (storedToken as any).user_id)
    .single();

  if (profileError || !profile) {
    throw new Error('User not found for refresh token');
  }

  await revokeRefreshToken(supabase, refreshToken);

  const token = generateToken({
    id: profile.id,
    email: profile.email ?? null,
    role: profile.profile_type,
  });

  const nextRefreshToken = await issueRefreshToken(supabase, profile.id);

  return {
    token,
    refreshToken: nextRefreshToken,
    user: {
      id: profile.id,
      email: profile.email ?? null,
      role: profile.profile_type,
    },
  };
};

/**
 * Crée un utilisateur Supabase + profile + table spécifique
 */
export const registerUser = async (
  supabase: SupabaseClient,
  payload: RegisterPayload
): Promise<AuthResult> => {
  const password =
    payload.password && payload.password.trim().length >= 8
      ? payload.password
      : crypto.randomBytes(16).toString('hex');

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: payload.email,
    password,
    email_confirm: true,
    user_metadata: {
      profile_type: payload.profileType,
    },
  });

  if (authError || !authData.user) {
    throw new Error(`Auth user creation failed: ${authError?.message || 'unknown error'}`);
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
    await supabase.auth.admin.deleteUser(userId);
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

  const token = generateToken({
    id: userId,
    email: payload.email,
    role: payload.profileType,
  });
  const refreshToken = await issueRefreshToken(supabase, userId);

  const result: AuthResult = { userId, email: payload.email };
  if (token) {
    result.token = token;
  }
  result.refreshToken = refreshToken;
  if (payload.userType) {
    result.userType = payload.userType;
  }
  if (payload.genre) {
    result.gender = payload.genre;
  }

  return result;
};


/**
 * Login utilisateur via email + téléphone (sans password)
 * ✅ Vérifier juste que email+téléphone existent - Accès automatique
 */
export const loginUser = async (
  supabase: SupabaseClient,
  payload: LoginPayload
): Promise<LoginResult> => {
  const { email, telephone, password } = payload;

  if (password) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.error('Password login failed:', authError?.message);
      throw new Error('Invalid email or password');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, profile_type')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    if (!['universite', 'centre_formation', 'admin'].includes(profile.profile_type)) {
      throw new Error(
        'Password login is only available for admin, universite and centre_formation'
      );
    }

    const token = generateToken({
      id: profile.id,
      email: profile.email ?? null,
      role: profile.profile_type,
    });
    const refreshToken = await issueRefreshToken(supabase, profile.id);

    return {
      userId: profile.id,
      email: profile.email ?? null,
      token,
      refreshToken,
    };
  }

  // 1️⃣ Vérifier que l'utilisateur existe avec email (téléphone optionnel)
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, profile_type, telephone')
    .eq('email', email)
    .single(); // Retourne une seule ligne

  if (profileError || !profiles) {
    console.error('Login failed:', profileError?.message);
    throw new Error('User not found with provided email');
  }

  // 2️⃣ Si téléphone est fourni, vérifier qu'il correspond
  if (telephone && profiles.telephone !== telephone) {
    console.error(`Phone mismatch: expected ${telephone}, got ${profiles.telephone}`);
    throw new Error('Email found but phone number does not match');
  }

  const userId = profiles.id;
  const userEmail = profiles.email;
  const role = profiles.profile_type;

  if (!role) {
    throw new Error('User profile is missing a role');
  }

  try {
    const token = generateToken({
      id: userId,
      email: userEmail ?? null,
      role,
    });
    const refreshToken = await issueRefreshToken(supabase, userId);

    return {
      userId,
      email: userEmail ?? null,
      token,
      refreshToken,
    };
  } catch (e) {
    console.error('Auth error:', (e as Error).message);
    throw new Error(`Authentication failed: ${(e as Error).message}`);
  }
};
