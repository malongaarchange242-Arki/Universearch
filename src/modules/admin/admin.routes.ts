/**
 * Routes d'administration.
 *
 * 🛡 SÉCURISATION STRICTE:
 * - Authentification requise (Bearer token)
 * - Autorisation requise: rôle ADMIN ou centre_formation
 * - Seuls les admins peuvent accéder à ces routes
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { supabaseAdmin } from '../../plugins/supabase';
import { authenticate, authorize } from '../../middleware';
import {
  updateUniversiteStatusSchema,
  approveUniversiteSchema,
  rejectUniversiteSchema,
  listPendingUniversitesSchema,
  updateCentreStatusSchema,
  approveCentreSchema,
  rejectCentreSchema,
  listPendingCentresSchema,
} from './admin.schema';

export const adminRoutes = async (
  app: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> => {
  const service = new AdminService(supabaseAdmin);
  const controller = new AdminController(service);

  // 🛡 Tous les routes admin sont protégées
  // Enregistrer un sous-groupe de routes avec middleware de sécurité global
  await app.register(
    async function (fastify) {
      // Authentification: tous les utilisateurs doivent avoir un token valide
      fastify.addHook('preHandler', authenticate);

      // Autorisation: seuls les rôles 'admin' et 'superviseur' peuvent accéder
      fastify.addHook(
        'preHandler',
        authorize(['admin', 'superviseur'])
      );

      /**
       * ========== UNIVERSITÉS ==========
       */

      // Changer le statut d'une université
      fastify.patch(
        '/universites/:id/status',
        { schema: updateUniversiteStatusSchema },
        (req, reply) => controller.updateUniversiteStatus(req, reply)
      );

      // Approuver une université
      fastify.patch(
        '/universites/:id/approve',
        { schema: approveUniversiteSchema },
        (req, reply) => controller.approveUniversite(req, reply)
      );

      // Rejeter une université
      fastify.patch(
        '/universites/:id/reject',
        { schema: rejectUniversiteSchema },
        (req, reply) => controller.rejectUniversite(req, reply)
      );

      // Lister les universités en attente
      fastify.get(
        '/universites/pending',
        { schema: listPendingUniversitesSchema },
        (req, reply) => controller.listPendingUniversites(req, reply)
      );

      /**
       * ========== CENTRES DE FORMATION ==========
       */

      // Changer le statut d'un centre
      fastify.patch(
        '/centres/:id/status',
        { schema: updateCentreStatusSchema },
        (req, reply) => controller.updateCentreStatus(req, reply)
      );

      // Approuver un centre
      fastify.patch(
        '/centres/:id/approve',
        { schema: approveCentreSchema },
        (req, reply) => controller.approveCentre(req, reply)
      );

      // Rejeter un centre
      fastify.patch(
        '/centres/:id/reject',
        { schema: rejectCentreSchema },
        (req, reply) => controller.rejectCentre(req, reply)
      );

      // Lister les centres en attente
      fastify.get(
        '/centres/pending',
        { schema: listPendingCentresSchema },
        (req, reply) => controller.listPendingCentres(req, reply)
      );
    }
  );
};
