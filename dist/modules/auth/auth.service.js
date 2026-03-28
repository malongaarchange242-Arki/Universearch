"use strict";
// src/modules/auth/auth.service.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Crée un utilisateur Supabase + profile + table spécifique
 */
const registerUser = async (supabase, payload) => {
    // Supabase requires a password when creating an auth user. If the caller
    // didn't provide one we generate a random secret; the frontend can then
    // trigger a password reset flow or ignore it. We only attempt to sign in
    // automatically when the password was explicitly given.
    const generatedPwd = payload.password || crypto_1.default.randomUUID();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: payload.email,
        password: generatedPwd,
        email_confirm: true,
    });
    if (authError || !authData.user) {
        throw new Error(`Auth creation failed: ${authError?.message}`);
    }
    const userId = authData.user.id;
    // Création du profile
    const { error: profileError } = await supabase
        .from('profiles')
        .insert({
        id: userId,
        nom: payload.nom,
        prenom: payload.prenom ?? null,
        telephone: payload.telephone,
        email: payload.email,
        profile_type: payload.profileType,
        date_naissance: payload.dateNaissance ?? null,
        genre: payload.genre ?? null,
    });
    if (profileError) {
        throw new Error(`Profile creation failed: ${profileError.message}`);
    }
    // Table spécifique selon profileType
    switch (payload.profileType) {
        case 'utilisateur': {
            if (!payload.userType)
                throw new Error('userType is required for utilisateur');
            const { error } = await supabase.from('utilisateurs').insert({
                id: userId,
                user_type: payload.userType,
            });
            if (error) {
                // Rollback: supprimer le profile et l'utilisateur en cas d'erreur
                await supabase.from('profiles').delete().eq('id', userId);
                await supabase.auth.admin.deleteUser(userId);
                throw new Error(`Utilisateur creation failed: ${error.message}`);
            }
            break;
        }
        case 'admin': {
            const { error } = await supabase.from('admins').insert({ id: userId });
            if (error) {
                // Rollback
                await supabase.from('profiles').delete().eq('id', userId);
                await supabase.auth.admin.deleteUser(userId);
                throw new Error(`Admin creation failed: ${error.message}`);
            }
            break;
        }
        case 'superviseur': {
            const { error } = await supabase.from('superviseurs').insert({ id: userId });
            if (error) {
                // Rollback
                await supabase.from('profiles').delete().eq('id', userId);
                await supabase.auth.admin.deleteUser(userId);
                throw new Error(`Superviseur creation failed: ${error.message}`);
            }
            break;
        }
        case 'universite': {
            const { error } = await supabase.from('universites').insert({
                id: userId,
                profile_id: userId,
                nom: payload.nom,
                email: payload.email,
                statut: 'PENDING',
                date_creation: new Date().toISOString(),
            });
            if (error) {
                // Rollback: supprimer le profile et l'utilisateur en cas d'erreur
                await supabase.from('profiles').delete().eq('id', userId);
                await supabase.auth.admin.deleteUser(userId);
                throw new Error(`Universite creation failed: ${error.message}`);
            }
            break;
        }
        case 'centre_formation': {
            const { error } = await supabase.from('centres_formation').insert({
                id: userId,
                profile_id: userId,
                nom: payload.nom,
                email: payload.email,
                statut: 'PENDING',
                date_creation: new Date().toISOString(),
            });
            if (error) {
                // Rollback: supprimer le profile et l'utilisateur en cas d'erreur
                await supabase.from('profiles').delete().eq('id', userId);
                await supabase.auth.admin.deleteUser(userId);
                throw new Error(`Centre creation failed: ${error.message}`);
            }
            break;
        }
        default:
            break;
    }
    // After successful creation, sign in the new user to obtain a token.
    // we use `generatedPwd` which is either the provided password or the random
    // one we generated above. Signing in should always succeed unless something
    // unexpected happened.
    let token = null;
    try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: payload.email,
            password: generatedPwd,
        });
        if (!signInError && signInData.session && signInData.session.access_token) {
            token = signInData.session.access_token;
        }
    }
    catch (e) {
        // ignore sign-in errors; we'll just return without token
    }
    const result = { userId, email: payload.email };
    if (token) {
        result.token = token;
    }
    if (payload.userType) {
        result.userType = payload.userType;
    }
    return result;
};
exports.registerUser = registerUser;
/**
 * Login utilisateur via email + téléphone (sans password)
 * ✅ Vérifier juste que email+téléphone existent - Accès automatique
 */
const loginUser = async (supabase, payload) => {
    const { email, telephone } = payload;
    // 1️⃣ Vérifier que l'utilisateur existe avec email + téléphone
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .eq('telephone', telephone)
        .single(); // Retourne une seule ligne
    if (profileError || !profiles) {
        console.error('Login failed:', profileError?.message);
        throw new Error('User not found with provided email and phone');
    }
    const userId = profiles.id;
    const userEmail = profiles.email;
    // 2️⃣ Générer un token de session automatique via magic link
    try {
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: userEmail,
        });
        if (linkError || !linkData) {
            console.error('Token generation failed:', linkError?.message);
            throw new Error('Failed to generate token');
        }
        // Extraire le token du lien générée
        // Le lien ressemble à: https://...#access_token=...&refresh_token=...&token_type=bearer
        const actionLink = linkData.properties?.action_link || '';
        // Extraire le token depuis le lien
        let token = null;
        if (actionLink.includes('#')) {
            // Format avec hash
            const hashPart = actionLink.split('#')[1];
            const params = new URLSearchParams(hashPart);
            token = params.get('access_token');
        }
        else if (actionLink.includes('token=')) {
            // Format avec query param
            const tokenMatch = actionLink.match(/token=([^&]+)/);
            token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;
        }
        if (!token) {
            console.error('Could not extract token from link:', actionLink);
            throw new Error('Failed to extract token from generated link');
        }
        return {
            userId: userId,
            email: userEmail ?? null,
            token: token,
        };
    }
    catch (e) {
        console.error('Auth error:', e.message);
        throw new Error(`Authentication failed: ${e.message}`);
    }
};
exports.loginUser = loginUser;
