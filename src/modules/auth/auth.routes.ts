/**
 * Auth routes
 * src/modules/auth/auth.routes.ts
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { registerHandler, loginHandler, logoutHandler } from './auth.controller';
import { registerSchema, loginSchema } from './auth.schema';
import { authenticate } from '../../middleware/authenticate';

export const authRoutes = async (
  app: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> => {

  // Création d’un compte (email + password uniquement)
  app.post('/register', { schema: registerSchema }, registerHandler);

  // Connexion utilisateur
  app.post('/login', { schema: loginSchema }, loginHandler);

  // Déconnexion (nécessite un token valide)
  app.post('/logout', {
    preHandler: [authenticate]
  }, logoutHandler);
};
