# BDE & Representants Modules - Documentation

## 📋 Vue d'ensemble

Deux nouveaux modules pour gérer les organisations secondaires :

### 1. **Module BDE** (Bureau des Étudiants)
- **Qui** : Universités uniquement
- **Quoi** : Bureau des étudiants (1 par université)
- **Lien** : Lié à la profile de l'université

### 2. **Module Representants**
- **Qui** : Centres de formation uniquement
- **Quoi** : Représentants multiples (directeur, manager, etc.)
- **Lien** : Lié à la profile du centre

---

## 📁 Arborescence des fichiers créés

```
services/identity-service/
├── src/modules/
│   ├── bde/
│   │   ├── bde.schema.ts        # Validation Fastify
│   │   ├── bde.service.ts        # Logique métier
│   │   ├── bde.controller.ts     # Gestionnaires de routes
│   │   └── bde.routes.ts         # Enregistrement des routes
│   │
│   └── representants/
│       ├── representants.schema.ts       # Validation Fastify
│       ├── representants.service.ts      # Logique métier
│       ├── representants.controller.ts   # Gestionnaires de routes
│       └── representants.routes.ts       # Enregistrement des routes
│
├── db/migrations/
│   └── 003_add_bde_and_representants.sql  # Tables Supabase
│
├── INTEGRATION_GUIDE.md   # Guide d'intégration
└── BDE_REPRESENTANTS_USAGE.md  # Ce fichier
```

---

## 🗄️ Schéma des tables

### Table: `bde`
```sql
id                UUID (PK)
universite_id     UUID (unique) -- Une university = un BDE
profile_id        UUID -- Lien vers le profile de l'université
nom               TEXT -- Nom du BDE
description       TEXT -- Description
logo_url          TEXT -- URL du logo
video_url         TEXT -- URL de la vidéo
statut            VARCHAR(20) -- 'actif', 'inactif', 'suspendu'
date_creation     TIMESTAMP
date_modification TIMESTAMP
```

### Table: `representants`
```sql
id                UUID (PK)
centre_id         UUID -- Référence au centre (pas UNIQUE)
profile_id        UUID -- Lien vers le profile du centre
fonction          TEXT -- Fonction/Rôle
statut            VARCHAR(20) -- 'actif', 'inactif', 'suspendu'
date_creation     TIMESTAMP
date_modification TIMESTAMP
```

---

## 🔐 Règles d'autorisation

### BDE
| Action | Requirement | Rule |
|--------|-------------|------|
| CREATE | Authenticated | Must be `profile_type = 'universite'` |
| READ | Public | No auth required |
| UPDATE | Authenticated | Must own the BDE (profile_id match) |
| DELETE | Authenticated | Must own the BDE (profile_id match) |

### Representants
| Action | Requirement | Rule |
|--------|-------------|------|
| CREATE | Authenticated | Must be `profile_type = 'centre' or 'centre_formation'` |
| READ | Public | No auth required |
| UPDATE | Authenticated | Must own the representant (profile_id match) |
| DELETE | Authenticated | Must own the representant (profile_id match) |

---

## 🛣️ Routes API

### BDE Routes

```
POST   /universites/bde                      Create BDE
GET    /universites/:universite_id/bde       Get BDE by university
GET    /bde/:id                              Get BDE by ID
PUT    /bde/:id                              Update BDE
DELETE /bde/:id                              Delete BDE
```

### Representants Routes

```
POST   /centres/representants                 Create representant
GET    /centres/:centre_id/representants      Get all representants
GET    /representants/:id                     Get representant by ID
PUT    /representants/:id                     Update representant
DELETE /representants/:id                     Delete representant
```

---

## 💻 Exemples d'utilisation

### 1. Créer un BDE

```bash
curl -X POST http://localhost:3001/universites/bde \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Bureau des Étudiants ECES",
    "description": "Bureau représentant les étudiants",
    "logo_url": "https://example.com/logo.png",
    "video_url": "https://example.com/video.mp4",
    "universite_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Réponse (201)**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "universite_id": "550e8400-e29b-41d4-a716-446655440000",
    "profile_id": "550e8400-e29b-41d4-a716-446655440000",
    "nom": "Bureau des Étudiants ECES",
    "description": "Bureau représentant les étudiants",
    "logo_url": "https://example.com/logo.png",
    "video_url": "https://example.com/video.mp4",
    "statut": "actif",
    "date_creation": "2026-02-23T10:00:00.000Z"
  }
}
```

---

### 2. Récupérer un BDE par université

```bash
curl http://localhost:3001/universites/550e8400-e29b-41d4-a716-446655440000/bde
```

**Réponse (200)**
```json
{
  "success": true,
  "data": { ... BDE data ... }
}
```

---

### 3. Créer un représentant

```bash
curl -X POST http://localhost:3001/centres/representants \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fonction": "Directeur",
    "centre_id": "770e8400-e29b-41d4-a716-446655440002"
  }'
```

**Réponse (201)**
```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "centre_id": "770e8400-e29b-41d4-a716-446655440002",
    "profile_id": "770e8400-e29b-41d4-a716-446655440002",
    "fonction": "Directeur",
    "statut": "actif",
    "date_creation": "2026-02-23T10:00:00.000Z"
  }
}
```

---

### 4. Récupérer tous les représentants d'un centre

```bash
curl http://localhost:3001/centres/770e8400-e29b-41d4-a716-446655440002/representants
```

**Réponse (200)**
```json
{
  "success": true,
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "fonction": "Directeur",
      ...
    },
    {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "fonction": "Manager",
      ...
    }
  ]
}
```

---

### 5. Mettre à jour un BDE

```bash
curl -X PUT http://localhost:3001/bde/660e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Nouveau nom du BDE",
    "statut": "actif"
  }'
```

---

### 6. Supprimer un BDE

```bash
curl -X DELETE http://localhost:3001/bde/660e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer <token>"
```

**Réponse (200)**
```json
{
  "success": true,
  "message": "BDE deleted successfully"
}
```

---

## ⚠️ Erreurs courantes

### 403 Forbidden - Non-university user creates BDE
```json
{
  "success": false,
  "error": "Only universities can create a BDE"
}
```

### 403 Forbidden - User tries to update BDE they don't own
```json
{
  "success": false,
  "error": "You do not have permission to update this BDE"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "BDE not found"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

---

## 🔧 Architecture

### Workflow complet (BDE)

1. **User authentification** → JWT token
2. **POST /universites/bde** avec token
3. **Middleware authenticate** vérifie JWT
4. **BdeController.createBde()** vérifie `profile_type = 'universite'`
5. **BdeService.createBde()** insère dans Supabase
6. **Supabase** crée une row dans table `bde`
7. **Response 201** avec données créées

### Validations

- **Schema (Fastify)** : Valide les types, formats UUID, strings min/max length
- **Controller** : Vérifie authentification et autorisation
- **Service** : Valide la logique métier (ex: une université = un BDE)

---

## 📊 Évolutivité multi-organisation

Les tables incluent une étiquette d'organisation (`universite_id` ou `centre_id`) :

- **Filtrage facile** : `WHERE universite_id = '...'`
- **Indexation** : Index sur `universite_id`, `centre_id`, `profile_id`, `statut`
- **Scalabilité** : Support pour millions d'organisations

---

## ⚡ Performance

- **Indexes** : Créés pour toutes les colonnes fréquemment filtrées
- **Connection pooling** : Supabase JS client gère automatiquement
- **Lazy loading** : Service ne charge que les champs demandés
- **Soft deletes** : Status = 'inactif' (plus efficace que DELETE physique)

---

## 🚀 Prochaines étapes

1. **Exécuter migration SQL** :
   ```bash
   psql -d <database_url> -f db/migrations/003_add_bde_and_representants.sql
   ```

2. **Importer routes dans `src/app.ts`** :
   ```typescript
   import { registerBdeRoutes } from './modules/bde/bde.routes';
   import { registerRepresentantRoutes } from './modules/representants/representants.routes';
   
   await registerBdeRoutes(fastify, supabaseClient);
   await registerRepresentantRoutes(fastify, supabaseClient);
   ```

3. **Tester les endpoints** avec Postman/curl

4. **Intégrer le frontend** à l'API (comme montré dans `INTEGRATION_GUIDE.md`)

---

## 📝 Notes

- `profile_id` = ID du profile universitaire/centre (utilisé pour l'autorisation)
- `universite_id` / `centre_id` = ID de l'organisation (utilisé pour le filtrage)
- Statuts : `actif` (visible), `inactif` (soft delete), `suspendu` (temporaire)
- Soft deletes : Changez `statut` à `inactif` au lieu de DELETE physique

---

## 🤝 Support

Pour des questions :
1. Consulter `INTEGRATION_GUIDE.md` pour les exemples d'endpoints
2. Vérifier les schemas dans `*.schema.ts` pour validation
3. Consulter les services pour la logique métier

