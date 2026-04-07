"use strict";
// src/modules/auth/auth.service.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = exports.refreshAccessToken = exports.revokeRefreshToken = exports.generateToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
const getJwtSecret = () => {
    let secret = process.env.JWT_SECRET;
    if (!secret) {
        dotenv.config({ path: path_1.default.resolve(process.cwd(), '.env') });
        secret = process.env.JWT_SECRET;
    }
    if (!secret) {
        throw new Error('Missing JWT_SECRET configuration');
    }
    return secret;
};
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, getJwtSecret(), {
        expiresIn: '7d',
    });
};
exports.generateToken = generateToken;
const generateRefreshTokenJwt = (payload) => {
    return jsonwebtoken_1.default.sign(payload, getJwtSecret(), {
        expiresIn: '30d',
    });
};
const hashToken = (token) => crypto_1.default.createHash('sha256').update(token).digest('hex');
const issueRefreshToken = async (supabase, userId) => {
    const refreshToken = generateRefreshTokenJwt({
        id: userId,
        type: 'refresh',
    });
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const tokenHash = hashToken(refreshToken);
    const { error } = await supabase.from('auth_refresh_tokens').insert({
        id: crypto_1.default.randomUUID(),
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
    });
    if (error) {
        throw new Error(`Refresh token creation failed: ${error.message}`);
    }
    return refreshToken;
};
const revokeRefreshToken = async (supabase, refreshToken) => {
    const tokenHash = hashToken(refreshToken);
    const { error } = await supabase
        .from('auth_refresh_tokens')
        .update({ revoked_at: new Date().toISOString() })
        .eq('token_hash', tokenHash)
        .is('revoked_at', null);
    if (error) {
        throw new Error(`Failed to revoke refresh token: ${error.message}`);
    }
};
exports.revokeRefreshToken = revokeRefreshToken;
const refreshAccessToken = async (supabase, refreshToken) => {
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(refreshToken, getJwtSecret());
    }
    catch (e) {
        throw new Error(`Invalid refresh token: ${e.message}`);
    }
    if (typeof decoded === 'string' ||
        !decoded.id ||
        decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token payload');
    }
    const tokenHash = hashToken(refreshToken);
    const now = new Date().toISOString();
    const { data: storedToken, error: tokenError } = await supabase
        .from('auth_refresh_tokens')
        .select('id, user_id, expires_at, revoked_at')
        .eq('token_hash', tokenHash)
        .single();
    if (tokenError || !storedToken) {
        throw new Error('Refresh token not found');
    }
    if (storedToken.revoked_at) {
        throw new Error('Refresh token has been revoked');
    }
    if (storedToken.expires_at <= now) {
        throw new Error('Refresh token has expired');
    }
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, profile_type')
        .eq('id', storedToken.user_id)
        .single();
    if (profileError || !profile) {
        throw new Error('User not found for refresh token');
    }
    await (0, exports.revokeRefreshToken)(supabase, refreshToken);
    const token = (0, exports.generateToken)({
        id: profile.id,
        email: profile.email ?? null,
        role: profile.profile_type,
    });
    const nextRefreshToken = await issueRefreshToken(supabase, profile.id);
    return {
        token,
        refreshToken: nextRefreshToken,
        user: {
            id: profile.id,
            email: profile.email ?? null,
            role: profile.profile_type,
        },
    };
};
exports.refreshAccessToken = refreshAccessToken;
/**
 * Crée un utilisateur Supabase + profile + table spécifique
 */
const registerUser = async (supabase, payload) => {
    const password = payload.password && payload.password.trim().length >= 8
        ? payload.password
        : crypto_1.default.randomBytes(16).toString('hex');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: payload.email,
        password,
        email_confirm: true,
        user_metadata: {
            profile_type: payload.profileType,
        },
    });
    if (authError || !authData.user) {
        throw new Error(`Auth user creation failed: ${authError?.message || 'unknown error'}`);
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
        await supabase.auth.admin.deleteUser(userId);
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
    const token = (0, exports.generateToken)({
        id: userId,
        email: payload.email,
        role: payload.profileType,
    });
    const refreshToken = await issueRefreshToken(supabase, userId);
    const result = { userId, email: payload.email };
    if (token) {
        result.token = token;
    }
    result.refreshToken = refreshToken;
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
    const { email, telephone, password } = payload;
    if (password) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (authError || !authData.user) {
            console.error('Password login failed:', authError?.message);
            throw new Error('Invalid email or password');
        }
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, profile_type')
            .eq('id', authData.user.id)
            .single();
        if (profileError || !profile) {
            throw new Error('User profile not found');
        }
        if (!['universite', 'centre_formation', 'admin'].includes(profile.profile_type)) {
            throw new Error('Password login is only available for admin, universite and centre_formation');
        }
        const token = (0, exports.generateToken)({
            id: profile.id,
            email: profile.email ?? null,
            role: profile.profile_type,
        });
        const refreshToken = await issueRefreshToken(supabase, profile.id);
        return {
            userId: profile.id,
            email: profile.email ?? null,
            token,
            refreshToken,
        };
    }
    if (!telephone) {
        throw new Error('telephone is required when password is not provided');
    }
    // 1️⃣ Vérifier que l'utilisateur existe avec email + téléphone
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, profile_type')
        .eq('email', email)
        .eq('telephone', telephone)
        .single(); // Retourne une seule ligne
    if (profileError || !profiles) {
        console.error('Login failed:', profileError?.message);
        throw new Error('User not found with provided email and phone');
    }
    const userId = profiles.id;
    const userEmail = profiles.email;
    const role = profiles.profile_type;
    if (!role) {
        throw new Error('User profile is missing a role');
    }
    try {
        const token = (0, exports.generateToken)({
            id: userId,
            email: userEmail ?? null,
            role,
        });
        const refreshToken = await issueRefreshToken(supabase, userId);
        return {
            userId,
            email: userEmail ?? null,
            token,
            refreshToken,
        };
    }
    catch (e) {
        console.error('Auth error:', e.message);
        throw new Error(`Authentication failed: ${e.message}`);
    }
};
exports.loginUser = loginUser;
