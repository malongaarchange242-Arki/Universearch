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

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { UniversitesController } from './universites.controller';
import { UniversitesService } from './universites.service';
import { supabaseAdmin } from '../../plugins/supabase';
import { authenticate, authorize } from '../../middleware';
import {
  getMyUniversiteSchema,
  updateMyUniversiteSchema,
  getUniversiteByIdSchema,
  listUniversitesSchema,
  attachFilieresSchema,
} from './universites.schema';
import { FraisScolariteController } from '../frais-scolarite/frais-scolarite.controller';
import { FraisScolariteService } from '../frais-scolarite/frais-scolarite.service';
import {
  createFraisSchema,
  listFraisSchema,
  getFraisByIdSchema,
} from '../frais-scolarite/frais-scolarite.schema';

export const universitesRoutes = async (
  app: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> => {
  const service = new UniversitesService(supabaseAdmin);
  const controller = new UniversitesController(service);
  
  const fraisService = new FraisScolariteService(supabaseAdmin);
  const fraisController = new FraisScolariteController(fraisService);

  // Routes protégées (authentification + autorisation UNIVERSITE + vérification APPROVED)
  // IMPORTANT: Placer AVANT les routes avec :id pour éviter que :id capture 'me'
  await app.register(
    async function (fastify) {
      fastify.addHook('preHandler', authenticate);
      fastify.addHook('preHandler', authorize(['universite', 'admin']));

      fastify.get(
        '/me',
        { schema: getMyUniversiteSchema },
        (req, reply) => controller.getMyUniversite(req, reply)
      );

      fastify.put(
        '/me',
        { schema: updateMyUniversiteSchema },
        (req, reply) => controller.updateMyUniversite(req, reply)
      );

      // Attach multiple filières to my université
      fastify.post('/me/filieres', { schema: attachFilieresSchema as any }, (req, reply) => controller.attachFilieresToMyUniversite(req, reply));

      // Upload logo for my université
      fastify.post('/me/logo', (req, reply) => controller.uploadMyLogo(req, reply));

      // ============================================
      // FRAIS DE SCOLARITÉ ROUTES (Protected)
      // ============================================
      
      /**
       * GET /universites/me/frais-scolarite
       * List all tuition fees for authenticated university
       */
      fastify.get(
        '/me/frais-scolarite',
        { schema: listFraisSchema },
        (req, reply) => fraisController.getFraisForMyUniversite(req, reply)
      );

      /**
       * POST /universites/me/frais-scolarite
       * Create or update tuition fees (upsert operation)
       */
      fastify.post(
        '/me/frais-scolarite',
        { schema: createFraisSchema },
        (req, reply) => fraisController.createOrUpdateFraisForMyUniversite(req, reply)
      );

      /**
       * GET /universites/me/frais-scolarite/stats
       * Get statistics about fees (must be before :id route)
       */
      fastify.get(
        '/me/frais-scolarite/stats',
        (req, reply) => fraisController.getFraisStatistics(req, reply)
      );

      /**
       * GET /universites/me/frais-scolarite/:id
       * Get a specific frais entry by ID
       */
      fastify.get(
        '/me/frais-scolarite/:id',
        { schema: getFraisByIdSchema },
        (req, reply) => fraisController.getFraisById(req, reply)
      );

      /**
       * PUT /universites/me/frais-scolarite/:id
       * Update a specific frais entry
       */
      fastify.put(
        '/me/frais-scolarite/:id',
        (req, reply) => fraisController.updateFraisById(req, reply)
      );

      /**
       * DELETE /universites/me/frais-scolarite/:id
       * Delete a specific frais entry
       */
      fastify.delete(
        '/me/frais-scolarite/:id',
        (req, reply) => fraisController.deleteFraisById(req, reply)
      );
    }
  );

  // Routes publiques (sans authentification) - placées APRÈS les routes /me
  app.post('/', (req, reply) => controller.createUniversite(req, reply));

  app.get(
    '/',
    { schema: listUniversitesSchema },
    (req, reply) => controller.listApprovedUniversites(req, reply)
  );

  /**
   * GET /universites/:id/frais-scolarite
   * Get public frais for a specific university (public route)
   */
  app.get(
    '/:id/frais-scolarite',
    async (req: any, reply) => {
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
      } catch (err) {
        req.log.error(err);
        reply.status(500).send({
          error: (err as Error).message,
        });
      }
    }
  );

  app.get(
    '/:id',
    { schema: getUniversiteByIdSchema },
    (req, reply) => controller.getUniversiteById(req, reply)
  );
};
