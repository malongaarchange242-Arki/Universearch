# 📱 API Endpoints Documentation - Flutter App

## Base URL
```
https://universearch-9qle.onrender.com
```


## 🏫 UNIVERSITÉS ENDPOINTS

### 1. Get All Universities (Public)
**GET** `/universites`

**Description:** Récupère la liste de toutes les universités approuvées

**Parameters:** 
- `limit` (query, optional): Nombre max d'universités (default: 20)
- `offset` (query, optional): Pour la pagination (default: 0)

**Example Request:**
```
GET https://universearch-9qle.onrender.com/universites?limit=20&offset=0
```

**Response: 200 OK**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nom": "Université Félix Houphouët-Boigny",
    "description": "Première université de Côte d'Ivoire, établie en 1964. Excellence académique et recherche de pointe.",
    "email": "contact@ufhb.ci",
    "lien_site": "https://www.ufhb.edu.ci",
    "logo_url": "https://storage.example.com/logos/ufhb.png",
    "couverture_logo_url": "https://storage.example.com/covers/ufhb.jpg",
    "domaine": "Généraliste",
    "statut": "APPROVED",
    "video_url": null,
    "date_creation": "2025-01-15T00:00:00Z",
    "profile_id": "550e8400-e29b-41d4-a716-446655440001",
    "sigle": "UFHB",
    "annee_fondation": 1964
  },
  
]
```

**Error Responses:**
- `500 Internal Server Error` - Erreur serveur


### 2. Get University by ID (Public)
**GET** `/universites/:id`

**Description:** Récupère les détails d'une université spécifique

**Parameters:**
- `id` (path, required): UUID de l'université

**Example Request:**
```
GET https://universearch-9qle.onrender.com/universites/550e8400-e29b-41d4-a716-446655440000
```

**Response: 200 OK**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nom": "Université Félix Houphouët-Boigny",
  "description": "Première université de Côte d'Ivoire, établie en 1964. Excellence académique et recherche de pointe.",
  "email": "contact@ufhb.ci",
  "lien_site": "https://www.ufhb.edu.ci",
  "logo_url": "https://storage.example.com/logos/ufhb.png",
  "couverture_logo_url": "https://storage.example.com/covers/ufhb.jpg",
  "domaine": "Généraliste",
  "statut": "APPROVED",
  "video_url": null,
  "date_creation": "2025-01-15T00:00:00Z",
  "profile_id": "550e8400-e29b-41d4-a716-446655440001",
  "sigle": "UFHB",
  "annee_fondation": 1964
}
```

**Error Responses:**
- `404 Not Found` - Université non trouvée
- `500 Internal Server Error` - Erreur serveur

---

### 3. Get University Followers Count (Public)
**GET** `/universites/:id/followers/count`

**Description:** Récupère le nombre de followers d'une université

**Parameters:**
- `id` (path, required): UUID de l'université

**Example Request:**
```
GET https://universearch-9qle.onrender.com/universites/550e8400-e29b-41d4-a716-446655440000/followers/count
```

**Response: 200 OK**
```json
{
  "universiteId": "550e8400-e29b-41d4-a716-446655440000",
  "followerCount": 42
}
```

**Error Responses:**
- `500 Internal Server Error` - Erreur serveur

---

### 4. Follow University (Authenticated)
**POST** `/universites/:id/follow`

**Description:** Permet à un utilisateur authentifié de suivre une université

**Auth Required:** ✅ Yes - Bearer Token

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Parameters:**
- `id` (path, required): UUID de l'université

**Example Request:**
```
POST https://universearch-9qle.onrender.com/universites/550e8400-e29b-41d4-a716-446655440000/follow

**Response: 201 Created**
```json
{
  "message": "Successfully followed université",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "user_id": "770e8400-e29b-41d4-a716-446655440000",
    "universite_id": "550e8400-e29b-41d4-a716-446655440000",
    "date_follow": "2026-03-09T10:30:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Université non trouvée ou non approuvée
- `401 Unauthorized` - Token manquant ou invalide
- `500 Internal Server Error` - Erreur serveur

---

### 5. Unfollow University (Authenticated)
**DELETE** `/universites/:id/follow`

**Description:** Arrêter de suivre une université

**Auth Required:** ✅ Yes - Bearer Token

**Headers:**
```
Authorization: Bearer {token}
```

**Parameters:**
- `id` (path, required): UUID de l'université

**Example Request:**
```
DELETE https://universearch-9qle.onrender.com/universites/550e8400-e29b-41d4-a716-446655440000/follow
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response: 200 OK**
```json
{
  "message": "Successfully unfollowed université"
}
```

**Error Responses:**
- `400 Bad Request` - Erreur lors de la suppression
- `401 Unauthorized` - Token manquant ou invalide
- `500 Internal Server Error` - Erreur serveur

---

### 6. Get My Followed Universities (Authenticated)
**GET** `/universites/me/followed`

**Description:** Récupère toutes les universités suivies par l'utilisateur

**Auth Required:** ✅ Yes - Bearer Token

**Headers:**
```
Authorization: Bearer {token}
```

**Example Request:**
```
GET https://universearch-9qle.onrender.com/universites/me/followed
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response: 200 OK**
```json
{
  "data": [
    {
      "followId": "660e8400-e29b-41d4-a716-446655440000",
      "dateFollow": "2026-03-09T10:30:00Z",
      "universite": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "nom": "Université Félix Houphouët-Boigny",
        "description": "Première université de Côte d'Ivoire...",
        "logo_url": "https://storage.example.com/logos/ufhb.png",
        "lien_site": "https://www.ufhb.edu.ci",
        "email": "contact@ufhb.ci",
        "statut": "APPROVED",
        "date_creation": "2025-01-15T00:00:00Z"
      }
    },
    
  ],
  "count": 2
}
```

**Error Responses:**
- `401 Unauthorized` - Token manquant ou invalide
- `500 Internal Server Error` - Erreur serveur

---

## 🏢 CENTRES DE FORMATION ENDPOINTS

### 1. Get All Training Centers (Public)
**GET** `/centres`

**Description:** Récupère la liste de tous les centres de formation approuvés

**Parameters:** 
- `limit` (query, optional): Nombre max de centres (default: 20)
- `offset` (query, optional): Pour la pagination (default: 0)

**Example Request:**
```
GET https://universearch-9qle.onrender.com/centres?limit=20&offset=0
```

**Response: 200 OK**
```json
[
  {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "nom": "Centre de Formation Professionnel - CFPI",
    "description": "Centre spécialisé en formation professionnelle continue et développement de compétences.",
    "email": "contact@cfpi.ci",
    "lien_site": "https://www.cfpi.ci",
    "logo_url": "https://storage.example.com/logos/cfpi.png",
    "couverture_logo_url": "https://storage.example.com/covers/cfpi.jpg",
    "domaine": "Formation Professionnelle",
    "statut": "APPROVED",
    "video_url": null,
    "date_creation": "2025-03-01T00:00:00Z",
    "profile_id": "880e8400-e29b-41d4-a716-446655440001"
  },
  
]
```


### 2. Get Training Center by ID (Public)
**GET** `/centres/:id`

**Description:** Récupère les détails d'un centre de formation spécifique

**Parameters:**
- `id` (path, required): UUID du centre

**Example Request:**
```
GET https://universearch-9qle.onrender.com/centres/880e8400-e29b-41d4-a716-446655440000
```

**Response: 200 OK**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440000",
  "nom": "Centre de Formation Professionnel - CFPI",
  "description": "Centre spécialisé en formation professionnelle continue et développement de compétences.",
  "email": "contact@cfpi.ci",
  "lien_site": "https://www.cfpi.ci",
  "logo_url": "https://storage.example.com/logos/cfpi.png",
  "couverture_logo_url": "https://storage.example.com/covers/cfpi.jpg",
  "domaine": "Formation Professionnelle",
  "statut": "APPROVED",
  "video_url": null,
  "date_creation": "2025-03-01T00:00:00Z",
  "profile_id": "880e8400-e29b-41d4-a716-446655440001"
}
```

**Error Responses:**
- `404 Not Found` - Centre non trouvé
- `500 Internal Server Error` - Erreur serveur

---

### 3. Get Training Center Followers Count (Public)
**GET** `/centres/:id/followers/count`

**Description:** Récupère le nombre de followers d'un centre

**Parameters:**
- `id` (path, required): UUID du centre

**Example Request:**
```
GET https://universearch-9qle.onrender.com/centres/880e8400-e29b-41d4-a716-446655440000/followers/count
```

**Response: 200 OK**
```json
{
  "centreId": "880e8400-e29b-41d4-a716-446655440000",
  "followerCount": 28
}
```

**Error Responses:**
- `500 Internal Server Error` - Erreur serveur

---

### 4. Follow Training Center (Authenticated)
**POST** `/centres/:id/follow`

**Description:** Permet à un utilisateur authentifié de suivre un centre de formation

**Auth Required:** ✅ Yes - Bearer Token

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Parameters:**
- `id` (path, required): UUID du centre

**Example Request:**
```
POST https://universearch-9qle.onrender.com/centres/880e8400-e29b-41d4-a716-446655440000/follow
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Response: 201 Created**
```json
{
  "message": "Successfully followed centre de formation",
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "user_id": "770e8400-e29b-41d4-a716-446655440000",
    "centre_id": "880e8400-e29b-41d4-a716-446655440000",
    "date_follow": "2026-03-09T10:30:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Centre non trouvé ou non approuvé
- `401 Unauthorized` - Token manquant ou invalide
- `500 Internal Server Error` - Erreur serveur

---

### 5. Unfollow Training Center (Authenticated)
**DELETE** `/centres/:id/follow`

**Description:** Arrêter de suivre un centre de formation

**Auth Required:** ✅ Yes - Bearer Token

**Headers:**
```
Authorization: Bearer {token}
```

**Parameters:**
- `id` (path, required): UUID du centre

**Example Request:**
```
DELETE https://universearch-9qle.onrender.com/centres/880e8400-e29b-41d4-a716-446655440000/follow
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response: 200 OK**
```json
{
  "message": "Successfully unfollowed centre de formation"
}
```

**Error Responses:**
- `400 Bad Request` - Erreur lors de la suppression
- `401 Unauthorized` - Token manquant ou invalide
- `500 Internal Server Error` - Erreur serveur

---

### 6. Get My Followed Training Centers (Authenticated)
**GET** `/centres/me/followed`

**Description:** Récupère tous les centres suivis par l'utilisateur

**Auth Required:** ✅ Yes - Bearer Token

**Headers:**
```
Authorization: Bearer {token}
```

**Example Request:**
```
GET https://universearch-9qle.onrender.com/centres/me/followed
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response: 200 OK**
```json
{
  "data": [
    {
      "followId": "990e8400-e29b-41d4-a716-446655440000",
      "dateFollow": "2026-03-09T10:30:00Z",
      "centre": {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "nom": "Centre de Formation Professionnel - CFPI",
        "description": "Centre spécialisé en formation professionnelle...",
        "logo_url": "https://storage.example.com/logos/cfpi.png",
        "lien_site": "https://www.cfpi.ci",
        "email": "contact@cfpi.ci",
        "statut": "APPROVED",
        "date_creation": "2025-03-01T00:00:00Z"
      }
    }
  ],
  "count": 1
}
```

**Error Responses:**
- `401 Unauthorized` - Token manquant ou invalide
- `500 Internal Server Error` - Erreur serveur

## 📊 Common Response Structures

### Error Response
```json
{
  "error": "Descriptive error message"
}
```

### Pagination (Optional)
```
GET /universites?limit=10&offset=20
```
- `limit`: Nombre d'items (default: 20)
- `offset`: Nombre d'items à sauter (default: 0)


## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | ✅ Success |
| 201 | ✅ Created (Follow successful) |
| 400 | ❌ Bad Request |
| 401 | ❌ Unauthorized (Token missing/invalid) |
| 404 | ❌ Not Found |
| 500 | ❌ Internal Server Error |

---

## 🔗 Quick Reference

### Public Endpoints (No Auth)
```
GET  /universites
GET  /universites/:id
GET  /universites/:id/followers/count
GET  /centres
GET  /centres/:id
GET  /centres/:id/followers/count
```

### Authenticated Endpoints (Requires Token)
```
POST   /universites/:id/follow
DELETE /universites/:id/follow
GET    /universites/me/followed
POST   /centres/:id/follow
DELETE /centres/:id/follow
GET    /centres/me/followed
```


