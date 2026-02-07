// src/modules/auth/auth.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
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
 */
export const loginHandler = async (
  request: FastifyRequest<{ Body: { email: string; password: string } }>,
  reply: FastifyReply
): Promise<void> => {
  try {
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
    });
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({
      success: false,
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
