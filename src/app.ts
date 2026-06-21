// src/app.ts

import Fastify, {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
} from 'fastify';
import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/users/users.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { universitesRoutes } from './modules/universites/universites.routes';
import { centresRoutes } from './modules/centres-formation/centres.routes';
import { filieresRoutes } from './modules/filieres/filieres.routes';
import { registerBdeRoutes } from './modules/bde/bde.routes';
import { registerRepresentantRoutes } from './modules/representants/representants.routes';
import { followersRoutes } from './modules/followers/followers.routes';
import supabasePlugin from './plugins/supabase';
import { supabaseAdmin } from './plugins/supabase';

/**
 * Instance principale de l'application Fastify.
 * Ce fichier ne démarre pas le serveur.
 * Il configure uniquement :
 *  - les plugins
 *  - les routes
 *  - les hooks globaux
 */

const app: FastifyInstance = Fastify({
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
  } catch (err) {
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

app.register(supabasePlugin as any);

// Expose top-level domain grouping endpoint for convenience
app.get('/domaines-with-filieres', async (req, reply) => {
  const { FilieresService } = await import('./modules/filieres/filieres.service');
  const { FilieresController } = await import('./modules/filieres/filieres.controller');
  const service = new FilieresService(supabaseAdmin as any);
  const controller = new FilieresController(service as any);
  return controller.listDomainesWithFilieres(req as any, reply as any);
});

// Register routes
app.register(authRoutes, { prefix: '/auth' });
app.register(usersRoutes as any);
app.register(adminRoutes, { prefix: '/admin' });
app.register(universitesRoutes, { prefix: '/universites' });
app.register(centresRoutes, { prefix: '/centres' });
app.register(filieresRoutes, { prefix: '/filieres' });
app.register(registerBdeRoutes as any);
app.register(registerRepresentantRoutes as any);
app.register(followersRoutes);

/**
 * Hook global pour gérer les erreurs non interceptées.
 * Garantit des réponses cohérentes.
 */
app.setErrorHandler(
  (
    error: Error & { statusCode?: number },
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    request.log.error(error);

    reply.status(error.statusCode ?? 500).send({
      error: error.message ?? 'Internal Server Error',
    });
  }
);

export default app;
