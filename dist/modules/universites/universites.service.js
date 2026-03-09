"use strict";
/**
 * Service métier pour la gestion des universités.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversitesService = void 0;
const crypto_1 = require("crypto");
class UniversitesService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    /**
     * Create a new université (and profile record)
     */
    async createUniversite(payload) {
        const profileId = (0, crypto_1.randomUUID)();
        const uniId = (0, crypto_1.randomUUID)();
        // Insert profile
        const { error: profileError } = await this.supabase
            .from('profiles')
            .insert({
            id: profileId,
            nom: payload.nom ?? null,
            email: payload.email ?? null,
            telephone: payload.telephone ?? null,
            profile_type: 'universite',
            created_at: new Date().toISOString(),
        });
        if (profileError) {
            throw new Error(`Failed to create profile: ${profileError.message}`);
        }
        const { data, error } = await this.supabase
            .from('universites')
            .insert({
            id: uniId,
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
            throw new Error(`Failed to create université: ${error.message}`);
        }
        return data;
    }
    /**
     * Récupérer mon université (par profile_id de l'utilisateur connecté)
     */
    async getMyUniversite(userId) {
        const { data, error } = await this.supabase
            .from('universites')
            .select('*')
            .eq('profile_id', userId)
            .single();
        if (error && error.code !== 'PGRST116') {
            // PGRST116 = not found
            throw new Error(`Failed to get my université: ${error.message}`);
        }
        return data || null;
    }
    /**
     * Mettre à jour mon université
     */
    async updateMyUniversite(userId, payload) {
        // Interdire la modification du statut via cette route
        const { statut, profile_id, id, date_creation, ...updateData } = payload;
        const { data, error } = await this.supabase
            .from('universites')
            .update({
            ...updateData,
            updated_at: new Date().toISOString(),
        })
            .eq('profile_id', userId)
            .select('*')
            .single();
        if (error) {
            throw new Error(`Failed to update my université: ${error.message}`);
        }
        if (!data) {
            throw new Error('Université not found');
        }
        return data;
    }
    /**
     * Récupérer une université par ID (info publiques, seulement si APPROVED)
     */
    async getUniversiteById(id) {
        const { data, error } = await this.supabase
            .from('universites')
            .select('*')
            .eq('id', id)
            .eq('statut', 'APPROVED') // Seulement les approuvées
            .single();
        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to get université: ${error.message}`);
        }
        return data || null;
    }
    /**
     * Lister toutes les universités approuvées
     */
    async listApprovedUniversites(limit = 20, offset = 0) {
        const { data, error } = await this.supabase
            .from('universites')
            .select('*')
            .eq('statut', 'APPROVED')
            .order('date_creation', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error) {
            throw new Error(`Failed to list universités: ${error.message}`);
        }
        return data || [];
    }
    /**
     * Upload a logo for the caller's université and persist the public URL.
     * Accepts a Buffer containing image data.
     */
    async uploadLogoForMyUniversite(userId, buffer, filename, contentType = 'image/png') {
        // find universite by profile_id
        const { data: uni, error: uniErr } = await this.supabase
            .from('universites')
            .select('id')
            .eq('profile_id', userId)
            .single();
        if (uniErr || !uni) {
            throw new Error('Université not found for your account');
        }
        const uniId = uni.id;
        const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `logos/${uniId}/${Date.now()}_${safeName}`;
        // upload to storage
        const { data: uploadData, error: uploadError } = await this.supabase.storage
            .from('logos')
            .upload(path, buffer, { contentType, upsert: false });
        if (uploadError) {
            throw new Error(`Logo upload failed: ${uploadError.message}`);
        }
        // get public url (support multiple supabase client return shapes)
        const getUrlResult = this.supabase.storage.from('logos').getPublicUrl(uploadData.path);
        const publicURL = getUrlResult?.publicURL ?? getUrlResult?.data?.publicUrl ?? getUrlResult?.data?.publicURL ?? null;
        // persist to universites
        const { error: updateErr } = await this.supabase
            .from('universites')
            .update({ logo_url: publicURL, updated_at: new Date().toISOString() })
            .eq('id', uniId);
        if (updateErr) {
            throw new Error(`Failed to update universite logo: ${updateErr.message}`);
        }
        return publicURL;
    }
}
exports.UniversitesService = UniversitesService;
