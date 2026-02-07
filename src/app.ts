<<<<<<< HEAD
=======
// src/app.ts

>>>>>>> 99dc8c3 (Initial commit - identity service)
import Fastify, {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
} from 'fastify';
import { authRoutes } from './modules/auth/auth.routes';
<<<<<<< HEAD
import supabasePlugin from './plugins/supabase';
=======
import { usersRoutes } from './modules/users/users.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { universitesRoutes } from './modules/universites/universites.routes';
import { centresRoutes } from './modules/centres-formation/centres.routes';
import supabasePlugin from './plugins/supabase';
// authPlugin is intentionally not registered because authentication is handled by middleware



/**
 * Instance principale de l'application Fastify.
 * Ce fichier ne démarre pas le serveur.
 * Il configure uniquement :
 *  - les plugins
 *  - les routes
 *  - les hooks globaux
 */
>>>>>>> 99dc8c3 (Initial commit - identity service)

const app: FastifyInstance = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

<<<<<<< HEAD
// ---------------- CORS ----------------
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://127.0.0.1:5501',
  'http://localhost:5500',
  'http://localhost:5501',
  'http://localhost:8000',
];

app.addHook('onRequest', (request, reply, done) => {
  const origin = (request.headers.origin as string) || '';
  if (allowedOrigins.includes(origin) || origin === '') {
    reply.header('Access-Control-Allow-Origin', origin || '*');
    reply.header('Access-Control-Allow-Credentials', 'true');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');
    reply.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  }
  if (request.raw.method === 'OPTIONS') {
    reply.status(204).send();
    return;
=======
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
>>>>>>> 99dc8c3 (Initial commit - identity service)
  }
  done();
});

<<<<<<< HEAD
// ---------------- HEALTH ----------------
app.get('/health', async () => ({
  status: 'ok',
  service: 'identity-service',
  timestamp: new Date().toISOString(),
}));

=======
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
>>>>>>> 99dc8c3 (Initial commit - identity service)
app.post('/health', async () => ({
  status: 'ok',
  service: 'identity-service',
  timestamp: new Date().toISOString(),
}));

<<<<<<< HEAD
// ---------------- PLUGINS ----------------
app.register(supabasePlugin as any); // 🔥 DOIT être avant les routes

// ---------------- ROUTES ----------------
app.register(authRoutes, { prefix: '/auth' });

// ---------------- ERROR HANDLER ----------------
=======
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
>>>>>>> 99dc8c3 (Initial commit - identity service)
app.setErrorHandler(
  (
    error: Error & { statusCode?: number },
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    request.log.error(error);
<<<<<<< HEAD
=======

>>>>>>> 99dc8c3 (Initial commit - identity service)
    reply.status(error.statusCode ?? 500).send({
      error: error.message ?? 'Internal Server Error',
    });
  }
);

export default app;
