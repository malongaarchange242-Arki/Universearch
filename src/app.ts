import Fastify, {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
} from 'fastify';
import { authRoutes } from './modules/auth/auth.routes';
import supabasePlugin from './plugins/supabase';

const app: FastifyInstance = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

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
  }
  done();
});

// ---------------- HEALTH ----------------
app.get('/health', async () => ({
  status: 'ok',
  service: 'identity-service',
  timestamp: new Date().toISOString(),
}));

app.post('/health', async () => ({
  status: 'ok',
  service: 'identity-service',
  timestamp: new Date().toISOString(),
}));

// ---------------- PLUGINS ----------------
app.register(supabasePlugin as any); // 🔥 DOIT être avant les routes

// ---------------- ROUTES ----------------
app.register(authRoutes, { prefix: '/auth' });

// ---------------- ERROR HANDLER ----------------
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
