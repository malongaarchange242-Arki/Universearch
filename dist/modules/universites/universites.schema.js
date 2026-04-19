"use strict";
/**
 * Schémas de validation pour les opérations sur les universités.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachFilieresSchema = exports.listUniversitesSchema = exports.getUniversiteByIdSchema = exports.updateMyUniversiteSchema = exports.getMyUniversiteSchema = void 0;
// 🔹 Propriétés communes d'une université publique
const universitePublicProperties = {
    id: { type: 'string' },
    profile_id: { type: 'string' },
    nom: { type: 'string' },
    sigle: { type: 'string' },
    annee_fondation: { type: 'integer' },
    description: { type: 'string' },
    contacts: { type: 'string' },
    email: { type: 'string' },
    statut: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] },
    logo_url: { type: 'string' },
    couverture_logo_url: { type: 'string' },
    lien_site: { type: 'string' },
    domaine: { type: 'string' },
    video_url: { type: 'string' },
    date_creation: { type: 'string' },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    domaines: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                nom: { type: 'string' },
                filieres: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            nom: { type: 'string' }
                        }
                    }
                }
            }
        }
    },
};
exports.getMyUniversiteSchema = {
    tags: ['Universités'],
    response: {
        200: {
            type: 'object',
            properties: universitePublicProperties,
            additionalProperties: false,
        },
    },
};
exports.updateMyUniversiteSchema = {
    tags: ['Universités'],
    body: {
        type: 'object',
        properties: {
            nom: { type: 'string' },
            sigle: { type: 'string' },
            annee_fondation: { type: 'integer' },
            description: { type: 'string' }, contacts: { type: 'string' }, email: { type: 'string' },
            logo_url: { type: 'string' },
            couverture_logo_url: { type: 'string' },
            lien_site: { type: 'string' },
            domaine: { type: 'string' },
            video_url: { type: 'string' },
            // Accept selectedFilieres if provided (for backward compatibility)
            selectedFilieres: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
    },
    response: {
        200: {
            type: 'object',
            properties: universitePublicProperties,
            additionalProperties: false,
        },
    },
};
exports.getUniversiteByIdSchema = {
    tags: ['Universités'],
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', format: 'uuid' },
        },
    },
    response: {
        200: {
            type: 'object',
            properties: universitePublicProperties,
            additionalProperties: false,
        },
    },
};
exports.listUniversitesSchema = {
    tags: ['Universités'],
    querystring: {
        type: 'object',
        properties: {
            limit: { type: 'integer', default: 20 },
            offset: { type: 'integer', default: 0 },
        },
        additionalProperties: false,
    },
    response: {
        200: {
            type: 'array',
            items: {
                type: 'object',
                properties: universitePublicProperties,
                additionalProperties: false,
            },
        },
    },
};
exports.attachFilieresSchema = {
    tags: ['Universités'],
    body: {
        type: 'object',
        properties: {
            // Accept both UUIDs and slugs (e.g., "genie-informatique")
            filiereIds: { type: 'array', items: { type: 'string' } }
        },
        required: ['filiereIds'],
        additionalProperties: false,
    },
    response: {
        200: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                data: {
                    type: 'object',
                    properties: {
                        inserted: { type: 'integer' },
                        skipped: { type: 'array', items: { type: 'string' } }
                    }
                }
            }
        }
    }
};
