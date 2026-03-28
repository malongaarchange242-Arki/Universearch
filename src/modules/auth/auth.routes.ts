/**
 * Auth routes
 * src/modules/auth/auth.routes.ts
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { registerHandler, loginHandler, logoutHandler, checkEmailHandler, updateSecurityHandler } from './auth.controller';
import { registerSchema, loginSchema, checkEmailSchema, updateSecuritySchema } from './auth.schema';
import { authenticate } from '../../middleware';

export const authRoutes = async (
  app: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> => {
  // Création compte
  app.post('/register', { schema: registerSchema }, registerHandler);

  // Connexion
  app.post('/login', { schema: loginSchema }, loginHandler);

  // Vérification d'email avant affichage du champ mot de passe
  app.post('/check-email', { schema: checkEmailSchema }, checkEmailHandler);

  // Déconnexion (protégée)
  app.post('/logout', { preHandler: [authenticate] }, logoutHandler);

  // Mise à jour des informations de sécurité (protégée)
  app.put('/update-security', { schema: updateSecuritySchema, preHandler: [authenticate] }, updateSecurityHandler);
};
