"use strict";
/**
 * Routes pour les universités.
 *
 * Routes publiques:
 *   GET  /universites        (lister approuvées)
 *   GET  /universites/:id    (voir détails approuvées)
 *
 * Routes protégées (rôle UNIVERSITE + APPROVED):
 *   GET  /universites/me     (mes infos)
 *   PUT  /universites/me     (modifier mes infos)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.universitesRoutes = void 0;
const universites_controller_1 = require("./universites.controller");
const universites_service_1 = require("./universites.service");
const supabase_1 = require("../../plugins/supabase");
const middleware_1 = require("../../middleware");
const universites_schema_1 = require("./universites.schema");
const universitesRoutes = async (app, _options) => {
    const service = new universites_service_1.UniversitesService(supabase_1.supabaseAdmin);
    const controller = new universites_controller_1.UniversitesController(service);
    // Routes publiques (sans authentification)
    app.get('/', { schema: universites_schema_1.listUniversitesSchema }, (req, reply) => controller.listApprovedUniversites(req, reply));
    app.get('/:id', { schema: universites_schema_1.getUniversiteByIdSchema }, (req, reply) => controller.getUniversiteById(req, reply));
    // Routes protégées (authentification + autorisation UNIVERSITE + vérification APPROVED)
    await app.register(async function (fastify) {
        fastify.addHook('preHandler', middleware_1.authenticate);
        fastify.addHook('preHandler', (0, middleware_1.authorize)(['universite']));
        fastify.get('/me', { schema: universites_schema_1.getMyUniversiteSchema }, (req, reply) => controller.getMyUniversite(req, reply));
        fastify.put('/me', { schema: universites_schema_1.updateMyUniversiteSchema }, (req, reply) => controller.updateMyUniversite(req, reply));
    });
};
exports.universitesRoutes = universitesRoutes;
