/**
 * Service métier pour la gestion des centres de formation.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export interface CentreFormationRecord {
  id: string;
  profile_id: string;
  nom: string;
  description?: string;
  email?: string;
  contacts?: string;
  statut: 'PENDING' | 'APPROVED' | 'REJECTED';
  logo_url?: string;
  couverture_logo_url?: string;
  lien_site?: string;
  video_url?: string;
  date_creation: string;
  updated_at?: string;
  sigle?: string;
  annee_fondation?: number;
  domaines?: Array<{
    nom: string;
    filieres: Array<{
      id: string;
      nom: string;
    }>;
  }>;
}

export class CentresService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create a new centre de formation (and profile record)
   */
  async createCentre(payload: Partial<CentreFormationRecord> & { telephone?: string }): Promise<CentreFormationRecord> {
    const profileId = randomUUID();
    const centreId = randomUUID();

    // Insert profile
    const { error: profileError } = await this.supabase
      .from('profiles')
      .insert({
        id: profileId,
        nom: payload.nom ?? null,
        email: payload.email ?? null,
        telephone: (payload as any).telephone ?? null,
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
        statut: (payload.statut as any) ?? 'PENDING',
        logo_url: payload.logo_url ?? null,
        couverture_logo_url: payload.couverture_logo_url ?? null,
        lien_site: payload.lien_site ?? null,
        video_url: payload.video_url ?? null,
        sigle: (payload as any).sigle ?? null,
        annee_fondation: (payload as any).annee_fondation ?? null,
        date_creation: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      // rollback profile
      await this.supabase.from('profiles').delete().eq('id', profileId);
      throw new Error(`Failed to create centre: ${error.message}`);
    }

    return data as CentreFormationRecord;
  }

  /**
   * Récupérer mon centre (par profile_id de l'utilisateur connecté)
   */
  async getMyCentre(userId: string): Promise<CentreFormationRecord | null> {
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

    if (!data) return null;

    return this.processCentreWithDomaines(data);
  }

  /**
   * Process a centre record to add domaines and filieres
   */
  private processCentreWithDomaines(centre: any): CentreFormationRecord {
    const domaineMap = new Map<string, { nom: string; filieres: Array<{ id: string; nom: string }> }>();

    (centre.centre_formation_filieres || []).forEach((item: any) => {
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
        domaineMap.get(domaineId)!.filieres.push({
          id: filiere.id,
          nom: filiere.nom
        });
      }
    });

    centre.domaines = Array.from(domaineMap.values());
    // Remove the nested data to clean up the response
    delete centre.centre_formation_filieres;
    return centre as CentreFormationRecord;
  }

  /**
   * Lister toutes les filières centre
   */
  async listFilieresCentre(): Promise<Array<{ id: string; nom: string; domaine_id: string }>> {
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
  async updateMyCentre(
    userId: string,
    payload: Partial<CentreFormationRecord>
  ): Promise<CentreFormationRecord> {
    // Interdire la modification du statut via cette route
    const { statut, profile_id, id, date_creation, selectedFilieres, ...updateData } = payload as any;

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

    let centre: CentreFormationRecord;
    if (!data || data.length === 0) {
      // Centre not found, create it
      const centreId = randomUUID();
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
        sigle: (updateData as any).sigle || null,
        annee_fondation: (updateData as any).annee_fondation || null,
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
    } else {
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
        const inserts = selectedFilieres.map((filiereId: string) => ({
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
  async getCentreById(id: string): Promise<CentreFormationRecord | null> {
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

    if (!data) return null;

    return this.processCentreWithDomaines(data);
  }

  /**
   * Lister tous les centres approuvés
   */
  async listApprovedCentres(limit = 20, offset = 0): Promise<CentreFormationRecord[]> {
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
  async uploadLogoForMyCentre(userId: string, buffer: Buffer, filename: string, contentType = 'image/png'): Promise<string> {
    // find centre by profile_id
    const { data: centre, error: centreErr } = await this.supabase
      .from('centres_formation')
      .select('id')
      .eq('profile_id', userId)
      .single();

    if (centreErr || !centre) {
      throw new Error('Centre not found for your account');
    }

    const centreId = (centre as any).id as string;
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
    const getUrlResult = this.supabase.storage.from('logos').getPublicUrl(uploadData.path as any);
    const publicURL = (getUrlResult as any)?.publicURL ?? (getUrlResult as any)?.data?.publicUrl ?? (getUrlResult as any)?.data?.publicURL ?? null;

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
