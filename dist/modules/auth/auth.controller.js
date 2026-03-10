"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutHandler = exports.checkEmailHandler = exports.loginHandler = exports.registerHandler = void 0;
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
