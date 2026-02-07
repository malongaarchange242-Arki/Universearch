/**
 * Controllers pour la gestion des universités.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { UniversitesService } from './universites.service';

export class UniversitesController {
  constructor(private service: UniversitesService) {}

  /**
   * GET /universites/me
   * Récupérer mes infos université
   */
  async getMyUniversite(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (req.user as any).id;

      const universite = await this.service.getMyUniversite(userId);

      if (!universite) {
        return reply.status(404).send({
          error: 'Université not found for your account',
        });
      }

      reply.status(200).send(universite);
    } catch (err) {
      req.log.error(err);
      reply.status(500).send({
        error: (err as Error).message,
      });
    }
  }

  /**
   * PUT /universites/me
   * Mettre à jour mes infos université
   */
  async updateMyUniversite(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (req.user as any).id;
      const payload = req.body as any;

      const result = await this.service.updateMyUniversite(userId, payload);

      reply.status(200).send({
        message: 'Université updated successfully',
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
   * GET /universites/:id
   * Récupérer les infos publiques d'une université (approuvée)
   */
  async getUniversiteById(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };

      const universite = await this.service.getUniversiteById(id);

      if (!universite) {
        return reply.status(404).send({
          error: 'Université not found',
        });
      }

      reply.status(200).send(universite);
    } catch (err) {
      req.log.error(err);
      reply.status(500).send({
        error: (err as Error).message,
      });
    }
  }

  /**
   * GET /universites
   * Lister toutes les universités approuvées
   */
  async listApprovedUniversites(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { limit = 20, offset = 0 } = req.query as {
        limit?: number;
        offset?: number;
      };

      const data = await this.service.listApprovedUniversites(limit, offset);

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
