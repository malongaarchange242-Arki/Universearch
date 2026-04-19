/**
 * Service métier pour la gestion des universités.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export interface UniversiteRecord {
  id: string;
  profile_id: string;
  nom: string;
  description?: string;
  sigle?: string;
  annee_fondation?: number;
  contacts?: string | null;
  email?: string;
  statut: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  logo_url?: string;
  couverture_logo_url?: string;
  lien_site?: string;
  domaine?: string;
  video_url?: string;
  date_creation: string;
  updated_at?: string;
  domaines?: Array<{
    nom: string;
    filieres: Array<{
      id: string;
      nom: string;
    }>;
  }>;
}

export class UniversitesService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create a new université (and profile record)
   */
  async createUniversite(payload: Partial<UniversiteRecord> & { telephone?: string }): Promise<UniversiteRecord> {
    const profileId = randomUUID();
    const uniId = randomUUID();

    // Insert profile
    const { error: profileError } = await this.supabase
      .from('profiles')
      .insert({
        id: profileId,
        nom: payload.nom ?? null,
        email: payload.email ?? null,
        telephone: (payload as any).telephone ?? null,
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
        sigle: (payload as any).sigle ?? null,
        annee_fondation: (payload as any).annee_fondation ?? null,
        contacts: (payload as any).contacts ?? null,
        email: payload.email ?? null,
        statut: (payload.statut as any) ?? 'PENDING',
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

    return data as UniversiteRecord;
  }

  /**
   * Récupérer mon université (par profile_id de l'utilisateur connecté)
   */
  async getMyUniversite(userId: string): Promise<UniversiteRecord | null> {
    const { data, error } = await this.supabase
      .from('universites')
      .select('*')
      .eq('profile_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found
      throw new Error(`Failed to get my université: ${error.message}`);
    }

    if (!data) return null;

    // Add domaines and filieres
    return await this.addDomainesToUniversite(data);
  }

  /**
   * Récupérer une université par ID (pour accès public, seulement approuvées)
   */
  async getUniversiteById(id: string): Promise<UniversiteRecord | null> {
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

    if (!data) return null;

    // Add domaines and filieres
    return await this.addDomainesToUniversite(data);
  }

  /**
   * Mettre à jour mon université
   */
  async updateMyUniversite(
    userId: string,
    payload: Partial<UniversiteRecord> & { selectedFilieres?: string[] }
  ): Promise<UniversiteRecord> {
    // Interdire la modification du statut via cette route
    const { statut, profile_id, id, date_creation, selectedFilieres, ...updateData } = payload as any;

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

    let universite: UniversiteRecord;

    if (!data || data.length === 0) {
      // Université not found, create it
      const uniId = randomUUID();
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
    } else {
      universite = data[0];
    }

    // 🔥 NEW: If frontend sent selectedFilieres, now INSERT them into universite_filieres!
    if (selectedFilieres && Array.isArray(selectedFilieres) && selectedFilieres.length > 0) {
      try {
        console.log(`🔗 [DEBUG] Attaching ${selectedFilieres.length} filières to université ${universite.id}:`, selectedFilieres);
        // Pass filieres directly - attachFilieresToUniversite will validate them against filieres table
        const result = await this.attachFilieresToUniversite(universite.id, selectedFilieres);
        console.log(`✅ [DEBUG] Filière attachment result:`, result);
      } catch (err) {
        console.warn(`Warning: Failed to attach filieres: ${(err as Error).message}`);
        // Don't throw - update was successful, just filiere attachment failed
      }
    }

    return universite;
  }

  /**
   * Helper method to add domaines and filieres to a universite record
   */
  private async addDomainesToUniversite(universite: any): Promise<UniversiteRecord> {
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
    const domainesMap = new Map<string, { nom: string; filieres: Array<{ id: string; nom: string }> }>();

    (filiereData || []).forEach((row: any) => {
      if (row.filieres && row.filieres.domaines) {
        const domaineNom = row.filieres.domaines.nom;
        if (!domainesMap.has(domaineNom)) {
          domainesMap.set(domaineNom, { nom: domaineNom, filieres: [] });
        }
        domainesMap.get(domaineNom)!.filieres.push({
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
  async listApprovedUniversites(limit = 20, offset = 0): Promise<UniversiteRecord[]> {
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
  async uploadLogoForMyUniversite(userId: string, buffer: Buffer, filename: string, contentType = 'image/png'): Promise<string> {
    // find universite by profile_id
    const { data: uni, error: uniErr } = await this.supabase
      .from('universites')
      .select('id')
      .eq('profile_id', userId)
      .single();

    if (uniErr || !uni) {
      throw new Error('Université not found for your account');
    }

    const uniId = (uni as any).id as string;
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
    const getUrlResult = this.supabase.storage.from('logos').getPublicUrl(uploadData.path as any);
    const publicURL = (getUrlResult as any)?.publicURL ?? (getUrlResult as any)?.data?.publicUrl ?? (getUrlResult as any)?.data?.publicURL ?? null;

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
   * Attacher plusieurs filières à une université (par universiteId).
   * Évite les doublons en vérifiant les associations existantes.
   * Accepte les IDs (UUIDs) ou slugs (comme "genie-informatique")
   */
  async attachFilieresToUniversite(universiteId: string, filiereIds: string[]): Promise<{ inserted: number; skipped: string[] }> {
    if (!Array.isArray(filiereIds) || filiereIds.length === 0) {
      return { inserted: 0, skipped: [] };
    }

    // Normalize incoming IDs
    const ids = Array.from(new Set(filiereIds.map(String)));
    console.log(`🔗 [DEBUG] attachFilieresToUniversite: trying to attach ${ids.length} filières:`, ids);

    // Strategy 1: Try to find by exact ID match (UUIDs)
    let { data: filieres, error: filieresErr } = await this.supabase
      .from('filieres')
      .select('id')
      .in('id', ids as any);

    if (filieresErr) {
      console.warn(`⚠️ Query by ID failed:`, filieresErr.message);
      filieres = [];
    }

    let validIds = (filieres || []).map((f: any) => f.id).filter(Boolean);
    console.log(`✅ Found ${validIds.length} filieres by UUID lookup`, validIds);

    // Strategy 2: If we didn't find all, try to match by NOM (for slug inputs)
    if (validIds.length < ids.length) {
      const remainingToFind = ids.filter(id => !validIds.includes(id));
      console.log(`🔍 Trying to match ${remainingToFind.length} remaining IDs by NOM:`, remainingToFind);

      // Query all filieres and try to match by name/slug pattern
      const { data: allFilieres } = await this.supabase.from('filieres').select('id, nom');
      
      if (allFilieres && allFilieres.length > 0) {
        remainingToFind.forEach(slug => {
          // Try to find a filière where nom matches (case-insensitive)
          // OR where the name can be converted to this slug
          const match = allFilieres.find((f: any) => {
            const filiereSlug = (f.nom || '').toLowerCase().replace(/[éè]/g, 'e').replace(/\s+/g, '-');
            const inputSlug = (slug || '').toLowerCase();
            return filiereSlug === inputSlug || f.nom?.toLowerCase() === slug.toLowerCase();
          });

          if (match) {
            console.log(`✅ Matched slug "${slug}" to filière "${match.nom}" (ID: ${match.id})`);
            validIds.push(match.id);
          } else {
            console.warn(`❌ Could not match slug "${slug}" to any filière`);
          }
        });
      }
    }

    console.log(`📊 Final validIds to insert: ${validIds.length}`, validIds);

    if (validIds.length === 0) {
      console.warn(`⚠️ No valid filières found for:`, ids);
      return { inserted: 0, skipped: ids };
    }

    // Remove duplicates
    validIds = Array.from(new Set(validIds));

    // Find already existing associations to prevent duplicates
    const { data: existing, error: existingErr } = await this.supabase
      .from('universite_filieres')
      .select('filiere_id')
      .eq('universite_id', universiteId)
      .in('filiere_id', validIds as any);

    if (existingErr) {
      throw new Error(`Failed to check existing associations: ${existingErr.message}`);
    }

    const existingIds = new Set((existing || []).map((r: any) => r.filiere_id));
    console.log(`🔄 Existing associations: ${existingIds.size}`, Array.from(existingIds));

    const toInsert = validIds.filter(id => !existingIds.has(id));
    console.log(`➕ Will insert ${toInsert.length} new associations`, toInsert);

    if (toInsert.length === 0) {
      return { inserted: 0, skipped: validIds }; // nothing new
    }

    const rows = toInsert.map(id => ({ id: randomUUID(), universite_id: universiteId, filiere_id: id, created_at: new Date().toISOString() }));

    const { error: insertErr } = await this.supabase.from('universite_filieres').insert(rows);
    if (insertErr) {
      throw new Error(`Failed to insert universite_filieres: ${insertErr.message}`);
    }

    console.log(`✅ Successfully inserted ${rows.length} associations to universite_filieres`);
    return { inserted: rows.length, skipped: Array.from(existingIds) };
  }

  /**
   * Attacher plusieurs filières à mon université (résout l'universite via profile_id)
   */
  async attachFilieresToMyUniversite(userId: string, filiereIds: string[]) {
    const { data: uni, error: uniErr } = await this.supabase.from('universites').select('id').eq('profile_id', userId).single();
    if (uniErr || !uni) throw new Error('Université not found for your account');
    const uniId = (uni as any).id as string;
    return this.attachFilieresToUniversite(uniId, filiereIds);
  }
}
