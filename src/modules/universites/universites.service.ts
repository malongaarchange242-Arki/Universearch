/**
 * Service métier pour la gestion des universités.
 */

import { SupabaseClient } from '@supabase/supabase-js';

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
    const { statut, profile_id, id, date_creation, ...updateData } = payload as any;

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
}
