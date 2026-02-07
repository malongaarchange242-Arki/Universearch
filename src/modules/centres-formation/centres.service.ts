/**
 * Service métier pour la gestion des centres de formation.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface CentreFormationRecord {
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

export class CentresService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Récupérer mon centre (par profile_id de l'utilisateur connecté)
   */
  async getMyCentre(userId: string): Promise<CentreFormationRecord | null> {
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
  async updateMyCentre(
    userId: string,
    payload: Partial<CentreFormationRecord>
  ): Promise<CentreFormationRecord> {
    // Interdire la modification du statut via cette route
    const { statut, profile_id, id, date_creation, ...updateData } = payload as any;

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
  async getCentreById(id: string): Promise<CentreFormationRecord | null> {
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
  async listApprovedCentres(limit = 20, offset = 0): Promise<CentreFormationRecord[]> {
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
