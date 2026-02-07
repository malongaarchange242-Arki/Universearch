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
            return reply.status(401).send({
                success: false,
                error: 'Invalid credentials',
            });
        }
        reply.send({
            success: true,
            data: {
                userId: data.user.id,
                email: data.user.email,
                token: data.session?.access_token, // si JWT
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
