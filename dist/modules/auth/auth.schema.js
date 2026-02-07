"use strict";
/**
 * Auth schemas
 * src/modules/auth/auth.schema.ts
 *
 * Définit les schémas de validation pour l'authentification.
 * Aucun traitement métier ici.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
exports.registerSchema = {
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
                description: 'Adresse email de l\'utilisateur'
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
exports.loginSchema = {
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
