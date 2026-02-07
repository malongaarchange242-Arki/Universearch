"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const metrics_1 = require("./metrics");
/**
 * Middleware `authenticate` pour Fastify (preHandler).
 * - Vérifie l'en-tête `Authorization: Bearer <token>`
 * - Vérifie le token via Supabase
 * - Injecte `request.user = { id, email, role? }`
 * - Retourne 401 en cas d'échec
 *
 * Remarque : accède au client Supabase préalablement décoré sur l'instance Fastify
 * via `fastify.decorate('supabase', supabaseAdmin)` (ou similaire).
 */
const authenticate = async (request, reply) => {
    const start = Date.now();
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            (0, metrics_1.incCounter)('auth.missing_header');
            request.log?.info('authenticate: missing Authorization header');
            return reply.status(401).send({ error: 'Missing Authorization header' });
        }
        const [type, token] = authHeader.split(' ');
        if (type !== 'Bearer' || !token) {
            (0, metrics_1.incCounter)('auth.invalid_format');
            request.log?.info('authenticate: invalid Authorization format');
            return reply.status(401).send({ error: 'Invalid Authorization format' });
        }
        // Accès au client supabase attaché sur l'instance Fastify
        const fastify = request.server;
        // Vérification du token via Supabase
        const { data, error } = await fastify.supabase.auth.getUser(token);
        if (error || !data?.user) {
            (0, metrics_1.incCounter)('auth.invalid_token');
            request.log?.info('authenticate: invalid or expired token');
            return reply.status(401).send({ error: 'Invalid or expired token' });
        }
        // Injection user dans la requête
        const userObj = {
            id: data.user.id,
            email: data.user.email ?? null,
            // role peut venir de user_metadata ou de la table profiles; on essaie metadata d'abord
            role: data.user.user_metadata?.role ?? null,
        };
        request.user = userObj;
        // Si le rôle n'est pas présent dans les metadata, tenter de récupérer depuis la table `profiles`
        if (!userObj.role) {
            try {
                const { data: profile, error: profErr } = await fastify.supabase
                    .from('profiles')
                    .select('profile_type')
                    .eq('id', data.user.id)
                    .single();
                if (!profErr && profile?.profile_type) {
                    userObj.role = profile.profile_type;
                }
            }
            catch (e) {
                // Ne pas bloquer l'utilisateur si la récupération échoue; logguer seulement
                request.log?.error?.(e);
            }
        }
        (0, metrics_1.incCounter)('auth.success');
        request.log?.info({ userId: userObj.id, role: userObj.role }, 'authenticate: success');
    }
    catch (err) {
        (0, metrics_1.incCounter)('auth.failure');
        request.log?.error(err);
        return reply.status(401).send({ error: 'Unauthorized' });
    }
    finally {
        const duration = Date.now() - start;
        (0, metrics_1.recordTiming)('auth.duration_ms', duration);
    }
};
exports.authenticate = authenticate;
exports.default = exports.authenticate;
