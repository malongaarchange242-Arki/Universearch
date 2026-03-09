"use strict";
/**
 * Controllers pour la gestion des centres de formation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CentresController = void 0;
class CentresController {
    service;
    constructor(service) {
        this.service = service;
    }
    /**
     * GET /centres/me
     * Récupérer mes infos centre
     */
    async getMyCentre(req, reply) {
        try {
            const userId = req.user.id;
            const centre = await this.service.getMyCentre(userId);
            if (!centre) {
                return reply.status(404).send({
                    error: 'Centre not found for your account',
                });
            }
            reply.status(200).send(centre);
        }
        catch (err) {
            req.log.error(err);
            reply.status(200).send(data);
        }
        /**
         * PUT /centres/me
         * Mettre à jour mes infos centre
         */
        async;
        updateMyCentre(req, fastify_1.FastifyRequest, reply, fastify_1.FastifyReply);
        {
            try {
                const userId = req.user.id;
                const payload = req.body;
                const result = await this.service.updateMyCentre(userId, payload);
                reply.status(200).send({
                    message: 'Centre updated successfully',
                    data: result,
                });
            }
            catch (err) {
                req.log.error(err);
                reply.status(400).send({
                    error: err.message,
                });
            }
        }
        /**
         * GET /centres/:id
         * Récupérer les infos publiques d'un centre (approuvé)
         */
        async;
        getCentreById(req, fastify_1.FastifyRequest, reply, fastify_1.FastifyReply);
        {
            try {
                const { id } = req.params;
                const centre = await this.service.getCentreById(id);
                if (!centre) {
                    return reply.status(404).send({
                        error: 'Centre not found',
                    });
                }
                reply.status(200).send(centre);
            }
            catch (err) {
                req.log.error(err);
                reply.status(500).send({
                    error: err.message,
                });
            }
        }
        /**
         * GET /centres
         * Lister tous les centres approuvés
         */
        async;
        listApprovedCentres(req, fastify_1.FastifyRequest, reply, fastify_1.FastifyReply);
        {
            try {
                const { limit = 20, offset = 0 } = req.query;
                const data = await this.service.listApprovedCentres(limit, offset);
                reply.status(200).send(data);
            }
            catch (err) {
                req.log.error(err);
                reply.status(500).send({
                    error: err.message,
                });
            }
        }
        /**
         * POST /centres
         * Create a new centre de formation (public)
         */
        async;
        createCentre(req, fastify_1.FastifyRequest, reply, fastify_1.FastifyReply);
        {
            try {
                const payload = req.body;
                const result = await this.service.createCentre(payload);
                reply.status(201).send({ success: true, data: result });
            }
            catch (err) {
                req.log.error(err);
                reply.status(400).send({ success: false, error: err.message });
            }
        }
        /**
         * POST /centres/me/logo
         * Upload a logo for the authenticated user's centre.
         * Accepts multipart file (preferred) or JSON { file: <base64>, filename, contentType }.
         */
        async;
        uploadMyLogo(req, fastify_1.FastifyRequest, reply, fastify_1.FastifyReply);
        {
            try {
                const userId = req.user.id;
                let buffer = null;
                let filename = `logo_${Date.now()}.png`;
                let contentType = 'image/png';
                // Try multipart first (if fastify-multipart is enabled)
                try {
                    const mp = req.file ? await req.file() : null;
                    if (mp) {
                        buffer = await mp.toBuffer();
                        filename = mp.filename || filename;
                        contentType = mp.mimetype || contentType;
                    }
                }
                catch (e) {
                    // ignore and fallback to JSON body
                }
                if (!buffer) {
                    const body = req.body;
                    if (!body || !body.file || !body.filename) {
                        return reply.status(400).send({ success: false, error: 'No file provided' });
                    }
                    buffer = Buffer.from(body.file, 'base64');
                    filename = body.filename;
                    contentType = body.contentType || contentType;
                }
                const url = await this.service.uploadLogoForMyCentre(userId, buffer, filename, contentType);
                reply.status(200).send({ success: true, url });
            }
            catch (err) {
                req.log.error(err);
                reply.status(500).send({ success: false, error: err.message });
            }
        }
    }
}
exports.CentresController = CentresController;
