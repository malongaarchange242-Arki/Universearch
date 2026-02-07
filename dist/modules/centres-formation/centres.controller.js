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
            reply.status(500).send({
                error: err.message,
            });
        }
    }
    /**
     * PUT /centres/me
     * Mettre à jour mes infos centre
     */
    async updateMyCentre(req, reply) {
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
    async getCentreById(req, reply) {
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
    async listApprovedCentres(req, reply) {
        try {
            const { limit = 20, offset = 0 } = req.query;
            const data = await this.service.listApprovedCentres(limit, offset);
            reply.status(200).send({
                count: data.length,
                data,
            });
        }
        catch (err) {
            req.log.error(err);
            reply.status(500).send({
                error: err.message,
            });
        }
    }
}
exports.CentresController = CentresController;
