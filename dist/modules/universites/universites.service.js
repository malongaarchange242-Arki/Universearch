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
            sigle: payload.sigle ?? null,
            annee_fondation: payload.annee_fondation ?? null,
            contacts: payload.contacts ?? null,
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
        if (!data)
            return null;
        // Add domaines and filieres
        return await this.addDomainesToUniversite(data);
    }
    /**
     * Récupérer une université par ID (pour accès public, seulement approuvées)
     */
    async getUniversiteById(id) {
        const { data, error } = await this.supabase
            .from('universites')
            .select('*')
            .eq('id', id)
            .eq('statut', 'APPROVED')
            .single();
        if (error && error.code !== 'PGRST116') {
            // PGRST116 = not found
            throw new Error(`Failed to get université: ${error.message}`);
        }
        if (!data)
            return null;
        // Add domaines and filieres
        return await this.addDomainesToUniversite(data);
    }
    /**
     * Mettre à jour mon université
     */
    async updateMyUniversite(userId, payload) {
        // Interdire la modification du statut via cette route
        const { statut, profile_id, id, date_creation, selectedFilieres, ...updateData } = payload;
        // If frontend sent selectedFilieres (array), persist as a comma-separated domaine
        if (selectedFilieres && Array.isArray(selectedFilieres)) {
            updateData.domaine = selectedFilieres.join(', ');
        }
        const { data, error } = await this.supabase
            .from('universites')
            .update({
            ...updateData,
            updated_at: new Date().toISOString(),
        })
            .eq('profile_id', userId)
            .select('*');
        if (error) {
            throw new Error(`Failed to update my université: ${error.message}`);
        }
        let universite;
        if (!data || data.length === 0) {
            // Université not found, create it
            const uniId = (0, crypto_1.randomUUID)();
            const insertPayload = {
                id: uniId,
                profile_id: userId,
                nom: updateData.nom || null,
                description: updateData.description || null,
                sigle: updateData.sigle || null,
                annee_fondation: updateData.annee_fondation || null,
                contacts: updateData.contacts || null,
                email: updateData.email || null,
                statut: 'PENDING',
                logo_url: updateData.logo_url || null,
                couverture_logo_url: updateData.couverture_logo_url || null,
                lien_site: updateData.lien_site || null,
                domaine: updateData.domaine || null,
                video_url: updateData.video_url || null,
                date_creation: new Date().toISOString(),
                ...updateData,
            };
            const { data: insertData, error: insertError } = await this.supabase
                .from('universites')
                .insert(insertPayload)
                .select('*')
                .single();
            if (insertError) {
                throw new Error(`Failed to create université: ${insertError.message}`);
            }
            universite = insertData;
        }
        else {
            universite = data[0];
        }
        // 🔥 NEW: If frontend sent selectedFilieres, now INSERT them into universite_filieres!
        if (selectedFilieres && Array.isArray(selectedFilieres) && selectedFilieres.length > 0) {
            try {
                console.log(`🔗 [DEBUG] Attaching ${selectedFilieres.length} filières to université ${universite.id}:`, selectedFilieres);
                // Pass filieres directly - attachFilieresToUniversite will validate them against filieres table
                const result = await this.attachFilieresToUniversite(universite.id, selectedFilieres);
                console.log(`✅ [DEBUG] Filière attachment result:`, result);
            }
            catch (err) {
                console.warn(`Warning: Failed to attach filieres: ${err.message}`);
                // Don't throw - update was successful, just filiere attachment failed
            }
        }
        return universite;
    }
    /**
     * Helper method to add domaines and filieres to a universite record
     */
    async addDomainesToUniversite(universite) {
        // Get filieres for this universite
        const { data: filiereData, error: filError } = await this.supabase
            .from('universite_filieres')
            .select(`
        filieres!inner(
          id,
          nom,
          domaines!inner(
            nom
          )
        )
      `)
            .eq('universite_id', universite.id);
        if (filError) {
            throw new Error(`Failed to fetch filieres for universite: ${filError.message}`);
        }
        // Group filieres by domaine
        const domainesMap = new Map();
        (filiereData || []).forEach((row) => {
            if (row.filieres && row.filieres.domaines) {
                const domaineNom = row.filieres.domaines.nom;
                if (!domainesMap.has(domaineNom)) {
                    domainesMap.set(domaineNom, { nom: domaineNom, filieres: [] });
                }
                domainesMap.get(domaineNom).filieres.push({
                    id: row.filieres.id,
                    nom: row.filieres.nom
                });
            }
        });
        // Sort filieres within each domaine
        Array.from(domainesMap.values()).forEach(domaine => {
            domaine.filieres.sort((a, b) => a.nom.localeCompare(b.nom));
        });
        return {
            id: universite.id,
            profile_id: universite.profile_id,
            nom: universite.nom,
            description: universite.description,
            sigle: universite.sigle,
            annee_fondation: universite.annee_fondation,
            contacts: universite.contacts,
            email: universite.email,
            statut: universite.statut,
            logo_url: universite.logo_url,
            couverture_logo_url: universite.couverture_logo_url,
            lien_site: universite.lien_site,
            domaine: universite.domaine,
            video_url: universite.video_url,
            date_creation: universite.date_creation,
            updated_at: universite.updated_at,
            domaines: Array.from(domainesMap.values()).sort((a, b) => a.nom.localeCompare(b.nom))
        };
    }
    /**
     * Lister toutes les universités approuvées avec leurs domaines et filières
     */
    async listApprovedUniversites(limit = 20, offset = 0) {
        // Get the universites
        const { data: universites, error: uniError } = await this.supabase
            .from('universites')
            .select('*')
            .in('statut', ['APPROVED', 'PENDING'])
            .order('date_creation', { ascending: false })
            .range(offset, offset + limit - 1);
        if (uniError) {
            throw new Error(`Failed to list universités: ${uniError.message}`);
        }
        if (!universites || universites.length === 0) {
            return [];
        }
        // Add domaines to each universite
        const resultPromises = universites.map(universite => this.addDomainesToUniversite(universite));
        const result = await Promise.all(resultPromises);
        return result;
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
    /**
     * Normalise un texte en slug pour matching
     * Gère les accents, caractères spéciaux, espaces, etc.
     */
    normalizeToSlug(text) {
        if (!text)
            return '';
        return text
            .toLowerCase()
            .trim()
            .normalize('NFD') // Normalize Unicode accents
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/&/g, 'et') // Replace & with 'et'
            .replace(/[^\w\s-]/g, '') // Remove all special chars except spaces/hyphens/word chars
            .replace(/\s+/g, '-') // Replace whitespace with hyphens
            .replace(/-+/g, '-') // Collapse multiple hyphens
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    }
    /**
     * Attacher plusieurs filières à une université (par universiteId).
     * Évite les doublons en vérifiant les associations existantes.
     * Accepte les IDs (UUIDs) ou slugs (comme "genie-informatique")
     */
    async attachFilieresToUniversite(universiteId, filiereIds) {
        if (!Array.isArray(filiereIds) || filiereIds.length === 0) {
            return { inserted: 0, skipped: [] };
        }
        // Normalize incoming IDs
        const ids = Array.from(new Set(filiereIds.map(String)));
        console.log(`🔗 [DEBUG] attachFilieresToUniversite: trying to attach ${ids.length} filières:`, ids);
        // Strategy 1: Try to find by exact UUID match
        let { data: filieres, error: filieresErr } = await this.supabase
            .from('filieres')
            .select('id, nom')
            .in('id', ids);
        if (filieresErr) {
            console.warn(`⚠️ Query by UUID failed:`, filieresErr.message);
            filieres = [];
        }
        let validIds = (filieres || []).map((f) => f.id).filter(Boolean);
        const matchedByUuid = new Set(validIds);
        console.log(`✅ Found ${validIds.length} filieres by UUID lookup`, validIds);
        // Strategy 2: If we didn't find all, try to match by slug
        const remainingToFind = ids.filter(id => !matchedByUuid.has(id));
        if (remainingToFind.length > 0) {
            console.log(`🔍 Trying to match ${remainingToFind.length} remaining IDs by slug:`, remainingToFind);
            // Query all filieres to do slug matching
            const { data: allFilieres } = await this.supabase
                .from('filieres')
                .select('id, nom');
            if (allFilieres && allFilieres.length > 0) {
                const inputSlugs = remainingToFind.map(id => ({ input: id, normalized: this.normalizeToSlug(id) }));
                inputSlugs.forEach(({ input, normalized }) => {
                    const match = allFilieres.find((f) => {
                        const filiereNormalized = this.normalizeToSlug(f.nom || '');
                        return filiereNormalized === normalized;
                    });
                    if (match) {
                        console.log(`✅ Matched slug "${input}" → "${match.nom}" (UUID: ${match.id})`);
                        validIds.push(match.id);
                    }
                    else {
                        console.warn(`❌ No match found for slug "${input}" (normalized: "${normalized}")`);
                    }
                });
            }
        }
        // Remove duplicates
        validIds = Array.from(new Set(validIds));
        console.log(`📊 Total valid IDs after resolution: ${validIds.length}`, validIds);
        if (validIds.length === 0) {
            console.warn(`⚠️ No valid filières found for any of:`, ids);
            return { inserted: 0, skipped: ids };
        }
        // Find already existing associations to prevent duplicates
        const { data: existing, error: existingErr } = await this.supabase
            .from('universite_filieres')
            .select('filiere_id')
            .eq('universite_id', universiteId)
            .in('filiere_id', validIds);
        if (existingErr) {
            throw new Error(`Failed to check existing associations: ${existingErr.message}`);
        }
        const existingIds = new Set((existing || []).map((r) => r.filiere_id));
        console.log(`🔄 Existing associations: ${existingIds.size}`, Array.from(existingIds));
        const toInsert = validIds.filter(id => !existingIds.has(id));
        console.log(`➕ Will insert ${toInsert.length} new associations`, toInsert);
        if (toInsert.length === 0) {
            console.log(`ℹ️ All filières were already associated`);
            return { inserted: 0, skipped: validIds };
        }
        const rows = toInsert.map(id => ({
            id: (0, crypto_1.randomUUID)(),
            universite_id: universiteId,
            filiere_id: id,
            created_at: new Date().toISOString()
        }));
        console.log(`💾 Inserting ${rows.length} rows:`, rows);
        const { error: insertErr } = await this.supabase
            .from('universite_filieres')
            .insert(rows);
        if (insertErr) {
            console.error(`❌ Insert failed:`, insertErr);
            throw new Error(`Failed to insert universite_filieres: ${insertErr.message}`);
        }
        console.log(`✅ Successfully inserted ${rows.length} associations to universite_filieres`);
        return { inserted: rows.length, skipped: Array.from(existingIds) };
    }
    /**
     * Attacher plusieurs filières à mon université (résout l'universite via profile_id)
     */
    async attachFilieresToMyUniversite(userId, filiereIds) {
        const { data: uni, error: uniErr } = await this.supabase.from('universites').select('id').eq('profile_id', userId).single();
        if (uniErr || !uni)
            throw new Error('Université not found for your account');
        const uniId = uni.id;
        return this.attachFilieresToUniversite(uniId, filiereIds);
    }
}
exports.UniversitesService = UniversitesService;
