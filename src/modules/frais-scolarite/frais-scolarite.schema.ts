/**
 * Schemas for Frais de Scolarité (Tuition Fees) validation
 * Using Zod for runtime type safety
 */

import { z } from 'zod';

// Valid levels and poles
const LEVELS = ['L1', 'L2', 'L3', 'Master'] as const;
const POLES = ['Commercial', 'Polytechnique', 'Droit'] as const;

// Single frais entry schema
export const FraisEntrySchema = z.object({
  level: z.enum(LEVELS, { description: 'Academic level' }),
  pole: z.enum(POLES, { description: 'Pole/Department name' }),
  monthly_price: z.number().nonnegative().default(0),
  yearly_price: z.number().nonnegative().default(0),
});

// Request body for creating/updating frais
export const CreateFraisRequestSchema = z.object({
  records: z.array(FraisEntrySchema).min(1, 'At least one fee record is required'),
});

// Request body for bulk update
export const BulkUpdateFraisSchema = z.object({
  records: z.array(
    z.object({
      level: z.enum(LEVELS),
      pole: z.enum(POLES),
      monthly_price: z.number().nonnegative(),
      yearly_price: z.number().nonnegative(),
    })
  ),
});

// Response schema for frais entry
export const FraisResponseSchema = z.object({
  id: z.string().uuid(),
  universite_id: z.string().uuid(),
  level: z.enum(LEVELS),
  pole: z.enum(POLES),
  monthly_price: z.number(),
  yearly_price: z.number(),
  currency: z.string().default('XAF'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Response schema for list of frais
export const ListFraisResponseSchema = z.array(FraisResponseSchema);

// Query schema for listing fees with filters
export const ListFraisQuerySchema = z.object({
  level: z.enum(LEVELS).optional(),
  pole: z.enum(POLES).optional(),
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
});

// Type exports for TypeScript usage
export type FraisEntry = z.infer<typeof FraisEntrySchema>;
export type CreateFraisRequest = z.infer<typeof CreateFraisRequestSchema>;
export type BulkUpdateFrais = z.infer<typeof BulkUpdateFraisSchema>;
export type FraisResponse = z.infer<typeof FraisResponseSchema>;
export type ListFraisQuery = z.infer<typeof ListFraisQuerySchema>;

// Fastify schema definitions for OpenAPI documentation
export const listFraisSchema = {
  tags: ['Frais de Scolarité'],
  summary: 'List tuition fees for authenticated university',
  querystring: ListFraisQuerySchema,
  response: {
    200: {
      description: 'List of tuition fees',
      type: 'array',
      items: FraisResponseSchema,
    },
    404: {
      description: 'University not found',
    },
    401: {
      description: 'Unauthorized',
    },
  },
};

export const createFraisSchema = {
  tags: ['Frais de Scolarité'],
  summary: 'Create or update tuition fees for authenticated university',
  body: CreateFraisRequestSchema,
  response: {
    200: {
      description: 'Fees saved successfully',
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: { type: 'array', items: FraisResponseSchema },
      },
    },
    400: {
      description: 'Validation error',
    },
    401: {
      description: 'Unauthorized',
    },
  },
};

export const getFraisByIdSchema = {
  tags: ['Frais de Scolarité'],
  summary: 'Get specific tuition fee entry',
  params: z.object({
    id: z.string().uuid(),
  }),
  response: {
    200: {
      description: 'Fee entry',
      type: 'object',
      properties: FraisResponseSchema.shape,
    },
    404: {
      description: 'Fee entry not found',
    },
  },
};
