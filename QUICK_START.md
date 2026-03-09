# 🚀 Quick Start - Système de Followers

## 5 étapes pour tester

### Étape 1 : Préparer la base de données
```bash
# Exécutez le SQL de migration dans Supabase SQL Editor
# Copy/paste le contenu de:
# services/identity-service/db/migrations/003_create_followers_tables.sql
```

### Étape 2 : Démarrer le backend
```bash
cd services/identity-service
npm install  # Si jamais
npm run dev
# Devrait afficher: "Identity Service running on 0.0.0.0:3001"
```

### Étape 3 : Ouvrir la page dans le navigateur
```
file:///D:/UNIVERSEARCH BACKEND/Frontend/universites.html
# ou
file:///D:/UNIVERSEARCH BACKEND/Frontend/centres-formation.html
```

### Étape 4 : Se connecter (optionnel mais recommandé)
- Les universités/centres s'affichent immédiatement
- Pour une meilleure expérience, connectez-vous d'abord:
  - Allez à `index.html` (page de login)
  - Entrez vos identifiants
  - Retournez à la page des universités/centres

### Étape 5 : Tester le bouton "Suivre"
- Cliquez sur n'importe quel bouton "Suivre"
- Le bouton passera au vert avec ✓ "Suivi"
- C'est enregistré en base de données si authentifié, sinon en localStorage

---

## 🔗 URLs importantes

| Page | URL |
|------|-----|
| Login | `file:///.../Frontend/index.html` |
| Universités | `file:///.../Frontend/universites.html` |
| Centres | `file:///.../Frontend/centres-formation.html` |
| API | `http://localhost:3001` |

---

## 🖱️ Cas d'usage

### Utilisateur non authentifié
```
Se rend sur universites.html
  ↓
Les universités se chargent depuis l'API publique
  ↓
Clique "Suivre"
  ↓
Sauvegarde locale dans localStorage
  ↓
Bouton devient vert "Suivi"
```

### Utilisateur authentifié
```
Se connecte via login.html
  ↓
Token stocké dans localStorage
  ↓
Se rend sur universites.html
  ↓
Récupère les universités publiques + ses mises en suivi personnelles depuis l'API
  ↓
Clique "Suivre"
  ↓
Appelle l'API POST /universites/:id/follow
  ↓
Sauvegarde en base de données Supabase
  ↓
Bouton devient vert "Suivi"
```

---

## 🧐 Vérifier que ça marche

### Dans le navigateur (Dev Tools - Console)

```javascript
// 1. Vérifier que le token existe
localStorage.getItem('auth_token')
// Retourne: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// 2. Vérifier que les universités sont chargées
console.log(universities)
// Retourne un array d'universités

// 3. Vérifier que les mises en suivi sont chargées
console.log(followedUniversities)
// Retourne: ["uuid-1", "uuid-2", ...] ou []

// 4. Tester un appel API
fetch('http://localhost:3001/universites', { 
    method: 'GET' 
}).then(r => r.json()).then(console.log)
// Retourne la liste des universités
```

### Vérifier les données en base

```sql
-- Dans Supabase SQL Editor
SELECT * FROM followers_universites;
SELECT * FROM followers_centres_formation;
```

---

## 🔴 Problèmes courants et solutions

| Problème | Solution |
|----------|----------|
| "Erreur de chargement" | Vérifiez que le terminal identity-service affiche "running on 0.0.0.0:3001" |
| Followers non sauvegardés | Vérifiez que la migration SQL a été appliquée |
| 401 Unauthorized | Reconnectez-vous, votre token a peut-être expiré |
| Bouton "Suivre" ne change pas | Actualisez la page (F5) |
| API returns "not found" | Vérifiez que c'est une université APPROVED |

---

## 📊 Structure des fichiers créés

```
identity-service/
├── db/migrations/
│   └── 003_create_followers_tables.sql
│       ├──  followers_universites table
│       └──  followers_centres_formation table
│
├── src/modules/followers/
│   ├── followers.service.ts (logique métier)
│   ├── followers.controller.ts (gestion requests)
│   └── followers.routes.ts (endpoints)
│
├── FOLLOWERS_API_GUIDE.md (doc API complète)
├── IMPLEMENTATION_SUMMARY.md (résumé détaillé)
└── QUICK_START.md (ce fichier!)

Frontend/
├── universites.html (affiche + suivi universités)
└── centres-formation.html (affiche + suivi centres)
```

---

## 🔧 Endpoints clés

```bash
# Suivre une université
POST /universites/:id/follow

# Arrêter de suivre
DELETE /universites/:id/follow

# Mes universités suivies
GET /universites/me/followed

# Nombre public de followers
GET /universites/:id/followers/count

# Même chose pour les centres avec /centres
```

Tous les endpoints commencent par `http://localhost:3001`

---

## 💡 Tips

- **Redirection automatique** : Le navigateur détecte si vous êtes authentifié et charge les données appropriées
- **Pas de refresh nécessaire** : Les changements s'affichent immédiatement sans F5
- **Pas de limite** : Suivez autant d'institutions que vous le souhaitez
- **Navigation facile** : Navigation entre universités ↔ centres en haut de la page

---

## 🎓 Prochains tutoriels

Pour aller plus loin :
- Comment ajouter des recommandations basées sur les mises en suivi
- Comment créer des notifications pour les institutions suivies
- Comment exporter la liste des universités suivies en PDF/CSV

---

**Happy following! 👋**

Questions? Consultez `FOLLOWERS_API_GUIDE.md` ou `IMPLEMENTATION_SUMMARY.md`.
