# API Documentation - Followers Endpoints

## Overview
Les endpoints followers permettent aux utilisateurs autentifiés de suivre les universités et les centres de formation, et de récupérer la liste de leurs suivis.

## Authentication
- **Required**: Bearer token (obtenu après login)
- **Header**: `Authorization: Bearer <token>`

---

## Base URL
```
http://localhost:3001
```

---

## Universités - Follow Endpoints

### 1. Follow a University (Create Follow)
```
POST /universites/:id/follow
Authorization: Bearer <token>
Content-Type: application/json
```

**Parameters:**
- `id` (path): UUID of the université

**Response:**
```json
{
  "message": "Successfully followed université",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "universite_id": "uuid",
    "date_follow": "2026-03-09T10:30:00Z"
  }
}
```

**Status Codes:**
- `201`: Successfully followed
- `400`: Invalid request or université not found/approved
- `401`: Unauthorized

---

### 2. Unfollow a University (Delete Follow)
```
DELETE /universites/:id/follow
Authorization: Bearer <token>
```

**Parameters:**
- `id` (path): UUID of the université

**Response:**
```json
{
  "message": "Successfully unfollowed université"
}
```

**Status Codes:**
- `200`: Successfully unfollowed
- `400`: Error during deletion
- `401`: Unauthorized

---

### 3. Get My Followed Universities
```
GET /universites/me/followed
Authorization: Bearer <token>
```

**Response:**
```json
{
  "data": [
    {
      "followId": "uuid",
      "dateFollow": "2026-03-09T10:30:00Z",
      "universite": {
        "id": "uuid",
        "nom": "Université Félix Houphouët-Boigny",
        "description": "...",
        "logo_url": "https://...",
        "lien_site": "https://...",
        "email": "contact@uni.ci",
        "statut": "APPROVED",
        "date_creation": "2026-01-15T00:00:00Z"
      }
    }
  ],
  "count": 5
}
```

**Status Codes:**
- `200`: Success
- `500`: Server error
- `401`: Unauthorized

---

### 4. Get University Followers Count (Public)
```
GET /universites/:id/followers/count
```

**Parameters:**
- `id` (path): UUID of the université

**Response:**
```json
{
  "universiteId": "uuid",
  "followerCount": 42
}
```

**Status Codes:**
- `200`: Success
- `500`: Server error

---

## Centres de Formation - Follow Endpoints

### 1. Follow a Training Center (Create Follow)
```
POST /centres/:id/follow
Authorization: Bearer <token>
Content-Type: application/json
```

**Parameters:**
- `id` (path): UUID of the centre

**Response:**
```json
{
  "message": "Successfully followed centre de formation",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "centre_id": "uuid",
    "date_follow": "2026-03-09T10:30:00Z"
  }
}
```

**Status Codes:**
- `201`: Successfully followed
- `400`: Invalid request or centre not found/approved
- `401`: Unauthorized

---

### 2. Unfollow a Training Center (Delete Follow)
```
DELETE /centres/:id/follow
Authorization: Bearer <token>
```

**Parameters:**
- `id` (path): UUID of the centre

**Response:**
```json
{
  "message": "Successfully unfollowed centre de formation"
}
```

**Status Codes:**
- `200`: Successfully unfollowed
- `400`: Error during deletion
- `401`: Unauthorized

---

### 3. Get My Followed Training Centers
```
GET /centres/me/followed
Authorization: Bearer <token>
```

**Response:**
```json
{
  "data": [
    {
      "followId": "uuid",
      "dateFollow": "2026-03-09T10:30:00Z",
      "centre": {
        "id": "uuid",
        "nom": "Centre de Formation Professionnel",
        "description": "...",
        "logo_url": "https://...",
        "lien_site": "https://...",
        "email": "contact@centre.ci",
        "statut": "APPROVED",
        "date_creation": "2026-01-15T00:00:00Z"
      }
    }
  ],
  "count": 3
}
```

**Status Codes:**
- `200`: Success
- `500`: Server error
- `401`: Unauthorized

---

### 4. Get Training Center Followers Count (Public)
```
GET /centres/:id/followers/count
```

**Parameters:**
- `id` (path): UUID of the centre

**Response:**
```json
{
  "centreId": "uuid",
  "followerCount": 28
}
```

**Status Codes:**
- `200`: Success
- `500`: Server error

---

## Important Notes

1. **Authentication Required**: Except for the count endpoints, all endpoints require authentication via Bearer token.

2. **User Constraint**: A user can only follow a centre/université once. Attempting to follow twice will return a 201 status code (already exists, treated as success).

3. **Follow Only Approved**: Only APPROVED universités and centres can be followed. Attempting to follow a PENDING or REJECTED institution will result in a 400 error.

4. **Database Tables**:
   - `followers_universites`: Stores follow relationships for universities
   - `followers_centres_formation`: Stores follow relationships for training centers

5. **Related Tables**:
   - `universites`: Official university records
   - `centres_formation`: Official training center records
   - `profiles`: User profiles

---

## Frontend Integration Example

```javascript
// Configuration
const API_BASE = 'http://localhost:3001';
const userToken = localStorage.getItem('auth_token');

// Helper for authenticated requests
async function authenticatedFetch(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
        ...options.headers,
    };
    return fetch(url, { ...options, headers });
}

// Follow a university
async function followUniversity(univId) {
    const response = await authenticatedFetch(
        `${API_BASE}/universites/${univId}/follow`,
        { method: 'POST' }
    );
    return await response.json();
}

// Get my followed universities
async function getFollowedUniversities() {
    const response = await authenticatedFetch(
        `${API_BASE}/universites/me/followed`
    );
    return await response.json();
}

// Get universities follower count
async function getFollowerCount(univId) {
    const response = await fetch(
        `${API_BASE}/universites/${univId}/followers/count`
    );
    return await response.json();
}
```

---

## Migration & Setup

The migration file `003_create_followers_tables.sql` must be applied to set up the required database tables:

```bash
# Navigate to the identity-service
cd services/identity-service

# Apply migrations (using Supabase CLI or manual SQL execution)
supabase db push
```

---

## Error Handling

All error responses follow this format:

```json
{
  "error": "Human-readable error message"
}
```

Common errors:
- `"Université not found or not approved"` - 400
- `"Centre de formation not found or not approved"` - 400
- No token provided or invalid token - 401
- Duplicate follow attempt (handled gracefully) - 201

---

## Service Classes

- **FollowersService**: Core business logic for follow operations
  - `followUniversite(userId, universiteId)`
  - `unfollowUniversite(userId, universiteId)`
  - `getFollowedUniversites(userId)`
  - `countUniversiteFollowers(universiteId)`
  - `followCentre(userId, centreId)`
  - `unfollowCentre(userId, centreId)`
  - `getFollowedCentres(userId)`
  - `countCentreFollowers(centreId)`

- **FollowersController**: HTTP request handling
- **followersRoutes**: Route registration and middleware

