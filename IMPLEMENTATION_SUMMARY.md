# Implémentation complète du système de followers pour universités et centres de formation

## 📋 Résumé

J'ai créé un système complet permettant aux utilisateurs de suivre (follow) les universités et les centres de formation. Voici ce qui a été implémenté :

---

## 🔧 Composants Backend

### 1. **Migration SQL** (docs/migrations/003_create_followers_tables.sql)
Créé deux tables dans la base de données Supabase :
- `followers_universites` - Table pour stocker les mises en suivi des universités
- `followers_centres_formation` - Table pour stocker les mises en suivi des centres

#### Schéma des tables :
```sql
followers_universites:
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key -> profiles)
- universite_id (UUID, Foreign Key -> universites)
- date_follow (timestamp)
- UNIQUE(user_id, universite_id) - Un utilisateur ne peut suivre qu'une fois

followers_centres_formation:
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key -> profiles)
- centre_id (UUID, Foreign Key -> centres_formation)
- date_follow (timestamp)
- UNIQUE(user_id, centre_id) - Un utilisateur ne peut suivre qu'une fois
```

### 2. **Service** (src/modules/followers/followers.service.ts)
Classe `FollowersService` avec les méthodes suivantes :

#### Pour les universités :
- `followUniversite(userId, universiteId)` - Suivre une université
- `unfollowUniversite(userId, universiteId)` - Arrêter de suivre
- `getFollowedUniversites(userId)` - Récupérer mes universités suivies
- `isFollowingUniversite(userId, universiteId)` - Vérifier le statut
- `countUniversiteFollowers(universiteId)` - Compter les followers

#### Pour les centres :
- `followCentre(userId, centreId)` - Suivre un centre
- `unfollowCentre(userId, centreId)` - Arrêter de suivre
- `getFollowedCentres(userId)` - Récupérer mes centres suivis
- `isFollowingCentre(userId, centreId)` - Vérifier le statut
- `countCentreFollowers(centreId)` - Compter les followers

### 3. **Controller** (src/modules/followers/followers.controller.ts)
Classe `FollowersController` gérant les requêtes HTTP pour tous les endpoints.

### 4. **Routes** (src/modules/followers/followers.routes.ts)
Endpoints REST exposés :

#### Routes publiques (sans authentification):
- `GET /universites/:id/followers/count` - Nombre de followers d'une université
- `GET /centres/:id/followers/count` - Nombre de followers d'un centre

#### Routes protégées (authentification requise):
- `POST /universites/:id/follow` - Suivre une université
- `DELETE /universites/:id/follow` - Arrêter de suivre une université
- `GET /universites/me/followed` - Mes universités suivies
- `POST /centres/:id/follow` - Suivre un centre
- `DELETE /centres/:id/follow` - Arrêter de suivre un centre
- `GET /centres/me/followed` - Mes centres suivis

---

## 🎨 Composants Frontend

### 1. **Page Universités** (Frontend/universites.html)
Affiche une grille de toutes les universités approuvées avec :
- Logo de l'université
- Nom et description
- Lien vers le site officiel
- Année de fondation et statut d'approbation
- **Bouton "Suivre"** interactif

### 2. **Page Centres de Formation** (Frontend/centres-formation.html)
Même layout que la page universités, adapté pour les centres de formation.

### 3. **Fonctionnalités Frontend**
- **Authentification automatique** : Récupère le token depuis localStorage
- **Synchronisation avec le serveur** : 
  - Charge d'abord les données publiques
  - Puis authentifie et récupère les suivis personnels
- **Fallback localStorage** : Si pas authentifié, sauvegarde localement
- **Bouton "Suivre" intelligent** :
  - Change de couleur et d'icône selon le statut
  - Appelle l'API backend si authentifié
  - Utilise localStorage sinon
- **Recherche en temps réel** : Filtre par nom, description, domaine

### 4. **Gestion de l'authentification**
```javascript
const userToken = localStorage.getItem('auth_token');

// Pour les requêtes authentifiées:
async function authenticatedFetch(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(userToken && { 'Authorization': `Bearer ${userToken}` }),
        ...options.headers,
    };
    return fetch(url, { ...options, headers });
}
```

---

## 📊 Architecture complète

```
Frontend/
├── universites.html              ← Page d'affichage des universités
├── centres-formation.html        ← Page d'affichage des centres
└── [auth_token stocké dans localStorage]

Backend (identity-service)/
├── db/
│   └── migrations/
│       └── 003_create_followers_tables.sql       ← Schéma DB
├── src/modules/followers/
│   ├── followers.service.ts                      ← Logique métier
│   ├── followers.controller.ts                   ← Gestion HTTP
│   ├── followers.routes.ts                       ← Endpoints
├── src/
│   └── app.ts                                    ← Enregistrement des routes
└── FOLLOWERS_API_GUIDE.md                        ← Documentation API
```

---

## 🚀 Guide d'utilisation

### Pour le développeur / test :

#### 1. Appliquer la migration SQL

```bash
# Option 1: Avec Supabase CLI
cd services/identity-service
supabase db push

# Option 2: Exécuter manuellement dans Supabase SQL Editor
-- Copier le contenu de db/migrations/003_create_followers_tables.sql
```

#### 2. Démarrer le serveur identity-service

```bash
cd services/identity-service
npm install
npm run dev
# Server runs on http://localhost:3001
```

#### 3. Ouvrir les pages dans le navigateur

- **Universités**: `file:///path/to/Frontend/universites.html`
- **Centres**: `file:///path/to/Frontend/centres-formation.html`

### Pour l'utilisateur final :

1. **Se connecter** sur la page d'accueil (login.html)
   - Le token d'authentification est stocké dans `localStorage`

2. **Naviguer vers les universités ou centres**
   - Voir les cartes des institutions

3. **Cliquer sur "Suivre"**
   - Si authentifié : Sauvegarde en base de données
   - Si non-authentifié : Sauvegarde en localStorage

4. **Consulter les mises en suivi**
   - Les boutons changent de couleur
   - Affichent ✓ "Suivi" en vert

---

## 🔒 Sécurité & Validations

1. **Authentification requise** pour les endpoints de write/read personnels
2. **Vérification d'approbation** : Seules les institutions APPROVED peuvent être suivies
3. **Contrainte d'unicité** : Un utilisateur ne peut suivre l'institution qu'une seule fois (silencieusement ignoré si tentative de doublon)
4. **CMS (cascade) sur suppression** : Les followers sont supprimés si l'utilisateur ou l'institution est supprimé

---

## 📝 API Endpoints - Résumé rapide

```bash
# Suivre une université (authentifié)
POST /universites/:id/follow
Authorization: Bearer <token>

# Arrêter de suivre
DELETE /universites/:id/follow
Authorization: Bearer <token>

# Mes universités suivies (authentifié)
GET /universites/me/followed
Authorization: Bearer <token>

# Nombre de followers d'une université (public)
GET /universites/:id/followers/count

# Même pattern pour les centres avec /centres au lieu de /universites-formation
```

Voir [FOLLOWERS_API_GUIDE.md](services/identity-service/FOLLOWERS_API_GUIDE.md) pour la documentation complète.

---

## 🧪 Test manuel

### Avec cURL (depuis terminal)

```bash
# 1. Se connecter pour obtenir un token
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password"}'

# 2. Suivre une université (remplacer TOKEN et UNI_ID)
curl -X POST http://localhost:3001/universites/{UNI_ID}/follow \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"

# 3. Récupérer mes universités suivies
curl -X GET http://localhost:3001/universites/me/followed \
  -H "Authorization: Bearer TOKEN"

# 4. Obtenir le nombre de followers publiquement
curl -X GET http://localhost:3001/universites/{UNI_ID}/followers/count
```

### Avec JavaScript (dans le navigateur)

```javascript
// Login et récupérer le token
const loginRes = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@test.com', password: 'pwd' })
});
const { token } = await loginRes.json();
localStorage.setItem('auth_token', token);

// Suivre une université
const followRes = await fetch('http://localhost:3001/universites/{ID}/follow', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
});

// Récupérer mes mises en suivi
const meRes = await fetch('http://localhost:3001/universites/me/followed', {
    headers: { 'Authorization': `Bearer ${token}` }
});
const data = await meRes.json();
console.log(data.data); // Liste de mes universités suivies
```

---

## 📚 Fichiers créés/modifiés

### Créés :
- ✅ `services/identity-service/db/migrations/003_create_followers_tables.sql`
- ✅ `services/identity-service/src/modules/followers/followers.service.ts`
- ✅ `services/identity-service/src/modules/followers/followers.controller.ts`
- ✅ `services/identity-service/src/modules/followers/followers.routes.ts`
- ✅ `services/identity-service/FOLLOWERS_API_GUIDE.md`
- ✅ `Frontend/centres-formation.html`

### Modifiés :
- ✅ `services/identity-service/src/app.ts` - Enregistrement des routes followers
- ✅ `Frontend/universites.html` - Intégration de l'authentification et des appels API

---

## 🎯 Prochaines étapes optionnelles

1. **Suggestions** : Recommander des universités/centres basées sur les mises en suivi
2. **Notifications** : Notifier quand une institution suivie poste du contenu
3. **Analytics** : Tracker quels universités/centres sont les plus populaires
4. **Export** : Permettre aux utilisateurs d'exporter leur liste de mises en suivi
5. **Bulk operations** : Suivre plusieurs institutions à la fois

---

## 🐛 Troubleshooting

### "Erreur de chargement: Impossible de charger les universités"
- Vérifiez que le serveur identity-service est en cours d'exécution (port 3001)
- Vérifiez les logs du terminal pour les erreurs Fastify

### "Erreur 401: Unauthorized"
- Le token n'est pas envoyé correctement
- Vérifiez que `localStorage.getItem('auth_token')` retourne une valeur
- Reconnectez-vous via la page de login

### "Université not found or not approved"
- L'universié doit être en statut APPROVED en base de données
- Vérifiez avec : `SELECT id, nom, statut FROM universites WHERE statut = 'APPROVED';`

### Migrations non appliquées
- Exécutez manuellement le SQL dans Supabase SQL Editor
- Ou utilisez `supabase db push` si Supabase CLI est configuré

---

## 📞 Questions fréquentes

**Q: Peut-on supprimer un follow ?**
A: Oui, utiliser `DELETE /universites/:id/follow`

**Q: Les données de suivi sont-elles synchronisées ?**
A: Oui, si authentifié, elles sont sauvegardées en base de données Supabase. Sinon, localStorage.

**Q: Combien de université chaque utilisateur peut-il suivre ?**
A: Tant qu'il le souhaite. Aucune limite.

**Q: Les données de suivi sont-elles visibles publiquement ?**
A: Non. Seul l'utilisateur peut voir sa propre liste de mises en suivi. Seul le comte public est visible.

