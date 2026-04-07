// src/modules/auth/auth.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import {
  registerUser,
  RegisterPayload,
  loginUser,
  LoginPayload,
  refreshAccessToken,
  revokeRefreshToken,
} from './auth.service';
import { supabaseAdmin } from '../../plugins/supabase'; // Supabase Admin client

/**
 * Handler de création de compte utilisateur.
 */
export const registerHandler = async (
  request: FastifyRequest<{ Body: RegisterPayload }>,
  reply: FastifyReply
): Promise<void> => {
  try {
    // Passe supabaseAdmin au service
    const result = await registerUser(supabaseAdmin, request.body);

    reply.status(201).send({
      success: true,
      data: result,
    });
  } catch (error) {
    request.log.error(error);
    reply.status(400).send({
      success: false,
      error: (error as Error).message,
    });
  }
};

/**
 * Handler de connexion utilisateur.
 * Accepte email + téléphone (sans password)
 */
export const loginHandler = async (
  request: FastifyRequest<{ Body: { email: string; telephone?: string; password?: string } }>,
  reply: FastifyReply
): Promise<void> => {
  try {
    const { email, telephone, password } = request.body;

    // Connexion via le service (email + password pour admin et organisations,
    // email + téléphone pour le flux historique utilisateur)
    const result = await loginUser(supabaseAdmin, {
      email,
      telephone,
      password,
    });

    // Récupérer profile_type et user_type
    let profileType: string | null = null;
    let userType: string | null = null;
    
    try {
      // 1️⃣ Récupérer profile_type
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('profile_type')
        .eq('id', result.userId)
        .single();

      if (!profileError && profileData && (profileData as any).profile_type) {
        profileType = (profileData as any).profile_type as string;
      }

      // 2️⃣ Si profile_type = 'utilisateur', récupérer user_type depuis table utilisateurs
      if (profileType === 'utilisateur') {
        const { data: userTypeData, error: userTypeError } = await supabaseAdmin
          .from('utilisateurs')
          .select('user_type')
          .eq('id', result.userId)
          .single();

        if (!userTypeError && userTypeData && (userTypeData as any).user_type) {
          userType = (userTypeData as any).user_type as string;
        }
      }
    } catch (e) {
      request.log.warn({ err: e }, 'Failed to fetch profile data for login response');
    }

    // Retourner token + user avec profile_type ET user_type
    return reply.status(200).send({
      token: result.token,
      refresh_token: result.refreshToken,
      user: {
        id: result.userId,
        email: result.email ?? null,
        profile_type: profileType,
        user_type: userType,
      },
    });
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({
      success: false,
      error: 'Internal server error',
    });
  }
};

export const refreshHandler = async (
  request: FastifyRequest<{ Body: { refresh_token: string } }>,
  reply: FastifyReply
): Promise<void> => {
  try {
    const refreshToken = request.body?.refresh_token;
    if (!refreshToken) {
      return reply.status(400).send({
        success: false,
        error: 'refresh_token is required',
      });
    }

    const result = await refreshAccessToken(supabaseAdmin, refreshToken);

    return reply.status(200).send({
      token: result.token,
      refresh_token: result.refreshToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        profile_type: result.user.role,
      },
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(401).send({
      success: false,
      error: (error as Error).message,
    });
  }
};

// Simple in-memory rate limiter for check-email endpoint
const _checkEmailRate = new Map<string, { count: number; first: number }>();
const CHECK_EMAIL_MAX = 10; // max requests
const CHECK_EMAIL_WINDOW = 60 * 1000; // window ms

/**
 * Handler pour vérifier l'existence d'un email dans la table `admis`.
 * POST /auth/check-email { email }
 */
export const checkEmailHandler = async (
  request: FastifyRequest<{ Body: { email: string } }>,
  reply: FastifyReply
): Promise<void> => {
  try {
    const ip = (request.ip as string) || (request.raw.socket.remoteAddress as string) || 'unknown';
    const now = Date.now();
    const entry = _checkEmailRate.get(ip);
    if (!entry || now - entry.first > CHECK_EMAIL_WINDOW) {
      _checkEmailRate.set(ip, { count: 1, first: now });
    } else {
      entry.count += 1;
      if (entry.count > CHECK_EMAIL_MAX) {
        request.log.warn({ ip, email: request.body?.email }, 'Rate limit exceeded for check-email');
        return reply.status(429).send({ error: 'Too many requests' });
      }
      _checkEmailRate.set(ip, entry);
    }

    const { email } = request.body;
    if (!email) return reply.status(400).send({ error: 'Email required' });

    // Preferred: query `profiles` table where emails are stored
    let data: any = null;
    let error: any = null;
    try {
      const r = await supabaseAdmin.from('profiles').select('id').eq('email', email).maybeSingle();
      data = r.data; error = r.error;
    } catch (e) {
      error = e as any;
    }

    // If profiles table not available, try legacy tables (`admis` or `admins`)
    if (error || !data) {
      try {
        const r2 = await supabaseAdmin.from('admis').select('id').eq('email', email).maybeSingle();
        data = r2.data; error = r2.error;
      } catch (e2) {
        error = e2 as any;
      }
    }

    if (error && /Could not find the table 'public.admis'/.test(String(error?.message || error))) {
      try {
        const r3 = await supabaseAdmin.from('admins').select('id').eq('email', email).maybeSingle();
        data = r3.data; error = r3.error;
      } catch (e3) {
        error = e3 as any;
      }
    }

    if (error) {
      request.log.error({ err: error, email }, 'Failed to query email tables');
      return reply.status(500).send({ error: 'Internal server error' });
    }

    const exists = !!(data && (data as any).id);
    // Always return a generic shape; never leak extra details
    return reply.status(200).send({ exists });
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ error: 'Internal server error' });
  }
};

/**
 * Handler de déconnexion utilisateur.
 */
export const logoutHandler = async (
  request: FastifyRequest<{ Body: { refresh_token?: string } }>,
  reply: FastifyReply
): Promise<void> => {
  try {
    const refreshToken = request.body?.refresh_token;
    if (refreshToken) {
      await revokeRefreshToken(supabaseAdmin, refreshToken);
    }
  } catch (error) {
    request.log.warn({ err: error }, 'Failed to revoke refresh token during logout');
  }

  reply.status(200).send({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * Handler de mise à jour des informations de sécurité (mot de passe et email).
 */
export const updateSecurityHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    const { current_password, new_password, new_email } = request.body as {
      current_password: string;
      new_password?: string;
      new_email?: string;
    };
    const userId = (request as any).user?.id;

    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: 'Utilisateur non authentifié'
      });
    }

    // Vérifier le mot de passe actuel
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userData.user) {
      return reply.status(404).send({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Vérifier le mot de passe actuel en essayant de se connecter
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: userData.user.email!,
      password: current_password
    });

    if (signInError) {
      return reply.status(401).send({
        success: false,
        error: 'Mot de passe actuel incorrect'
      });
    }

    // Mettre à jour l'email si fourni
    if (new_email && new_email !== userData.user.email) {
      const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: new_email
      });

      if (emailError) {
        request.log.error({ err: emailError, userId }, 'Failed to update email');
        return reply.status(400).send({
          success: false,
          error: 'Erreur lors de la mise à jour de l\'email'
        });
      }
    }

    // Mettre à jour le mot de passe si fourni
    if (new_password) {
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: new_password
      });

      if (passwordError) {
        request.log.error({ err: passwordError, userId }, 'Failed to update password');
        return reply.status(400).send({
          success: false,
          error: 'Erreur lors de la mise à jour du mot de passe'
        });
      }
    }

    reply.status(200).send({
      success: true,
      message: 'Informations de sécurité mises à jour avec succès'
    });

  } catch (error) {
    request.log.error(error);
    reply.status(500).send({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};
