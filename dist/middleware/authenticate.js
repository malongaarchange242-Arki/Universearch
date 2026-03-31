"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const metrics_1 = require("./metrics");
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
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            request.log?.error('authenticate: missing JWT_SECRET configuration');
            return reply.status(500).send({ error: 'Authentication misconfigured' });
        }
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, secret);
        }
        catch (_err) {
            (0, metrics_1.incCounter)('auth.invalid_token');
            request.log?.info('authenticate: invalid or expired token');
            return reply.status(401).send({ error: 'Invalid or expired token' });
        }
        if (!decoded ||
            typeof decoded !== 'object' ||
            !decoded.id ||
            !decoded.email ||
            !decoded.role) {
            (0, metrics_1.incCounter)('auth.invalid_token');
            request.log?.info('authenticate: invalid token payload');
            return reply.status(401).send({ error: 'Invalid token payload' });
        }
        // Injection user dans la requête
        const userObj = {
            id: String(decoded.id),
            email: decoded.email ?? null,
            role: String(decoded.role),
        };
        request.user = userObj;
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
