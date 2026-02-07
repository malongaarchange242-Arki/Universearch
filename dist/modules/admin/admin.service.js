"use strict";
/**
 * Service métier pour les opérations d'administration.
 * Gère l'approbation/rejet d'universités et centres de formation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
class AdminService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    /**
     * Approuver une université
     */
    async approveUniversite(id) {
        return this.updateUniversiteStatus(id, 'APPROVED');
    }
    /**
     * Rejeter une université
     */
    async rejectUniversite(id, raison) {
        return this.updateUniversiteStatus(id, 'REJECTED', raison);
    }
    /**
     * Changer le statut d'une université (générique)
     */
    async updateUniversiteStatus(id, statut, raison) {
        const updatePayload = {
            statut,
            updated_at: new Date().toISOString(),
        };
        if (raison) {
            updatePayload.rejection_reason = raison;
        }
        const { data, error } = await this.supabase
            .from('universites')
            .update(updatePayload)
            .eq('id', id)
            .select('*')
            .single();
        if (error) {
            throw new Error(`Failed to update université id=${id}: ${error.message}`);
        }
        if (!data) {
            throw new Error(`Université not found: ${id}`);
        }
        return data;
    }
    /**
     * Lister les universités en attente
     */
    async listPendingUniversites(limit = 20, offset = 0) {
        const { data, error } = await this.supabase
            .from('universites')
            .select('*')
            .eq('statut', 'PENDING')
            .order('date_creation', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error) {
            throw new Error(`Failed to list pending universités: ${error.message}`);
        }
        return data || [];
    }
    /**
     * Approuver un centre de formation
     */
    async approveCentre(id) {
        return this.updateCentreStatus(id, 'APPROVED');
    }
    /**
     * Rejeter un centre de formation
     */
    async rejectCentre(id, raison) {
        return this.updateCentreStatus(id, 'REJECTED', raison);
    }
    /**
     * Changer le statut d'un centre de formation (générique)
     */
    async updateCentreStatus(id, statut, raison) {
        const updatePayload = {
            statut,
            updated_at: new Date().toISOString(),
        };
        if (raison) {
            updatePayload.rejection_reason = raison;
        }
        const { data, error } = await this.supabase
            .from('centres_formation')
            .update(updatePayload)
            .eq('id', id)
            .select('*')
            .single();
        if (error) {
            throw new Error(`Failed to update centre id=${id}: ${error.message}`);
        }
        if (!data) {
            throw new Error(`Centre not found: ${id}`);
        }
        return data;
    }
    /**
     * Lister les centres en attente
     */
    async listPendingCentres(limit = 20, offset = 0) {
        const { data, error } = await this.supabase
            .from('centres_formation')
            .select('*')
            .eq('statut', 'PENDING')
            .order('date_creation', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error) {
            throw new Error(`Failed to list pending centres: ${error.message}`);
        }
        return data || [];
    }
}
exports.AdminService = AdminService;
