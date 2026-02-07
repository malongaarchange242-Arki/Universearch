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
} from './universites.schema';

export const universitesRoutes = async (
  app: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> => {
  const service = new UniversitesService(supabaseAdmin);
  const controller = new UniversitesController(service);

  // Routes publiques (sans authentification)
  app.get(
    '/',
    { schema: listUniversitesSchema },
    (req, reply) => controller.listApprovedUniversites(req, reply)
  );

  app.get(
    '/:id',
    { schema: getUniversiteByIdSchema },
    (req, reply) => controller.getUniversiteById(req, reply)
  );

  // Routes protégées (authentification + autorisation UNIVERSITE + vérification APPROVED)
  await app.register(
    async function (fastify) {
      fastify.addHook('preHandler', authenticate);
      fastify.addHook('preHandler', authorize(['universite']));

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
    }
  );
};
