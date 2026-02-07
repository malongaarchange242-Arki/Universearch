/**
 * Auth routes
 * src/modules/auth/auth.routes.ts
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { registerHandler, loginHandler, logoutHandler } from './auth.controller';
import { registerSchema, loginSchema } from './auth.schema';
import { authenticate } from '../../middleware';

export const authRoutes = async (
  app: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> => {
  // Création compte
  app.post('/register', { schema: registerSchema }, registerHandler);

  // Connexion
  app.post('/login', { schema: loginSchema }, loginHandler);

  // Déconnexion (protégée)
  app.post('/logout', { preHandler: [authenticate] }, logoutHandler);
};
