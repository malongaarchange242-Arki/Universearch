// src/modules/auth/auth.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
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
 * Connexion utilisateur
 */
export const loginHandler = async (
  request: FastifyRequest<{ Body: { email: string; password: string } }>,
  reply: FastifyReply
): Promise<void> => {
  try {
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
    });
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({
      success: false,
      error: 'Logout failed',
    });
  }
};
