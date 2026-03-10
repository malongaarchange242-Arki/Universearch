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
            contacts: payload.contacts ?? null,
            statut: payload.statut ?? 'PENDING',
            logo_url: payload.logo_url ?? null,
            couverture_logo_url: payload.couverture_logo_url ?? null,
            lien_site: payload.lien_site ?? null,
            video_url: payload.video_url ?? null,
            sigle: payload.sigle ?? null,
            annee_fondation: payload.annee_fondation ?? null,
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
            .select(`
        *,
        centre_formation_filieres (
          filieres_centre (
            id,
            nom,
            domaines_centre (
              id,
              nom
            )
          )
        )
      `)
            .eq('profile_id', userId)
            .single();
        if (error && error.code !== 'PGRST116') {
            // PGRST116 = not found
            throw new Error(`Failed to get my centre: ${error.message}`);
        }
        if (!data)
            return null;
        return this.processCentreWithDomaines(data);
    }
    /**
     * Process a centre record to add domaines and filieres
     */
    processCentreWithDomaines(centre) {
        const domaineMap = new Map();
        (centre.centre_formation_filieres || []).forEach((item) => {
            const filiere = item.filieres_centre;
            if (filiere && filiere.domaines_centre) {
                const domaine = filiere.domaines_centre;
                const domaineId = domaine.id;
                if (!domaineMap.has(domaineId)) {
                    domaineMap.set(domaineId, {
                        nom: domaine.nom,
                        filieres: []
                    });
                }
                domaineMap.get(domaineId).filieres.push({
                    id: filiere.id,
                    nom: filiere.nom
                });
            }
        });
        centre.domaines = Array.from(domaineMap.values());
        // Remove the nested data to clean up the response
        delete centre.centre_formation_filieres;
        return centre;
    }
    /**
     * Lister toutes les filières centre
     */
    async listFilieresCentre() {
        const { data, error } = await this.supabase
            .from('filieres_centre')
            .select('id, nom, domaine_id')
            .order('nom');
        if (error) {
            throw new Error(`Failed to list filieres centre: ${error.message}`);
        }
        return data || [];
    }
    /**
     * Mettre à jour mon centre
     */
    async updateMyCentre(userId, payload) {
        // Interdire la modification du statut via cette route
        const { statut, profile_id, id, date_creation, selectedFilieres, ...updateData } = payload;
        const { data, error } = await this.supabase
            .from('centres_formation')
            .update({
            ...updateData,
            updated_at: new Date().toISOString(),
        })
            .eq('profile_id', userId)
            .select('*');
        if (error) {
            throw new Error(`Failed to update my centre: ${error.message}`);
        }
        let centre;
        if (!data || data.length === 0) {
            // Centre not found, create it
            const centreId = (0, crypto_1.randomUUID)();
            const insertPayload = {
                id: centreId,
                profile_id: userId,
                nom: updateData.nom || null,
                description: updateData.description || null,
                email: updateData.email || null,
                contacts: updateData.contacts || null,
                statut: 'PENDING',
                logo_url: updateData.logo_url || null,
                couverture_logo_url: updateData.couverture_logo_url || null,
                lien_site: updateData.lien_site || null,
                video_url: updateData.video_url || null,
                sigle: updateData.sigle || null,
                annee_fondation: updateData.annee_fondation || null,
                date_creation: new Date().toISOString(),
                ...updateData,
            };
            const { data: insertData, error: insertError } = await this.supabase
                .from('centres_formation')
                .insert(insertPayload)
                .select('*')
                .single();
            if (insertError) {
                throw new Error(`Failed to create centre: ${insertError.message}`);
            }
            centre = insertData;
        }
        else {
            centre = data[0];
        }
        // Handle selectedFilieres: insert into centre_formation_filieres
        if (selectedFilieres && Array.isArray(selectedFilieres)) {
            // Delete existing
            await this.supabase
                .from('centre_formation_filieres')
                .delete()
                .eq('centre_id', centre.id);
            // Insert new
            if (selectedFilieres.length > 0) {
                const inserts = selectedFilieres.map((filiereId) => ({
                    centre_id: centre.id,
                    filiere_id: filiereId,
                }));
                // debug log to help troubleshoot why table might be empty
                console.log('Attempting to insert centre filieres for centre', centre.id, inserts);
                const { error: insertError } = await this.supabase
                    .from('centre_formation_filieres')
                    .insert(inserts);
                if (insertError) {
                    console.warn('Failed to insert centre filieres:', insertError, 'payload:', inserts);
                }
            }
        }
        return centre;
    }
    /**
     * Récupérer un centre par ID (info publiques, seulement si APPROVED)
     */
    async getCentreById(id) {
        const { data, error } = await this.supabase
            .from('centres_formation')
            .select(`
        *,
        centre_formation_filieres (
          filieres_centre (
            id,
            nom,
            domaines_centre (
              id,
              nom
            )
          )
        )
      `)
            .eq('id', id)
            .eq('statut', 'APPROVED') // Seulement les approuvés
            .single();
        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to get centre: ${error.message}`);
        }
        if (!data)
            return null;
        return this.processCentreWithDomaines(data);
    }
    /**
     * Lister tous les centres approuvés
     */
    async listApprovedCentres(limit = 20, offset = 0) {
        const { data, error } = await this.supabase
            .from('centres_formation')
            .select(`
        *,
        centre_formation_filieres (
          filieres_centre (
            id,
            nom,
            domaines_centre (
              id,
              nom
            )
          )
        )
      `)
            .in('statut', ['APPROVED', 'PENDING'])
            .order('date_creation', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error) {
            throw new Error(`Failed to list centres: ${error.message}`);
        }
        // Process each centre to add domaines
        const centres = (data || []).map(centre => this.processCentreWithDomaines(centre));
        return centres;
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
