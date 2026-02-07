"use strict";
/**
 * Service métier pour la gestion des centres de formation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CentresService = void 0;
class CentresService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    /**
     * Récupérer mon centre (par profile_id de l'utilisateur connecté)
     */
    async getMyCentre(userId) {
        const { data, error } = await this.supabase
            .from('centres_formation')
            .select('*')
            .eq('profile_id', userId)
            .single();
        if (error && error.code !== 'PGRST116') {
            // PGRST116 = not found
            throw new Error(`Failed to get my centre: ${error.message}`);
        }
        return data || null;
    }
    /**
     * Mettre à jour mon centre
     */
    async updateMyCentre(userId, payload) {
        // Interdire la modification du statut via cette route
        const { statut, profile_id, id, date_creation, ...updateData } = payload;
        const { data, error } = await this.supabase
            .from('centres_formation')
            .update({
            ...updateData,
            updated_at: new Date().toISOString(),
        })
            .eq('profile_id', userId)
            .select('*')
            .single();
        if (error) {
            throw new Error(`Failed to update my centre: ${error.message}`);
        }
        if (!data) {
            throw new Error('Centre not found');
        }
        return data;
    }
    /**
     * Récupérer un centre par ID (info publiques, seulement si APPROVED)
     */
    async getCentreById(id) {
        const { data, error } = await this.supabase
            .from('centres_formation')
            .select('*')
            .eq('id', id)
            .eq('statut', 'APPROVED') // Seulement les approuvés
            .single();
        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to get centre: ${error.message}`);
        }
        return data || null;
    }
    /**
     * Lister tous les centres approuvés
     */
    async listApprovedCentres(limit = 20, offset = 0) {
        const { data, error } = await this.supabase
            .from('centres_formation')
            .select('*')
            .eq('statut', 'APPROVED')
            .order('date_creation', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error) {
            throw new Error(`Failed to list centres: ${error.message}`);
        }
        return data || [];
    }
}
exports.CentresService = CentresService;
