"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutHandler = exports.loginHandler = exports.registerHandler = void 0;
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
 */
const loginHandler = async (request, reply) => {
    try {
        const { email, password } = request.body;
        // Connexion via Supabase
        const { data, error } = await supabase_1.supabaseAdmin.auth.signInWithPassword({
            email,
            password,
        });
        if (error || !data.user) {
            request.log.warn({ err: error }, 'Login failed for email');
            return reply.status(401).send({
                success: false,
                error: error?.message || 'Invalid credentials',
                details: error ?? null,
            });
        }
        // Attempt to fetch profile to determine profile_type (universite / centre_formation)
        let role = null;
        try {
            const { data: profileData, error: profileError } = await supabase_1.supabaseAdmin
                .from('profiles')
                .select('profile_type')
                .eq('id', data.user.id)
                .single();
            if (!profileError && profileData && profileData.profile_type) {
                const pt = profileData.profile_type;
                if (pt === 'universite')
                    role = 'UNIVERSITE';
                else if (pt === 'centre_formation')
                    role = 'CENTRE';
            }
        }
        catch (e) {
            request.log.warn({ err: e }, 'Failed to fetch profile for login response');
        }
        // Standardized response: token + user object with role for frontend routing
        return reply.status(200).send({
            token: data.session?.access_token ?? null,
            user: {
                id: data.user.id,
                email: data.user.email ?? null,
                role: role ?? null,
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
