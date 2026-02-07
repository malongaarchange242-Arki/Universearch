"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const metrics_1 = require("./metrics");
/**
 * Middleware `authorize(allowedRoles)`
 * - Vérifie que `request.user` existe (doit être précédé par `authenticate`)
 * - Vérifie que `request.user.role` fait partie des `allowedRoles`
 * - Pour les universités et centres de formation: vérifie que le statut est APPROVED
 * - Retourne 403 si rôle non autorisé ou statut non approuvé
 */
const SUPPORTED_ROLES = new Set(['superviseur', 'admin', 'universite', 'bde', 'utilisateur', 'centre_formation']);
/**
 * Rôles qui nécessitent une vérification de statut APPROVED
 */
const ROLES_REQUIRING_APPROVAL = new Set(['universite', 'centre_formation']);
const authorize = (allowedRoles) => {
    const allowedSet = new Set(allowedRoles);
    return async (request, reply) => {
        const start = Date.now();
        try {
            // Auth check
            if (!request.user) {
                (0, metrics_1.incCounter)('authorize.unauthenticated');
                request.log?.info('authorize: unauthenticated');
                return reply.status(401).send({ error: 'Unauthenticated' });
            }
            const role = request.user.role;
            if (!role) {
                (0, metrics_1.incCounter)('authorize.missing_role');
                request.log?.info({ userId: request.user.id }, 'authorize: missing role');
                return reply.status(403).send({ error: 'Forbidden: missing role' });
            }
            if (!SUPPORTED_ROLES.has(role)) {
                (0, metrics_1.incCounter)('authorize.unknown_role');
                request.log?.info({ userId: request.user.id, role }, 'authorize: unknown role');
                return reply.status(403).send({ error: 'Forbidden: unknown role' });
            }
            if (!allowedSet.has(role)) {
                (0, metrics_1.incCounter)('authorize.forbidden');
                request.log?.info({ userId: request.user.id, role }, 'authorize: insufficient privileges');
                return reply.status(403).send({ error: 'Forbidden: insufficient privileges' });
            }
            // 🔐 Vérification du statut APPROVED pour universités et centres de formation
            if (ROLES_REQUIRING_APPROVAL.has(role)) {
                try {
                    const fastify = request.server;
                    const userId = request.user.id;
                    const table = role === 'universite' ? 'universites' : 'centres_formation';
                    const { data, error } = await fastify.supabase
                        .from(table)
                        .select('statut')
                        .eq('profile_id', userId)
                        .single();
                    if (error || !data) {
                        (0, metrics_1.incCounter)('authorize.account_not_found');
                        request.log?.info({ userId, role }, `authorize: ${table} account not found`);
                        return reply.status(403).send({
                            error: `Forbidden: ${role} account not found`,
                        });
                    }
                    if (data.statut !== 'APPROVED') {
                        (0, metrics_1.incCounter)('authorize.not_approved');
                        request.log?.info({ userId, role, statut: data.statut }, `authorize: ${role} not approved`);
                        return reply.status(403).send({
                            error: `Forbidden: Your ${role} account is not approved yet (status: ${data.statut})`,
                        });
                    }
                }
                catch (approvalErr) {
                    (0, metrics_1.incCounter)('authorize.approval_check_failed');
                    request.log?.error(approvalErr);
                    return reply.status(500).send({
                        error: 'Failed to verify account approval status',
                    });
                }
            }
            (0, metrics_1.incCounter)('authorize.success');
            request.log?.info({ userId: request.user.id, role }, 'authorize: success');
            return;
        }
        finally {
            (0, metrics_1.recordTiming)('authorize.duration_ms', Date.now() - start);
        }
    };
};
exports.authorize = authorize;
exports.default = exports.authorize;
