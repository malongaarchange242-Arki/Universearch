// src/app.ts

import Fastify, {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
} from 'fastify';
import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/users/users.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { universitesRoutes } from './modules/universites/universites.routes';
import { centresRoutes } from './modules/centres-formation/centres.routes';
import supabasePlugin from './plugins/supabase';

/**
 * Instance principale de l'application Fastify.
 * Ce fichier ne démarre pas le serveur.
 * Il configure uniquement :
 *  - les plugins
 *  - les routes
 *  - les hooks globaux
 */

const app: FastifyInstance = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Normalize incoming URL: strip encoded spaces and simple whitespace, redirect to cleaned path
app.addHook('onRequest', (request, reply, done) => {
  try {
    const raw = (request.raw.url || '').toString();
    const cleaned = raw.replace(/%20/g, '').replace(/\s+/g, '');
    if (cleaned !== raw && cleaned.length > 0) {
      reply.redirect(301, cleaned);
      return;
    }
  } catch (err) {
    // noop - fall through to normal handling
  }
  done();
});

/**
 * Route de santé.
 * Utilisée par :
 *  - Docker
 *  - Kubernetes
 *  - monitoring
 */
app.get('/health', async () => {
  return {
    status: 'ok',
    service: 'identity-service',
    timestamp: new Date().toISOString(),
  };
});

// Accept POST /health as well for healthcheck clients that use POST
app.post('/health', async () => ({
  status: 'ok',
  service: 'identity-service',
  timestamp: new Date().toISOString(),
}));

// Plugins: supabase must be registered before other routes (depends on it)
app.register(supabasePlugin as any);

// Register routes
app.register(authRoutes, { prefix: '/auth' });
app.register(usersRoutes as any);
app.register(adminRoutes, { prefix: '/admin' });
app.register(universitesRoutes, { prefix: '/universites' });
app.register(centresRoutes, { prefix: '/centres' });

/**
 * Hook global pour gérer les erreurs non interceptées.
 * Garantit des réponses cohérentes.
 */
app.setErrorHandler(
  (
    error: Error & { statusCode?: number },
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    request.log.error(error);

    reply.status(error.statusCode ?? 500).send({
      error: error.message ?? 'Internal Server Error',
    });
  }
);

export default app;
