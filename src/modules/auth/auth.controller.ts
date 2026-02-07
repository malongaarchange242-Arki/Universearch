// src/modules/auth/auth.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
<<<<<<< HEAD
import { registerUser, loginUser } from './auth.service';
import { supabaseAdmin } from '../../plugins/supabase';

/**
 * Création de compte (AUTH UNIQUEMENT)
 */
export const registerHandler = async (
  request: FastifyRequest<{ Body: { email: string; password: string } }>,
  reply: FastifyReply
): Promise<void> => {
  try {
=======
import { registerUser, RegisterPayload } from './auth.service';
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
>>>>>>> 99dc8c3 (Initial commit - identity service)
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
<<<<<<< HEAD
 * Connexion utilisateur
=======
 * Handler de connexion utilisateur.
>>>>>>> 99dc8c3 (Initial commit - identity service)
 */
export const loginHandler = async (
  request: FastifyRequest<{ Body: { email: string; password: string } }>,
  reply: FastifyReply
): Promise<void> => {
  try {
<<<<<<< HEAD
    const result = await loginUser(supabaseAdmin, request.body);

    reply.send({
      success: true,
      data: result,
    });
  } catch (err) {
    request.log.error(err);
    reply.status(401).send({
      success: false,
      error: (err as Error).message,
    });
  }
};

/**
 * Déconnexion utilisateur
 */
export const logoutHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    await supabaseAdmin.auth.signOut();
    reply.status(200).send({
      success: true,
      message: 'Logged out successfully',
=======
    const { email, password } = request.body;

    // Connexion via Supabase
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid credentials',
      });
    }

    reply.send({
      success: true,
      data: {
        userId: data.user.id,
        email: data.user.email,
        token: data.session?.access_token, // si JWT
      },
>>>>>>> 99dc8c3 (Initial commit - identity service)
    });
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({
      success: false,
<<<<<<< HEAD
      error: 'Logout failed',
    });
  }
};
=======
      error: 'Internal server error',
    });
  }
};

/**
 * Handler de déconnexion utilisateur.
 */
export const logoutHandler = async (
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  reply.status(200).send({
    success: true,
    message: 'Logged out successfully',
  });
};
>>>>>>> 99dc8c3 (Initial commit - identity service)
