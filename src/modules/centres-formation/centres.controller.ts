/**
 * Controllers pour la gestion des centres de formation.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { CentresService } from './centres.service';

export class CentresController {
  constructor(private service: CentresService) {}

  /**
   * GET /centres/me
   * Récupérer mes infos centre
   */
  async getMyCentre(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (req.user as any).id;

      const centre = await this.service.getMyCentre(userId);

      if (!centre) {
        return reply.status(404).send({
          error: 'Centre not found for your account',
        });
      }

      reply.status(200).send(centre);
    } catch (err) {
      req.log.error(err);
      reply.status(500).send({
        error: (err as Error).message,
      });
    }
  }

  /**
   * PUT /centres/me
   * Mettre à jour mes infos centre
   */
  async updateMyCentre(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (req.user as any).id;
      const payload = req.body as any;

      const result = await this.service.updateMyCentre(userId, payload);

      reply.status(200).send({
        message: 'Centre updated successfully',
        data: result,
      });
    } catch (err) {
      req.log.error(err);
      reply.status(400).send({
        error: (err as Error).message,
      });
    }
  }

  /**
   * GET /centres/:id
   * Récupérer les infos publiques d'un centre (approuvé)
   */
  async getCentreById(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };

      const centre = await this.service.getCentreById(id);

      if (!centre) {
        return reply.status(404).send({
          error: 'Centre not found',
        });
      }

      reply.status(200).send(centre);
    } catch (err) {
      req.log.error(err);
      reply.status(500).send({
        error: (err as Error).message,
      });
    }
  }

  /**
   * GET /centres
   * Lister tous les centres approuvés
   */
  async listApprovedCentres(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { limit = 20, offset = 0 } = req.query as {
        limit?: number;
        offset?: number;
      };

      const data = await this.service.listApprovedCentres(limit, offset);

      reply.status(200).send({
        count: data.length,
        data,
      });
    } catch (err) {
      req.log.error(err);
      reply.status(500).send({
        error: (err as Error).message,
      });
    }
  }
}
