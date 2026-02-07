/**
 * Schémas de validation pour les opérations sur les centres de formation.
 */

export const getMyCentreSchema = {
  tags: ['Centres'],
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        nom: { type: 'string' },
        description: { type: 'string' },
        email: { type: 'string' },
        statut: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
        logo_url: { type: 'string' },
        couverture_logo_url: { type: 'string' },
        lien_site: { type: 'string' },
        domaine: { type: 'string' },
        video_url: { type: 'string' },
      },
    },
  },
};

export const updateMyCentreSchema = {
  tags: ['Centres'],
  body: {
    type: 'object',
    properties: {
      nom: { type: 'string' },
      description: { type: 'string' },
      email: { type: 'string' },
      logo_url: { type: 'string' },
      couverture_logo_url: { type: 'string' },
      lien_site: { type: 'string' },
      domaine: { type: 'string' },
      video_url: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        nom: { type: 'string' },
        updated_at: { type: 'string' },
      },
    },
  },
};

export const getCentreByIdSchema = {
  tags: ['Centres'],
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
    },
  },
};

export const listCentresSchema = {
  tags: ['Centres'],
  querystring: {
    type: 'object',
    properties: {
      limit: { type: 'integer', default: 20 },
      offset: { type: 'integer', default: 0 },
    },
  },
  response: {
    200: {
      type: 'array',
      items: { type: 'object' },
    },
  },
};
