/**
 * Auth routes
 * src/modules/auth/auth.routes.ts
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { registerHandler, loginHandler, logoutHandler } from './auth.controller';
import { registerSchema, loginSchema } from './auth.schema';
<<<<<<< HEAD
import { authenticate } from '../../middleware/authenticate';
=======
import { authenticate } from '../../middleware';
>>>>>>> 99dc8c3 (Initial commit - identity service)

export const authRoutes = async (
  app: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> => {
<<<<<<< HEAD

  // Création d’un compte (email + password uniquement)
  app.post('/register', { schema: registerSchema }, registerHandler);

  // Connexion utilisateur
  app.post('/login', { schema: loginSchema }, loginHandler);

  // Déconnexion (nécessite un token valide)
  app.post('/logout', {
    preHandler: [authenticate]
  }, logoutHandler);
=======
  // Création compte
  app.post('/register', { schema: registerSchema }, registerHandler);

  // Connexion
  app.post('/login', { schema: loginSchema }, loginHandler);

  // Déconnexion (protégée)
  app.post('/logout', { preHandler: [authenticate] }, logoutHandler);
>>>>>>> 99dc8c3 (Initial commit - identity service)
};
