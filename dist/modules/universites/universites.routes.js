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
const frais_scolarite_controller_1 = require("../frais-scolarite/frais-scolarite.controller");
const frais_scolarite_service_1 = require("../frais-scolarite/frais-scolarite.service");
const frais_scolarite_schema_1 = require("../frais-scolarite/frais-scolarite.schema");
const universitesRoutes = async (app, _options) => {
    const service = new universites_service_1.UniversitesService(supabase_1.supabaseAdmin);
    const controller = new universites_controller_1.UniversitesController(service);
    const fraisService = new frais_scolarite_service_1.FraisScolariteService(supabase_1.supabaseAdmin);
    const fraisController = new frais_scolarite_controller_1.FraisScolariteController(fraisService);
    // Routes protégées (authentification + autorisation UNIVERSITE + vérification APPROVED)
    // IMPORTANT: Placer AVANT les routes avec :id pour éviter que :id capture 'me'
    await app.register(async function (fastify) {
        fastify.addHook('preHandler', middleware_1.authenticate);
        fastify.addHook('preHandler', (0, middleware_1.authorize)(['universite', 'admin']));
        fastify.get('/me', { schema: universites_schema_1.getMyUniversiteSchema }, (req, reply) => controller.getMyUniversite(req, reply));
        fastify.put('/me', { schema: universites_schema_1.updateMyUniversiteSchema }, (req, reply) => controller.updateMyUniversite(req, reply));
        // Attach multiple filières to my université
        fastify.post('/me/filieres', { schema: universites_schema_1.attachFilieresSchema }, (req, reply) => controller.attachFilieresToMyUniversite(req, reply));
        // Upload logo for my université
        fastify.post('/me/logo', (req, reply) => controller.uploadMyLogo(req, reply));
        // ============================================
        // FRAIS DE SCOLARITÉ ROUTES (Protected)
        // ============================================
        /**
         * GET /universites/me/frais-scolarite
         * List all tuition fees for authenticated university
         */
        fastify.get('/me/frais-scolarite', { schema: frais_scolarite_schema_1.listFraisSchema }, (req, reply) => fraisController.getFraisForMyUniversite(req, reply));
        /**
         * POST /universites/me/frais-scolarite
         * Create or update tuition fees (upsert operation)
         */
        fastify.post('/me/frais-scolarite', { schema: frais_scolarite_schema_1.createFraisSchema }, (req, reply) => fraisController.createOrUpdateFraisForMyUniversite(req, reply));
        /**
         * GET /universites/me/frais-scolarite/stats
         * Get statistics about fees (must be before :id route)
         */
        fastify.get('/me/frais-scolarite/stats', (req, reply) => fraisController.getFraisStatistics(req, reply));
        /**
         * GET /universites/me/frais-scolarite/:id
         * Get a specific frais entry by ID
         */
        fastify.get('/me/frais-scolarite/:id', { schema: frais_scolarite_schema_1.getFraisByIdSchema }, (req, reply) => fraisController.getFraisById(req, reply));
        /**
         * PUT /universites/me/frais-scolarite/:id
         * Update a specific frais entry
         */
        fastify.put('/me/frais-scolarite/:id', (req, reply) => fraisController.updateFraisById(req, reply));
        /**
         * DELETE /universites/me/frais-scolarite/:id
         * Delete a specific frais entry
         */
        fastify.delete('/me/frais-scolarite/:id', (req, reply) => fraisController.deleteFraisById(req, reply));
    });
    // Routes publiques (sans authentification) - placées APRÈS les routes /me
    app.post('/', (req, reply) => controller.createUniversite(req, reply));
    app.get('/', { schema: universites_schema_1.listUniversitesSchema }, (req, reply) => controller.listApprovedUniversites(req, reply));
    /**
     * GET /universites/:id/frais-scolarite
     * Get public frais for a specific university (public route)
     */
    app.get('/:id/frais-scolarite', async (req, reply) => {
        try {
            const { id } = req.params;
            if (!id) {
                return reply.status(400).send({
                    error: 'University ID is required',
                });
            }
            const frais = await fraisService.getFraisByUniversiteId(id);
            reply.status(200).send({
                message: 'Frais retrieved successfully',
                data: frais,
            });
        }
        catch (err) {
            req.log.error(err);
            reply.status(500).send({
                error: err.message,
            });
        }
    });
    app.get('/:id', { schema: universites_schema_1.getUniversiteByIdSchema }, (req, reply) => controller.getUniversiteById(req, reply));
};
exports.universitesRoutes = universitesRoutes;
