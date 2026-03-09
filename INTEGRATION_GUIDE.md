/**
 * INTEGRATION GUIDE: BDE & Representants Modules
 * 
 * Add this code to your src/app.ts file
 */

// --- At the top of app.ts, add imports ---
import { registerBdeRoutes } from './modules/bde/bde.routes';
import { registerRepresentantRoutes } from './modules/representants/representants.routes';

// --- In the register function, after your other route registrations ---
export async function register(fastify: FastifyInstance, opts: any) {
  // ... existing routes ...

  // Register BDE routes
  await registerBdeRoutes(fastify, supabaseClient);

  // Register Representant routes
  await registerRepresentantRoutes(fastify, supabaseClient);

  // ... other routes ...
}

// ============================================================================
// ENDPOINT EXAMPLES
// ============================================================================

/**
 * 1. CREATE BDE (University only)
 * POST /universites/bde
 * 
 * Headers:
 *   Authorization: Bearer <jwt_token>
 *   Content-Type: application/json
 * 
 * Body:
 * {
 *   "nom": "Bureau des Étudiants ECES",
 *   "description": "Bureau représentant les étudiants de l'ECES",
 *   "logo_url": "https://example.com/logo.png",
 *   "video_url": "https://example.com/video.mp4",
 *   "universite_id": "550e8400-e29b-41d4-a716-446655440000"
 * }
 * 
 * Response: 201
 * {
 *   "success": true,
 *   "data": {
 *     "id": "660e8400-e29b-41d4-a716-446655440001",
 *     "universite_id": "550e8400-e29b-41d4-a716-446655440000",
 *     "profile_id": "550e8400-e29b-41d4-a716-446655440000",
 *     "nom": "Bureau des Étudiants ECES",
 *     "description": "Bureau représentant les étudiants de l'ECES",
 *     "logo_url": "https://example.com/logo.png",
 *     "video_url": "https://example.com/video.mp4",
 *     "statut": "actif",
 *     "date_creation": "2026-02-23T10:00:00.000Z"
 *   }
 * }
 */

/**
 * 2. GET BDE BY UNIVERSITY
 * GET /universites/{universite_id}/bde
 * 
 * Response: 200
 * {
 *   "success": true,
 *   "data": {
 *     "id": "660e8400-e29b-41d4-a716-446655440001",
 *     "universite_id": "550e8400-e29b-41d4-a716-446655440000",
 *     ...
 *   }
 * }
 */

/**
 * 3. UPDATE BDE
 * PUT /bde/{bde_id}
 * 
 * Headers:
 *   Authorization: Bearer <jwt_token>
 *   Content-Type: application/json
 * 
 * Body:
 * {
 *   "nom": "New BDE Name",
 *   "statut": "actif"
 * }
 */

/**
 * 4. DELETE BDE
 * DELETE /bde/{bde_id}
 * 
 * Headers:
 *   Authorization: Bearer <jwt_token>
 */

/**
 * 5. CREATE REPRESENTANT (Centre only)
 * POST /centres/representants
 * 
 * Headers:
 *   Authorization: Bearer <jwt_token>
 *   Content-Type: application/json
 * 
 * Body:
 * {
 *   "fonction": "Directeur",
 *   "centre_id": "770e8400-e29b-41d4-a716-446655440002"
 * }
 * 
 * Response: 201
 * {
 *   "success": true,
 *   "data": {
 *     "id": "880e8400-e29b-41d4-a716-446655440003",
 *     "centre_id": "770e8400-e29b-41d4-a716-446655440002",
 *     "profile_id": "770e8400-e29b-41d4-a716-446655440002",
 *     "fonction": "Directeur",
 *     "statut": "actif",
 *     "date_creation": "2026-02-23T10:00:00.000Z"
 *   }
 * }
 */

/**
 * 6. GET ALL REPRESENTANTS FOR CENTRE
 * GET /centres/{centre_id}/representants
 * 
 * Response: 200
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "880e8400-e29b-41d4-a716-446655440003",
 *       "fonction": "Directeur",
 *       ...
 *     },
 *     {
 *       "id": "990e8400-e29b-41d4-a716-446655440004",
 *       "fonction": "Manager",
 *       ...
 *     }
 *   ]
 * }
 */

/**
 * 7. UPDATE REPRESENTANT
 * PUT /representants/{representant_id}
 * 
 * Headers:
 *   Authorization: Bearer <jwt_token>
 *   Content-Type: application/json
 * 
 * Body:
 * {
 *   "fonction": "Directeur Général"
 * }
 */

/**
 * 8. DELETE REPRESENTANT
 * DELETE /representants/{representant_id}
 * 
 * Headers:
 *   Authorization: Bearer <jwt_token>
 */

// ============================================================================
// AUTHORIZATION RULES (Built-in to controllers)
// ============================================================================

/**
 * BDE Rules:
 * - Only users with profile_type = 'universite' can CREATE BDE
 * - A university can have only ONE active BDE
 * - Only the university that created the BDE can UPDATE/DELETE it
 * 
 * Representant Rules:
 * - Only users with profile_type = 'centre' or 'centre_formation' can CREATE
 * - A centre can have MULTIPLE representants
 * - Only the centre that created the representant can UPDATE/DELETE it
 * 
 * All endpoints (except GET) require authentication via JWT token
 */

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * 403 Forbidden Examples:
 * 
 * - Non-university user tries to create BDE:
 *   {
 *     "success": false,
 *     "error": "Only universities can create a BDE"
 *   }
 * 
 * - Non-centre user tries to create representant:
 *   {
 *     "success": false,
 *     "error": "Only centres de formation can create representants"
 *   }
 * 
 * - User tries to update BDE they don't own:
 *   {
 *     "success": false,
 *     "error": "You do not have permission to update this BDE"
 *   }
 */
