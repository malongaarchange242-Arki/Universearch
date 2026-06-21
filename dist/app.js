"use strict";
// src/app.ts
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
const fastify_1 = __importDefault(require("fastify"));
const auth_routes_1 = require("./modules/auth/auth.routes");
const users_routes_1 = require("./modules/users/users.routes");
const admin_routes_1 = require("./modules/admin/admin.routes");
const universites_routes_1 = require("./modules/universites/universites.routes");
const centres_routes_1 = require("./modules/centres-formation/centres.routes");
const filieres_routes_1 = require("./modules/filieres/filieres.routes");
const bde_routes_1 = require("./modules/bde/bde.routes");
const representants_routes_1 = require("./modules/representants/representants.routes");
const followers_routes_1 = require("./modules/followers/followers.routes");
const supabase_1 = __importDefault(require("./plugins/supabase"));
const supabase_2 = require("./plugins/supabase");
/**
 * Instance principale de l'application Fastify.
 * Ce fichier ne démarre pas le serveur.
 * Il configure uniquement :
 *  - les plugins
 *  - les routes
 *  - les hooks globaux
 */
const app = (0, fastify_1.default)({
    logger: {
        level: process.env.LOG_LEVEL || 'info',
    },
});
// Normalize incoming URL: strip encoded spaces and simple whitespace, redirect to cleaned path
app.addHook('onRequest', (request, reply, done) => {
    try {
        const raw = (request.raw.url || '').toString();
        const cleaned = raw.replace(/%20/g, '').replace(/\s+/g, '');
        if (cleaned !== raw && cleaned.length > 0) {
            reply.redirect(301, cleaned);
            return;
        }
    }
    catch (err) {
        // noop - fall through to normal handling
    }
    done();
});
/**
 * Route de santé.
 * Utilisée par :
 *  - Docker
 *  - Kubernetes
 *  - monitoring
 */
app.get('/health', async () => {
    return {
        status: 'ok',
        service: 'identity-service',
        timestamp: new Date().toISOString(),
    };
});
// Accept POST /health as well for healthcheck clients that use POST
app.post('/health', async () => ({
    status: 'ok',
    service: 'identity-service',
    timestamp: new Date().toISOString(),
}));
// Explicitly handle HEAD requests so proxies and load-balancers receive 200 without body
app.head('/health', async (_request, reply) => {
    reply.status(200).send();
});
const resetPasswordPageHtml = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Reinitialiser le mot de passe | Universearch</title>
  <style>
    *{box-sizing:border-box}body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,Arial,sans-serif;background:#f8fafc;color:#0f172a}.card{width:100%;max-width:460px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 20px 35px rgba(15,23,42,.12);padding:34px}.brand{font-size:24px;font-weight:800;margin-bottom:22px}h1{font-size:24px;margin:0 0 8px}p{color:#64748b;line-height:1.5}.field{margin:18px 0;text-align:left}label{display:block;font-weight:700;font-size:14px;margin-bottom:8px}input{width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:13px 14px;font-size:15px}input:focus{outline:none;border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)}button{width:100%;border:0;border-radius:10px;background:#2563eb;color:#fff;padding:13px 16px;font-weight:800;font-size:15px;cursor:pointer}button:disabled{opacity:.65;cursor:not-allowed}.message{display:none;margin:16px 0;padding:12px 14px;border-radius:10px;font-size:14px}.error{display:block;background:#fee2e2;color:#991b1b}.success{display:block;background:#dcfce7;color:#166534}.link{display:block;margin-top:18px;text-align:center;color:#2563eb;text-decoration:none;font-weight:700}
  </style>
</head>
<body>
  <main class="card">
    <div class="brand">Universearch</div>
    <section id="formSection" style="display:none">
      <h1>Nouveau mot de passe</h1>
      <p>Choisissez un nouveau mot de passe pour votre compte.</p>
      <div id="message" class="message"></div>
      <form id="resetForm">
        <div class="field">
          <label for="password">Mot de passe</label>
          <input id="password" type="password" minlength="8" required autocomplete="new-password">
        </div>
        <div class="field">
          <label for="confirmPassword">Confirmer le mot de passe</label>
          <input id="confirmPassword" type="password" minlength="8" required autocomplete="new-password">
        </div>
        <button id="submitBtn" type="submit">Reinitialiser</button>
      </form>
    </section>
    <section id="errorSection" style="display:none">
      <h1>Lien invalide ou expire</h1>
      <p id="errorText">Demandez un nouveau lien depuis la page de connexion.</p>
      <a class="link" href="/">Retour</a>
    </section>
  </main>
  <script>
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = params.get('access_token') || params.get('token') || hash.get('access_token') || hash.get('token');
    const authError = params.get('error') || hash.get('error');
    const errorCode = params.get('error_code') || hash.get('error_code');
    const errorDescription = params.get('error_description') || hash.get('error_description');
    const formSection = document.getElementById('formSection');
    const errorSection = document.getElementById('errorSection');
    const errorText = document.getElementById('errorText');
    const message = document.getElementById('message');
    const showMessage = (text, type) => { message.textContent = text; message.className = 'message ' + type; };
    if (authError || errorCode || errorDescription || !token) {
      if (errorCode === 'otp_expired') errorText.textContent = 'Votre lien de reinitialisation a expire. Demandez un nouveau lien depuis la page de connexion.';
      else if (errorDescription) errorText.textContent = errorDescription;
      errorSection.style.display = 'block';
    } else {
      formSection.style.display = 'block';
    }
    document.getElementById('resetForm')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const button = document.getElementById('submitBtn');
      if (password !== confirmPassword) return showMessage('Les mots de passe ne correspondent pas.', 'error');
      if (password.length < 8) return showMessage('Le mot de passe doit contenir au moins 8 caracteres.', 'error');
      button.disabled = true;
      try {
        const res = await fetch('/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password })
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || json.message || 'Erreur lors de la reinitialisation.');
        showMessage('Mot de passe reinitialise avec succes.', 'success');
        event.target.reset();
      } catch (error) {
        showMessage(error.message || 'Une erreur est survenue.', 'error');
      } finally {
        button.disabled = false;
      }
    });
  </script>
</body>
</html>`;
app.get('/reset-password', async (_request, reply) => {
    reply.type('text/html; charset=utf-8').send(resetPasswordPageHtml);
});
app.get('/reset-password.html', async (_request, reply) => {
    reply.type('text/html; charset=utf-8').send(resetPasswordPageHtml);
});
// Plugins: supabase must be registered before other routes (depends on it)
// Lightweight CORS handling for Fastify v4 (avoid upgrading Fastify/plugin mismatch)
app.addHook('onRequest', (request, reply, done) => {
    reply.header('Access-Control-Allow-Origin', '*');
    // Allow PATCH for admin approval endpoints and other verbs used by the front-end
    reply.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-user-id');
    if (request.raw.method === 'OPTIONS') {
        reply.status(204).send();
        return;
    }
    done();
});
app.register(supabase_1.default);
// Expose top-level domain grouping endpoint for convenience
app.get('/domaines-with-filieres', async (req, reply) => {
    const { FilieresService } = await Promise.resolve().then(() => __importStar(require('./modules/filieres/filieres.service')));
    const { FilieresController } = await Promise.resolve().then(() => __importStar(require('./modules/filieres/filieres.controller')));
    const service = new FilieresService(supabase_2.supabaseAdmin);
    const controller = new FilieresController(service);
    return controller.listDomainesWithFilieres(req, reply);
});
// Register routes
app.register(auth_routes_1.authRoutes, { prefix: '/auth' });
app.register(users_routes_1.usersRoutes);
app.register(admin_routes_1.adminRoutes, { prefix: '/admin' });
app.register(universites_routes_1.universitesRoutes, { prefix: '/universites' });
app.register(centres_routes_1.centresRoutes, { prefix: '/centres' });
app.register(filieres_routes_1.filieresRoutes, { prefix: '/filieres' });
app.register(bde_routes_1.registerBdeRoutes);
app.register(representants_routes_1.registerRepresentantRoutes);
app.register(followers_routes_1.followersRoutes);
/**
 * Hook global pour gérer les erreurs non interceptées.
 * Garantit des réponses cohérentes.
 */
app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    reply.status(error.statusCode ?? 500).send({
        error: error.message ?? 'Internal Server Error',
    });
});
exports.default = app;
