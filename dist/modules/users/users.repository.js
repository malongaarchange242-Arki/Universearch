"use strict";
// src/modules/users/users.repository.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersRepository = void 0;
class UsersRepository {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    /**
     * Récupère un utilisateur par son ID
     */
    async getById(id) {
        const { data, error } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    }
    /**
     * Liste les utilisateurs avec filtres et pagination
     */
    async list(profileType, limit = 20, offset = 0) {
        let query = this.supabase.from('profiles').select('*');
        if (profileType) {
            query = query.eq('profile_type', profileType);
        }
        const { data, error } = await query.range(offset, offset + limit - 1);
        if (error)
            throw new Error(error.message);
        return data;
    }
    /**
     * Met à jour un utilisateur
     */
    async update(id, payload) {
        const { data, error } = await this.supabase
            .from('profiles')
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    }
    /**
     * Supprime un utilisateur
     */
    async delete(id) {
        const { error } = await this.supabase
            .from('profiles')
            .delete()
            .eq('id', id);
        if (error)
            throw new Error(error.message);
    }
}
exports.UsersRepository = UsersRepository;
