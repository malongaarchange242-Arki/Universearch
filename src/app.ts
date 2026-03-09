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
import { filieresRoutes } from './modules/filieres/filieres.routes';
import { registerBdeRoutes } from './modules/bde/bde.routes';
import { registerRepresentantRoutes } from './modules/representants/representants.routes';
import { followersRoutes } from './modules/followers/followers.routes';
import supabasePlugin from './plugins/supabase';
import { supabaseAdmin } from './plugins/supabase';

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
// Lightweight CORS handling for Fastify v4 (avoid upgrading Fastify/plugin mismatch)
app.addHook('onRequest', (request, reply, done) => {
  reply.header('Access-Control-Allow-Origin', '*');
  // Allow PATCH for admin approval endpoints and other verbs used by the front-end
  reply.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-user-id');
  if (request.raw.method === 'OPTIONS') {
    reply.status(204).send();
    return;
  }
  done();
});

app.register(supabasePlugin as any);

// Expose top-level domain grouping endpoint for convenience
app.get('/domaines-with-filieres', async (req, reply) => {
  const { FilieresService } = await import('./modules/filieres/filieres.service');
  const { FilieresController } = await import('./modules/filieres/filieres.controller');
  const service = new FilieresService(supabaseAdmin as any);
  const controller = new FilieresController(service as any);
  return controller.listDomainesWithFilieres(req as any, reply as any);
});

// Register routes
app.register(authRoutes, { prefix: '/auth' });
app.register(usersRoutes as any);
app.register(adminRoutes, { prefix: '/admin' });
app.register(universitesRoutes, { prefix: '/universites' });
app.register(centresRoutes, { prefix: '/centres' });
app.register(filieresRoutes, { prefix: '/filieres' });
app.register(registerBdeRoutes as any);
app.register(registerRepresentantRoutes as any);
app.register(followersRoutes);

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
