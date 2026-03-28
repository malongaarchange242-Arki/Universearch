"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSecurityHandler = exports.logoutHandler = exports.checkEmailHandler = exports.loginHandler = exports.registerHandler = void 0;
const auth_service_1 = require("./auth.service");
const supabase_1 = require("../../plugins/supabase"); // Supabase Admin client
/**
 * Handler de création de compte utilisateur.
 */
const registerHandler = async (request, reply) => {
    try {
        // Passe supabaseAdmin au service
        const result = await (0, auth_service_1.registerUser)(supabase_1.supabaseAdmin, request.body);
        reply.status(201).send({
            success: true,
            data: result,
        });
    }
    catch (error) {
        request.log.error(error);
        reply.status(400).send({
            success: false,
            error: error.message,
        });
    }
};
exports.registerHandler = registerHandler;
/**
 * Handler de connexion utilisateur.
 * Accepte email + téléphone (sans password)
 */
const loginHandler = async (request, reply) => {
    try {
        const { email, telephone } = request.body;
        // Connexion via le service (gère email + téléphone)
        const result = await (0, auth_service_1.loginUser)(supabase_1.supabaseAdmin, {
            email,
            telephone,
        });
        // Récupérer profile_type et user_type
        let profileType = null;
        let userType = null;
        try {
            // 1️⃣ Récupérer profile_type
            const { data: profileData, error: profileError } = await supabase_1.supabaseAdmin
                .from('profiles')
                .select('profile_type')
                .eq('id', result.userId)
                .single();
            if (!profileError && profileData && profileData.profile_type) {
                profileType = profileData.profile_type;
            }
            // 2️⃣ Si profile_type = 'utilisateur', récupérer user_type depuis table utilisateurs
            if (profileType === 'utilisateur') {
                const { data: userTypeData, error: userTypeError } = await supabase_1.supabaseAdmin
                    .from('utilisateurs')
                    .select('user_type')
                    .eq('id', result.userId)
                    .single();
                if (!userTypeError && userTypeData && userTypeData.user_type) {
                    userType = userTypeData.user_type;
                }
            }
        }
        catch (e) {
            request.log.warn({ err: e }, 'Failed to fetch profile data for login response');
        }
        // Retourner token + user avec profile_type ET user_type
        return reply.status(200).send({
            token: result.token,
            user: {
                id: result.userId,
                email: result.email ?? null,
                profile_type: profileType,
                user_type: userType,
            },
        });
    }
    catch (err) {
        request.log.error(err);
        reply.status(500).send({
            success: false,
            error: 'Internal server error',
        });
    }
};
exports.loginHandler = loginHandler;
// Simple in-memory rate limiter for check-email endpoint
const _checkEmailRate = new Map();
const CHECK_EMAIL_MAX = 10; // max requests
const CHECK_EMAIL_WINDOW = 60 * 1000; // window ms
/**
 * Handler pour vérifier l'existence d'un email dans la table `admis`.
 * POST /auth/check-email { email }
 */
const checkEmailHandler = async (request, reply) => {
    try {
        const ip = request.ip || request.raw.socket.remoteAddress || 'unknown';
        const now = Date.now();
        const entry = _checkEmailRate.get(ip);
        if (!entry || now - entry.first > CHECK_EMAIL_WINDOW) {
            _checkEmailRate.set(ip, { count: 1, first: now });
        }
        else {
            entry.count += 1;
            if (entry.count > CHECK_EMAIL_MAX) {
                request.log.warn({ ip, email: request.body?.email }, 'Rate limit exceeded for check-email');
                return reply.status(429).send({ error: 'Too many requests' });
            }
            _checkEmailRate.set(ip, entry);
        }
        const { email } = request.body;
        if (!email)
            return reply.status(400).send({ error: 'Email required' });
        // Preferred: query `profiles` table where emails are stored
        let data = null;
        let error = null;
        try {
            const r = await supabase_1.supabaseAdmin.from('profiles').select('id').eq('email', email).maybeSingle();
            data = r.data;
            error = r.error;
        }
        catch (e) {
            error = e;
        }
        // If profiles table not available, try legacy tables (`admis` or `admins`)
        if (error || !data) {
            try {
                const r2 = await supabase_1.supabaseAdmin.from('admis').select('id').eq('email', email).maybeSingle();
                data = r2.data;
                error = r2.error;
            }
            catch (e2) {
                error = e2;
            }
        }
        if (error && /Could not find the table 'public.admis'/.test(String(error?.message || error))) {
            try {
                const r3 = await supabase_1.supabaseAdmin.from('admins').select('id').eq('email', email).maybeSingle();
                data = r3.data;
                error = r3.error;
            }
            catch (e3) {
                error = e3;
            }
        }
        if (error) {
            request.log.error({ err: error, email }, 'Failed to query email tables');
            return reply.status(500).send({ error: 'Internal server error' });
        }
        const exists = !!(data && data.id);
        // Always return a generic shape; never leak extra details
        return reply.status(200).send({ exists });
    }
    catch (err) {
        request.log.error(err);
        return reply.status(500).send({ error: 'Internal server error' });
    }
};
exports.checkEmailHandler = checkEmailHandler;
/**
 * Handler de déconnexion utilisateur.
 */
const logoutHandler = async (_request, reply) => {
    reply.status(200).send({
        success: true,
        message: 'Logged out successfully',
    });
};
exports.logoutHandler = logoutHandler;
/**
 * Handler de mise à jour des informations de sécurité (mot de passe et email).
 */
const updateSecurityHandler = async (request, reply) => {
    try {
        const { current_password, new_password, new_email } = request.body;
        const userId = request.user?.id;
        if (!userId) {
            return reply.status(401).send({
                success: false,
                error: 'Utilisateur non authentifié'
            });
        }
        // Vérifier le mot de passe actuel
        const { data: userData, error: userError } = await supabase_1.supabaseAdmin.auth.admin.getUserById(userId);
        if (userError || !userData.user) {
            return reply.status(404).send({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }
        // Vérifier le mot de passe actuel en essayant de se connecter
        const { error: signInError } = await supabase_1.supabaseAdmin.auth.signInWithPassword({
            email: userData.user.email,
            password: current_password
        });
        if (signInError) {
            return reply.status(401).send({
                success: false,
                error: 'Mot de passe actuel incorrect'
            });
        }
        // Mettre à jour l'email si fourni
        if (new_email && new_email !== userData.user.email) {
            const { error: emailError } = await supabase_1.supabaseAdmin.auth.admin.updateUserById(userId, {
                email: new_email
            });
            if (emailError) {
                request.log.error({ err: emailError, userId }, 'Failed to update email');
                return reply.status(400).send({
                    success: false,
                    error: 'Erreur lors de la mise à jour de l\'email'
                });
            }
        }
        // Mettre à jour le mot de passe si fourni
        if (new_password) {
            const { error: passwordError } = await supabase_1.supabaseAdmin.auth.admin.updateUserById(userId, {
                password: new_password
            });
            if (passwordError) {
                request.log.error({ err: passwordError, userId }, 'Failed to update password');
                return reply.status(400).send({
                    success: false,
                    error: 'Erreur lors de la mise à jour du mot de passe'
                });
            }
        }
        reply.status(200).send({
            success: true,
            message: 'Informations de sécurité mises à jour avec succès'
        });
    }
    catch (error) {
        request.log.error(error);
        reply.status(500).send({
            success: false,
            error: 'Erreur interne du serveur'
        });
    }
};
exports.updateSecurityHandler = updateSecurityHandler;
