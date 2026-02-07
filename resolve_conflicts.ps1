# Resolve merge conflicts in auth.routes.ts and auth.schema.ts

# Fix auth.routes.ts
$routesFile = "src/modules/auth/auth.routes.ts"
$routesContent = @"
/**
 * Auth routes
 * src/modules/auth/auth.routes.ts
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { registerHandler, loginHandler, logoutHandler } from './auth.controller';
import { registerSchema, loginSchema } from './auth.schema';
import { authenticate } from '../../middleware';

export const authRoutes = async (
  app: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> => {
  // Création compte
  app.post('/register', { schema: registerSchema }, registerHandler);

  // Connexion
  app.post('/login', { schema: loginSchema }, loginHandler);

  // Déconnexion (protégée)
  app.post('/logout', { preHandler: [authenticate] }, logoutHandler);
};
"@
$routesContent | Set-Content $routesFile

# Fix auth.schema.ts
$schemaFile = "src/modules/auth/auth.schema.ts"
$schemaContent = @"
/**
 * Auth schemas
 * src/modules/auth/auth.schema.ts
 *
 * Définit les schémas de validation pour l'authentification.
 * Aucun traitement métier ici.
 */

export const registerSchema = {
  body: {
    type: 'object',
    required: [
      'email',
      'password',
      'nom',
      'telephone',
      'profileType'
    ],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'Adresse email de l''utilisateur'
      },
      password: {
        type: 'string',
        minLength: 8,
        description: 'Mot de passe utilisateur'
      },
      nom: {
        type: 'string',
        minLength: 2,
        maxLength: 100
      },
      prenom: {
        type: ['string', 'null'],
        nullable: true,
        minLength: 2,
        maxLength: 100,
        description: 'Optionnel - requis pour utilisateur, null pour organisations'
      },
      telephone: {
        type: 'string',
        minLength: 6,
        maxLength: 20
      },
      profileType: {
        type: 'string',
        enum: [
          'utilisateur',
          'admin',
          'superviseur',
          'universite',
          'bde',
          'centre_formation'
        ]
      },
      userType: {
        type: 'string',
        enum: ['bachelier', 'etudiant', 'parent'],
        description: 'Obligatoire si profileType = utilisateur'
      },
      dateNaissance: {
        type: 'string',
        format: 'date'
      },
      genre: {
        type: 'string',
        enum: ['homme', 'femme', 'autre']
      }
    },
    allOf: [
      {
        if: {
          properties: { profileType: { const: 'utilisateur' } }
        },
        then: {
          required: ['userType']
        }
      }
    ]
  }
};

export const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email'
      },
      password: {
        type: 'string',
        minLength: 8
      }
    }
  }
};
"@
$schemaContent | Set-Content $schemaFile

Write-Host "Conflicts resolved in both files"
