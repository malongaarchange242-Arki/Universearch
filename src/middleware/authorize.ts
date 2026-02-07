import { FastifyRequest, FastifyReply } from 'fastify';
import { incCounter, recordTiming } from './metrics';

/**
 * Middleware `authorize(allowedRoles)`
 * - Vérifie que `request.user` existe (doit être précédé par `authenticate`)
 * - Vérifie que `request.user.role` fait partie des `allowedRoles`
 * - Retourne 403 si rôle non autorisé
 */
const SUPPORTED_ROLES = new Set(['superviseur', 'admin', 'universite', 'bde', 'utilisateur']);

export const authorize = (allowedRoles: string[]) => {
  const allowedSet = new Set(allowedRoles);

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const start = Date.now();
    try {
      // Auth check
      if (!request.user) {
        incCounter('authorize.unauthenticated');
        request.log?.info('authorize: unauthenticated');
        return reply.status(401).send({ error: 'Unauthenticated' });
      }

      const role = (request.user as any).role as string | undefined;

      if (!role) {
        incCounter('authorize.missing_role');
        request.log?.info({ userId: (request.user as any).id }, 'authorize: missing role');
        return reply.status(403).send({ error: 'Forbidden: missing role' });
      }

      if (!SUPPORTED_ROLES.has(role)) {
        incCounter('authorize.unknown_role');
        request.log?.info({ userId: (request.user as any).id, role }, 'authorize: unknown role');
        return reply.status(403).send({ error: 'Forbidden: unknown role' });
      }

      if (!allowedSet.has(role)) {
        incCounter('authorize.forbidden');
        request.log?.info({ userId: (request.user as any).id, role }, 'authorize: insufficient privileges');
        return reply.status(403).send({ error: 'Forbidden: insufficient privileges' });
      }

      incCounter('authorize.success');
      request.log?.info({ userId: (request.user as any).id, role }, 'authorize: success');
      return;
    } finally {
      recordTiming('authorize.duration_ms', Date.now() - start);
    }
  };
};

export default authorize;
