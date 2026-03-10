"use strict";
// src/app.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const filieres_routes_1 = require("./modules/filieres/filieres.routes");
const bde_routes_1 = require("./modules/bde/bde.routes");
const representants_routes_1 = require("./modules/representants/representants.routes");
const followers_routes_1 = require("./modules/followers/followers.routes");
const supabase_1 = __importDefault(require("./plugins/supabase"));
const supabase_2 = require("./plugins/supabase");
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
app.register(supabase_1.default);
// Expose top-level domain grouping endpoint for convenience
app.get('/domaines-with-filieres', async (req, reply) => {
    const { FilieresService } = await Promise.resolve().then(() => __importStar(require('./modules/filieres/filieres.service')));
    const { FilieresController } = await Promise.resolve().then(() => __importStar(require('./modules/filieres/filieres.controller')));
    const service = new FilieresService(supabase_2.supabaseAdmin);
    const controller = new FilieresController(service);
    return controller.listDomainesWithFilieres(req, reply);
});
// Register routes
app.register(auth_routes_1.authRoutes, { prefix: '/auth' });
app.register(users_routes_1.usersRoutes);
app.register(admin_routes_1.adminRoutes, { prefix: '/admin' });
app.register(universites_routes_1.universitesRoutes, { prefix: '/universites' });
app.register(centres_routes_1.centresRoutes, { prefix: '/centres' });
app.register(filieres_routes_1.filieresRoutes, { prefix: '/filieres' });
app.register(bde_routes_1.registerBdeRoutes);
app.register(representants_routes_1.registerRepresentantRoutes);
app.register(followers_routes_1.followersRoutes);
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
