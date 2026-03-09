import { FastifySchema } from 'fastify';

export const RepresentantSchemas = {

  createRepresentant: {
    description: 'Create a new representant for a centre de formation',
    tags: ['Representants'],
    body: {
      type: 'object',
      required: ['fonction', 'centre_id'],
      properties: {
        fonction: {
          type: 'string',
          minLength: 1,
          maxLength: 255,
        },
        centre_id: {
          type: 'string',
          format: 'uuid',
        },
      },
    },
    response: {
      201: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              centre_id: { type: 'string', format: 'uuid' },
              profile_id: { type: 'string', format: 'uuid' },
              fonction: { type: 'string' },
              statut: { type: 'string', enum: ['actif', 'inactif', 'suspendu'] },
              date_creation: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      400: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
      401: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
      403: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  } as FastifySchema,

  getRepresentantById: {
    description: 'Get representant by ID',
    tags: ['Representants'],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
        },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object' },
        },
      },
      404: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  } as FastifySchema,

  getCentreRepresentants: {
    description: 'Get all representants for a centre de formation',
    tags: ['Representants'],
    params: {
      type: 'object',
      required: ['centre_id'],
      properties: {
        centre_id: {
          type: 'string',
          format: 'uuid',
        },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'array',
            items: { type: 'object' },
          },
        },
      },
      404: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  } as FastifySchema,

  updateRepresentant: {
    description: 'Update representant information',
    tags: ['Representants'],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
        },
      },
    },
    body: {
      type: 'object',
      properties: {
        fonction: { type: 'string', maxLength: 255 },
        statut: { type: 'string', enum: ['actif', 'inactif', 'suspendu'] },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
        },
      },
      404: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  } as FastifySchema,

  deleteRepresentant: {
    description: 'Delete a representant',
    tags: ['Representants'],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
        },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
        },
      },
      404: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  } as FastifySchema,
};