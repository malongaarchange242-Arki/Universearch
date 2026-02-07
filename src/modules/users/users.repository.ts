// src/modules/users/users.repository.ts

import { SupabaseClient } from '@supabase/supabase-js';

export interface UserRecord {
  id: string;
  email: string | null;
  nom: string | null;
  prenom: string | null;
  telephone: string | null;
  profile_type: string | null;
  date_naissance: string | null;
  genre: string | null;
}

export class UsersRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Récupère un utilisateur par son ID
   */
  async getById(id: string): Promise<UserRecord | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);

    return data;
  }

  /**
   * Liste les utilisateurs avec filtres et pagination
   */
  async list(
    profileType?: string,
    limit = 20,
    offset = 0
  ): Promise<UserRecord[]> {
    let query = this.supabase.from('profiles').select('*');

    if (profileType) {
      query = query.eq('profile_type', profileType);
    }

    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return data;
  }

  /**
   * Met à jour un utilisateur
   */
  async update(id: string, payload: Partial<UserRecord>): Promise<UserRecord> {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return data;
  }

  /**
   * Supprime un utilisateur
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}
