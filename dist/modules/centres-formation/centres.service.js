"use strict";
/**
 * Service métier pour la gestion des centres de formation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CentresService = void 0;
const crypto_1 = require("crypto");
class CentresService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    /**
     * Create a new centre de formation (and profile record)
     */
    async createCentre(payload) {
        const profileId = (0, crypto_1.randomUUID)();
        const centreId = (0, crypto_1.randomUUID)();
        // Insert profile
        const { error: profileError } = await this.supabase
            .from('profiles')
            .insert({
            id: profileId,
            nom: payload.nom ?? null,
            email: payload.email ?? null,
            telephone: payload.telephone ?? null,
            profile_type: 'centre_formation',
            created_at: new Date().toISOString(),
        });
        if (profileError) {
            throw new Error(`Failed to create profile: ${profileError.message}`);
        }
        const { data, error } = await this.supabase
            .from('centres_formation')
            .insert({
            id: centreId,
            profile_id: profileId,
            nom: payload.nom ?? null,
            description: payload.description ?? null,
            email: payload.email ?? null,
            statut: payload.statut ?? 'PENDING',
            logo_url: payload.logo_url ?? null,
            couverture_logo_url: payload.couverture_logo_url ?? null,
            lien_site: payload.lien_site ?? null,
            domaine: payload.domaine ?? null,
            video_url: payload.video_url ?? null,
            date_creation: new Date().toISOString(),
        })
            .select('*')
            .single();
        if (error) {
            // rollback profile
            await this.supabase.from('profiles').delete().eq('id', profileId);
            throw new Error(`Failed to create centre: ${error.message}`);
        }
        return data;
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
    /**
     * Upload a logo for the caller's centre and persist the public URL.
     * Accepts a Buffer containing image data.
     */
    async uploadLogoForMyCentre(userId, buffer, filename, contentType = 'image/png') {
        // find centre by profile_id
        const { data: centre, error: centreErr } = await this.supabase
            .from('centres_formation')
            .select('id')
            .eq('profile_id', userId)
            .single();
        if (centreErr || !centre) {
            throw new Error('Centre not found for your account');
        }
        const centreId = centre.id;
        const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `logos/${centreId}/${Date.now()}_${safeName}`;
        // upload to storage
        const { data: uploadData, error: uploadError } = await this.supabase.storage
            .from('logos')
            .upload(path, buffer, { contentType, upsert: false });
        if (uploadError) {
            throw new Error(`Logo upload failed: ${uploadError.message}`);
        }
        // get public url
        const getUrlResult = this.supabase.storage.from('logos').getPublicUrl(uploadData.path);
        const publicURL = getUrlResult?.publicURL ?? getUrlResult?.data?.publicUrl ?? getUrlResult?.data?.publicURL ?? null;
        // persist to centres_formation
        const { error: updateErr } = await this.supabase
            .from('centres_formation')
            .update({ logo_url: publicURL, updated_at: new Date().toISOString() })
            .eq('id', centreId);
        if (updateErr) {
            throw new Error(`Failed to update centre logo: ${updateErr.message}`);
        }
        return publicURL;
    }
}
exports.CentresService = CentresService;
