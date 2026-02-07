"use strict";
// src/app.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const auth_routes_1 = require("./modules/auth/auth.routes");
const users_routes_1 = require("./modules/users/users.routes");
const admin_routes_1 = require("./modules/admin/admin.routes");
const universites_routes_1 = require("./modules/universites/universites.routes");
const centres_routes_1 = require("./modules/centres-formation/centres.routes");
const supabase_1 = __importDefault(require("./plugins/supabase"));
/**
 * Instance principale de l'application Fastify.
 * Ce fichier ne démarre pas le serveur.
 * Il configure uniquement :
 *  - les plugins
 *  - les routes
 *  - les hooks globaux
 */
const app = (0, fastify_1.default)({
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
    }
    catch (err) {
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
app.register(supabase_1.default);
// Register routes
app.register(auth_routes_1.authRoutes, { prefix: '/auth' });
app.register(users_routes_1.usersRoutes);
app.register(admin_routes_1.adminRoutes, { prefix: '/admin' });
app.register(universites_routes_1.universitesRoutes, { prefix: '/universites' });
app.register(centres_routes_1.centresRoutes, { prefix: '/centres' });
/**
 * Hook global pour gérer les erreurs non interceptées.
 * Garantit des réponses cohérentes.
 */
app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    reply.status(error.statusCode ?? 500).send({
        error: error.message ?? 'Internal Server Error',
    });
});
exports.default = app;
