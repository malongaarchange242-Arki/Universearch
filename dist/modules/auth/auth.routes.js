"use strict";
/**
 * Auth routes
 * src/modules/auth/auth.routes.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const auth_controller_1 = require("./auth.controller");
const auth_schema_1 = require("./auth.schema");
const middleware_1 = require("../../middleware");
const authRoutes = async (app, _options) => {
    // Création compte
    app.post('/register', { schema: auth_schema_1.registerSchema }, auth_controller_1.registerHandler);
    // Connexion
    app.post('/login', { schema: auth_schema_1.loginSchema }, auth_controller_1.loginHandler);
    // Déconnexion (protégée)
    app.post('/logout', { preHandler: [middleware_1.authenticate] }, auth_controller_1.logoutHandler);
};
exports.authRoutes = authRoutes;
