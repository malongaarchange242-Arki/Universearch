import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { incCounter, recordTiming } from './metrics';

/**
 * Middleware `authenticate` pour Fastify (preHandler).
 * - Vérifie l'en-tête `Authorization: Bearer <token>`
 * - Vérifie le token via JWT custom
 * - Injecte `request.user = { id, email, role }`
 * - Retourne 401 en cas d'échec
 *
 * Remarque : accède au client Supabase préalablement décoré sur l'instance Fastify
 * via `fastify.decorate('supabase', supabaseAdmin)` (ou similaire).
 */
export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  const start = Date.now();
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      incCounter('auth.missing_header');
      request.log?.info('authenticate: missing Authorization header');
      return reply.status(401).send({ error: 'Missing Authorization header' });
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      incCounter('auth.invalid_format');
      request.log?.info('authenticate: invalid Authorization format');
      return reply.status(401).send({ error: 'Invalid Authorization format' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      request.log?.error('authenticate: missing JWT_SECRET configuration');
      return reply.status(500).send({ error: 'Authentication misconfigured' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch (_err) {
      incCounter('auth.invalid_token');
      request.log?.info('authenticate: invalid or expired token');
      return reply.status(401).send({ error: 'Invalid or expired token' });
    }

    if (
      !decoded ||
      typeof decoded !== 'object' ||
      !decoded.id ||
      !decoded.email ||
      !decoded.role
    ) {
      incCounter('auth.invalid_token');
      request.log?.info('authenticate: invalid token payload');
      return reply.status(401).send({ error: 'Invalid token payload' });
    }

    // Injection user dans la requête
    const userObj: any = {
      id: String(decoded.id),
      email: decoded.email ?? null,
      role: String(decoded.role),
    };

    request.user = userObj;

    incCounter('auth.success');
    request.log?.info({ userId: userObj.id, role: userObj.role }, 'authenticate: success');
  } catch (err) {
    incCounter('auth.failure');
    request.log?.error(err);
    return reply.status(401).send({ error: 'Unauthorized' });
  } finally {
    const duration = Date.now() - start;
    recordTiming('auth.duration_ms', duration);
  }
};

export default authenticate;
