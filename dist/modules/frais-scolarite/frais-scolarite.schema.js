"use strict";
/**
 * Schemas for Frais de Scolarité (Tuition Fees) validation
 * Using Zod for runtime type safety
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFraisByIdSchema = exports.createFraisSchema = exports.listFraisSchema = exports.ListFraisQuerySchema = exports.ListFraisResponseSchema = exports.FraisResponseSchema = exports.BulkUpdateFraisSchema = exports.CreateFraisRequestSchema = exports.FraisEntrySchema = void 0;
const zod_1 = require("zod");
// Valid levels and poles
const LEVELS = ['L1', 'L2', 'L3', 'Master'];
const POLES = ['Commercial', 'Polytechnique', 'Droit'];
// Single frais entry schema
exports.FraisEntrySchema = zod_1.z.object({
    level: zod_1.z.enum(LEVELS, { description: 'Academic level' }),
    pole: zod_1.z.enum(POLES, { description: 'Pole/Department name' }),
    monthly_price: zod_1.z.number().nonnegative().default(0),
    yearly_price: zod_1.z.number().nonnegative().default(0),
});
// Request body for creating/updating frais
exports.CreateFraisRequestSchema = zod_1.z.object({
    records: zod_1.z.array(exports.FraisEntrySchema).min(1, 'At least one fee record is required'),
});
// Request body for bulk update
exports.BulkUpdateFraisSchema = zod_1.z.object({
    records: zod_1.z.array(zod_1.z.object({
        level: zod_1.z.enum(LEVELS),
        pole: zod_1.z.enum(POLES),
        monthly_price: zod_1.z.number().nonnegative(),
        yearly_price: zod_1.z.number().nonnegative(),
    })),
});
// Response schema for frais entry
exports.FraisResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    universite_id: zod_1.z.string().uuid(),
    level: zod_1.z.enum(LEVELS),
    pole: zod_1.z.enum(POLES),
    monthly_price: zod_1.z.number(),
    yearly_price: zod_1.z.number(),
    currency: zod_1.z.string().default('XAF'),
    created_at: zod_1.z.string().datetime(),
    updated_at: zod_1.z.string().datetime(),
});
// Response schema for list of frais
exports.ListFraisResponseSchema = zod_1.z.array(exports.FraisResponseSchema);
// Query schema for listing fees with filters
exports.ListFraisQuerySchema = zod_1.z.object({
    level: zod_1.z.enum(LEVELS).optional(),
    pole: zod_1.z.enum(POLES).optional(),
    page: zod_1.z.coerce.number().positive().default(1),
    limit: zod_1.z.coerce.number().positive().max(100).default(20),
});
// Fastify schema definitions for OpenAPI documentation
exports.listFraisSchema = {
    tags: ['Frais de Scolarité'],
    summary: 'List tuition fees for authenticated university',
    querystring: exports.ListFraisQuerySchema,
    response: {
        200: {
            description: 'List of tuition fees',
            type: 'array',
            items: exports.FraisResponseSchema,
        },
        404: {
            description: 'University not found',
        },
        401: {
            description: 'Unauthorized',
        },
    },
};
exports.createFraisSchema = {
    tags: ['Frais de Scolarité'],
    summary: 'Create or update tuition fees for authenticated university',
    body: exports.CreateFraisRequestSchema,
    response: {
        200: {
            description: 'Fees saved successfully',
            type: 'object',
            properties: {
                message: { type: 'string' },
                data: { type: 'array', items: exports.FraisResponseSchema },
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
exports.getFraisByIdSchema = {
    tags: ['Frais de Scolarité'],
    summary: 'Get specific tuition fee entry',
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
    response: {
        200: {
            description: 'Fee entry',
            type: 'object',
            properties: exports.FraisResponseSchema.shape,
        },
        404: {
            description: 'Fee entry not found',
        },
    },
};
