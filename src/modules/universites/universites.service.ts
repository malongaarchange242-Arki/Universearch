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
  email?: string;
  statut: 'PENDING' | 'APPROVED' | 'REJECTED';
  logo_url?: string;
  couverture_logo_url?: string;
  lien_site?: string;
  domaine?: string;
  video_url?: string;
  date_creation: string;
  updated_at?: string;
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

    return data || null;
  }

  /**
   * Mettre à jour mon université
   */
  async updateMyUniversite(
    userId: string,
    payload: Partial<UniversiteRecord>
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
  async getUniversiteById(id: string): Promise<UniversiteRecord | null> {
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
  async listApprovedUniversites(limit = 20, offset = 0): Promise<UniversiteRecord[]> {
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
   */
  async attachFilieresToUniversite(universiteId: string, filiereIds: string[]): Promise<{ inserted: number; skipped: string[] }> {
    if (!Array.isArray(filiereIds) || filiereIds.length === 0) {
      return { inserted: 0, skipped: [] };
    }

    // Normalize incoming IDs
    const ids = Array.from(new Set(filiereIds.map(String)));

    // Ensure provided filiere IDs exist
    const { data: filieres, error: filieresErr } = await this.supabase
      .from('filieres')
      .select('id')
      .in('id', ids as any);

    if (filieresErr) {
      throw new Error(`Failed to validate filieres: ${filieresErr.message}`);
    }

    const validIds = (filieres || []).map((f: any) => f.id).filter(Boolean);
    if (validIds.length === 0) return { inserted: 0, skipped: ids };

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

    const toInsert = validIds.filter(id => !existingIds.has(id));
    if (toInsert.length === 0) {
      return { inserted: 0, skipped: validIds }; // nothing new
    }

    const rows = toInsert.map(id => ({ id: randomUUID(), universite_id: universiteId, filiere_id: id, created_at: new Date().toISOString() }));

    const { error: insertErr } = await this.supabase.from('universite_filieres').insert(rows);
    if (insertErr) {
      throw new Error(`Failed to insert universite_filieres: ${insertErr.message}`);
    }

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
