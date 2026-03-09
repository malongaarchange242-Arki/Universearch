# 📱 API Endpoints Documentation - Flutter App

## Base URL
```
http://localhost:3001
```

---

## 🏫 UNIVERSITÉS ENDPOINTS

### 1. Get All Universities (Public)
**GET** `/universites`

**Description:** Récupère la liste de toutes les universités approuvées

**Parameters:** 
- `limit` (query, optional): Nombre max d'universités (default: 20)
- `offset` (query, optional): Pour la pagination (default: 0)

**Example Request:**
```
GET http://localhost:3001/universites?limit=20&offset=0
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
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "nom": "Université Alassane Ouattara",
    "description": "Université moderne avec focus sur les sciences et technologies.",
    "email": "contact@uao.ci",
    "lien_site": "https://www.uao.edu.ci",
    "logo_url": "https://storage.example.com/logos/uao.png",
    "couverture_logo_url": "https://storage.example.com/covers/uao.jpg",
    "domaine": "Scientifique",
    "statut": "APPROVED",
    "video_url": null,
    "date_creation": "2025-02-10T00:00:00Z",
    "profile_id": "550e8400-e29b-41d4-a716-446655440003",
    "sigle": "UAO",
    "annee_fondation": 2000
  }
]
```

**Error Responses:**
- `500 Internal Server Error` - Erreur serveur

**Field Descriptions:**
| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | ID unique de l'université |
| nom | string | Nom officiel |
| description | string | Courte description |
| email | string | Email de contact |
| lien_site | string | URL du site officiel |
| logo_url | string | URL du logo |
| couverture_logo_url | string | URL de la couverture/bannière |
| domaine | string | Domaine académique |
| statut | string | APPROVED, PENDING, REJECTED, SUSPENDED |
| video_url | string \| null | URL vidéo de présentation |
| date_creation | ISO 8601 | Date de création |
| profile_id | string (UUID) | ID du profil associé |
| sigle | string | Acronyme/sigle |
| annee_fondation | integer | Année de création |

---

### 2. Get University by ID (Public)
**GET** `/universites/:id`

**Description:** Récupère les détails d'une université spécifique

**Parameters:**
- `id` (path, required): UUID de l'université

**Example Request:**
```
GET http://localhost:3001/universites/550e8400-e29b-41d4-a716-446655440000
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
GET http://localhost:3001/universites/550e8400-e29b-41d4-a716-446655440000/followers/count
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
POST http://localhost:3001/universites/550e8400-e29b-41d4-a716-446655440000/follow
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

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
DELETE http://localhost:3001/universites/550e8400-e29b-41d4-a716-446655440000/follow
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
GET http://localhost:3001/universites/me/followed
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
    {
      "followId": "660e8400-e29b-41d4-a716-446655440001",
      "dateFollow": "2026-03-08T15:20:00Z",
      "universite": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "nom": "Université Alassane Ouattara",
        "description": "Université moderne avec focus sur les sciences...",
        "logo_url": "https://storage.example.com/logos/uao.png",
        "lien_site": "https://www.uao.edu.ci",
        "email": "contact@uao.ci",
        "statut": "APPROVED",
        "date_creation": "2025-02-10T00:00:00Z"
      }
    }
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
GET http://localhost:3001/centres?limit=20&offset=0
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
  {
    "id": "880e8400-e29b-41d4-a716-446655440002",
    "nom": "Institut Technique de l'Informatique",
    "description": "Institut spécialisé en informatique et technologies numériques.",
    "email": "contact@iti.ci",
    "lien_site": "https://www.iti.ci",
    "logo_url": "https://storage.example.com/logos/iti.png",
    "couverture_logo_url": "https://storage.example.com/covers/iti.jpg",
    "domaine": "Informatique",
    "statut": "APPROVED",
    "video_url": null,
    "date_creation": "2025-02-20T00:00:00Z",
    "profile_id": "880e8400-e29b-41d4-a716-446655440003"
  }
]
```

**Field Descriptions:**
| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | ID unique du centre |
| nom | string | Nom officiel |
| description | string | Courte description |
| email | string | Email de contact |
| lien_site | string | URL du site officiel |
| logo_url | string | URL du logo |
| couverture_logo_url | string | URL de la couverture/bannière |
| domaine | string | Domaine de formation |
| statut | string | APPROVED, PENDING, REJECTED, SUSPENDED |
| video_url | string \| null | URL vidéo de présentation |
| date_creation | ISO 8601 | Date de création |
| profile_id | string (UUID) | ID du profil associé |

---

### 2. Get Training Center by ID (Public)
**GET** `/centres/:id`

**Description:** Récupère les détails d'un centre de formation spécifique

**Parameters:**
- `id` (path, required): UUID du centre

**Example Request:**
```
GET http://localhost:3001/centres/880e8400-e29b-41d4-a716-446655440000
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
GET http://localhost:3001/centres/880e8400-e29b-41d4-a716-446655440000/followers/count
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
POST http://localhost:3001/centres/880e8400-e29b-41d4-a716-446655440000/follow
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
DELETE http://localhost:3001/centres/880e8400-e29b-41d4-a716-446655440000/follow
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
GET http://localhost:3001/centres/me/followed
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

---

## 🔐 Authentication

### Get Auth Token
**POST** `/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response: 200 OK**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  "user": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "nom": "John Doe",
    "profile_type": "utilisateur"
  }
}
```

---

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

---

## 🎯 Flutter Implementation Example

### Model Classes
```dart
// Modèle Université
class Universite {
  final String id;
  final String nom;
  final String description;
  final String email;
  final String? lienSite;
  final String? logoUrl;
  final String? couvertureLogoUrl;
  final String domaine;
  final String statut;
  final DateTime dateCreation;
  final String? sigle;
  final int? anneeFondation;

  Universite({
    required this.id,
    required this.nom,
    required this.description,
    required this.email,
    this.lienSite,
    this.logoUrl,
    this.couvertureLogoUrl,
    required this.domaine,
    required this.statut,
    required this.dateCreation,
    this.sigle,
    this.anneeFondation,
  });

  factory Universite.fromJson(Map<String, dynamic> json) {
    return Universite(
      id: json['id'],
      nom: json['nom'],
      description: json['description'],
      email: json['email'],
      lienSite: json['lien_site'],
      logoUrl: json['logo_url'],
      couvertureLogoUrl: json['couverture_logo_url'],
      domaine: json['domaine'],
      statut: json['statut'],
      dateCreation: DateTime.parse(json['date_creation']),
      sigle: json['sigle'],
      anneeFondation: json['annee_fondation'],
    );
  }
}

// Modèle Centre de Formation
class Centre {
  final String id;
  final String nom;
  final String description;
  final String email;
  final String? lienSite;
  final String? logoUrl;
  final String? couvertureLogoUrl;
  final String domaine;
  final String statut;
  final DateTime dateCreation;

  Centre({
    required this.id,
    required this.nom,
    required this.description,
    required this.email,
    this.lienSite,
    this.logoUrl,
    this.couvertureLogoUrl,
    required this.domaine,
    required this.statut,
    required this.dateCreation,
  });

  factory Centre.fromJson(Map<String, dynamic> json) {
    return Centre(
      id: json['id'],
      nom: json['nom'],
      description: json['description'],
      email: json['email'],
      lienSite: json['lien_site'],
      logoUrl: json['logo_url'],
      couvertureLogoUrl: json['couverture_logo_url'],
      domaine: json['domaine'],
      statut: json['statut'],
      dateCreation: DateTime.parse(json['date_creation']),
    );
  }
}

// Modèle Follow
class Follow {
  final String followId;
  final DateTime dateFollow;
  final dynamic institution; // Universite ou Centre

  Follow({
    required this.followId,
    required this.dateFollow,
    required this.institution,
  });
}
```

### API Service
```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class UniverseArchApiService {
  static const String baseUrl = 'http://localhost:3001';
  String? token;

  // Récupérer toutes les universités
  Future<List<Universite>> getUniversities({
    int limit = 20,
    int offset = 0,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/universites?limit=$limit&offset=$offset'),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Universite.fromJson(json)).toList();
      } else {
        throw Exception('Échec du chargement des universités: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Erreur: $e');
    }
  }

  // Récupérer une université par ID
  Future<Universite> getUniversite(String id) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/universites/$id'),
      );

      if (response.statusCode == 200) {
        return Universite.fromJson(json.decode(response.body));
      } else {
        throw Exception('Échec du chargement de l\'université: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Erreur: $e');
    }
  }

  // Suivre une université
  Future<void> followUniversite(String universiteId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/universites/$universiteId/follow'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode != 201) {
        final error = json.decode(response.body);
        throw Exception(error['error'] ?? 'Échec du suivi');
      }
    } catch (e) {
      throw Exception('Erreur: $e');
    }
  }

  // Arrêter de suivre une université
  Future<void> unfollowUniversite(String universiteId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/universites/$universiteId/follow'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode != 200) {
        final error = json.decode(response.body);
        throw Exception(error['error'] ?? 'Échec de l\'arrêt du suivi');
      }
    } catch (e) {
      throw Exception('Erreur: $e');
    }
  }

  // Récupérer mes universités suivies
  Future<List<Follow>> getMyFollowedUniversities() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/universites/me/followed'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        final List<dynamic> data = json['data'];
        return data
            .map((item) => Follow(
              followId: item['followId'],
              dateFollow: DateTime.parse(item['dateFollow']),
              institution: Universite.fromJson(item['universite']),
            ))
            .toList();
      } else {
        throw Exception('�chec du chargement des universit�s suivies');
      }
    } catch (e) {
      throw Exception('Erreur: $e');
    }
  }

  // Récupérer tous les centres de formation
  Future<List<Centre>> getCentres({
    int limit = 20,
    int offset = 0,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/centres?limit=$limit&offset=$offset'),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Centre.fromJson(json)).toList();
      } else {
        throw Exception('�chec du chargement des centres: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Erreur: $e');
    }
  }

  // Récupérer un centre par ID
  Future<Centre> getCentre(String id) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/centres/$id'),
      );

      if (response.statusCode == 200) {
        return Centre.fromJson(json.decode(response.body));
      } else {
        throw Exception('Échec du chargement du centre: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Erreur: $e');
    }
  }

  // Suivre un centre de formation
  Future<void> followCentre(String centreId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/centres/$centreId/follow'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode != 201) {
        final error = json.decode(response.body);
        throw Exception(error['error'] ?? 'Échec du suivi');
      }
    } catch (e) {
      throw Exception('Erreur: $e');
    }
  }

  // Arrêter de suivre un centre de formation
  Future<void> unfollowCentre(String centreId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/centres/$centreId/follow'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode != 200) {
        final error = json.decode(response.body);
        throw Exception(error['error'] ?? 'Échec de l\'arrêt du suivi');
      }
    } catch (e) {
      throw Exception('Erreur: $e');
    }
  }

  // Récupérer mes centres suivis
  Future<List<Follow>> getMyFollowedCentres() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/centres/me/followed'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        final List<dynamic> data = json['data'];
        return data
            .map((item) => Follow(
              followId: item['followId'],
              dateFollow: DateTime.parse(item['dateFollow']),
              institution: Centre.fromJson(item['centre']),
            ))
            .toList();
      } else {
        throw Exception('Échec du chargement des centres suivis');
      }
    } catch (e) {
      throw Exception('Erreur: $e');
    }
  }
}
```

---

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

---

**Happy coding! 🚀**
