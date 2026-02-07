"use strict";
/**
 * Controllers pour la gestion des universités.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversitesController = void 0;
class UniversitesController {
    service;
    constructor(service) {
        this.service = service;
    }
    /**
     * GET /universites/me
     * Récupérer mes infos université
     */
    async getMyUniversite(req, reply) {
        try {
            const userId = req.user.id;
            const universite = await this.service.getMyUniversite(userId);
            if (!universite) {
                return reply.status(404).send({
                    error: 'Université not found for your account',
                });
            }
            reply.status(200).send(universite);
        }
        catch (err) {
            req.log.error(err);
            reply.status(500).send({
                error: err.message,
            });
        }
    }
    /**
     * PUT /universites/me
     * Mettre à jour mes infos université
     */
    async updateMyUniversite(req, reply) {
        try {
            const userId = req.user.id;
            const payload = req.body;
            const result = await this.service.updateMyUniversite(userId, payload);
            reply.status(200).send({
                message: 'Université updated successfully',
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
     * GET /universites/:id
     * Récupérer les infos publiques d'une université (approuvée)
     */
    async getUniversiteById(req, reply) {
        try {
            const { id } = req.params;
            const universite = await this.service.getUniversiteById(id);
            if (!universite) {
                return reply.status(404).send({
                    error: 'Université not found',
                });
            }
            reply.status(200).send(universite);
        }
        catch (err) {
            req.log.error(err);
            reply.status(500).send({
                error: err.message,
            });
        }
    }
    /**
     * GET /universites
     * Lister toutes les universités approuvées
     */
    async listApprovedUniversites(req, reply) {
        try {
            const { limit = 20, offset = 0 } = req.query;
            const data = await this.service.listApprovedUniversites(limit, offset);
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
exports.UniversitesController = UniversitesController;
