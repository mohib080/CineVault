# 🎬 CineVault

> **Personal Movie Diary & Tracker with Granular Privacy Controls**  
> *A modern Letterboxd alternative built around absolute user privacy.*

---

## 🌟 Overview

**CineVault** allows cinephiles, casual watchers, and film critics to track cinema, pen reviews, and curate custom lists with granular 3-tier privacy enforcement:

- 🔒 **`PRIVATE`**: Visible strictly to the authenticated owner (`user_id` match). Returns `403 Forbidden` / `404 Not Found` for any guest or non-owner request.
- 🔗 **`UNLISTED`**: Excluded from search feeds and public profiles. Accessible **only** via a direct URL containing a unique cryptographic `share_token` (UUID/nanoid):  
  `https://{domain}/vault/r/{id}?token={share_token}`
- 🌐 **`PUBLIC`**: Visible across community feeds, public user profiles, and global search.

---

## 🛠️ Tech Stack

- **Frontend:** React 18 with Vite, Vanilla CSS / CSS Modules, Lucide icons
- **Backend:** Node.js with Express & TypeScript
- **Database:** PostgreSQL (`cinevault_db`) using `pg` pool (with zero-config fallback engine for instant offline execution)
- **External API:** TMDB (The Movie Database) metadata caching (posters, director, release year, runtime, synopsis)
- **Authentication:** JWT with `bcryptjs` password hashing

---

## 📐 Database Schema (`schema.sql`)

1. **Enum `visibility_type`:** `'PUBLIC'`, `'UNLISTED'`, `'PRIVATE'`
2. **`users`:** `id`, `username`, `email`, `password_hash`, `default_privacy`, `created_at`
3. **`movies` (Cache):** `tmdb_id`, `title`, `release_year`, `poster_path`, `backdrop_path`, `director`, `runtime`, `overview`
4. **`diary_entries`:** `id`, `user_id`, `tmdb_id`, `rating` (0.5 to 5.0), `review_text`, `watched_date`, `is_rewatch`, `contains_spoilers`, `visibility`, `share_token`, `created_at`
5. **`movie_lists`:** `id`, `user_id`, `title`, `description`, `is_watchlist`, `visibility`, `share_token`, `created_at`
6. **`list_items`:** `(list_id, tmdb_id)`, `rank_order`, `notes`, `added_at`

---

## 🔒 Privacy Architecture & Access Control

The core authorization middleware `verifyResourceAccess(resource)` strictly enforces:

```typescript
export function canAccessResource(
  resource: ProtectedResource,
  reqUser?: { id: number },
  tokenQuery?: string
): boolean {
  if (resource.visibility === 'PUBLIC') return true;

  if (resource.visibility === 'UNLISTED') {
    const isOwner = reqUser && reqUser.id === resource.user_id;
    const hasValidToken = tokenQuery && tokenQuery === resource.share_token;
    return Boolean(isOwner || hasValidToken);
  }

  if (resource.visibility === 'PRIVATE') {
    return Boolean(reqUser && reqUser.id === resource.user_id);
  }

  return false;
}
```

---

## 🚀 Quickstart & Installation

### 1. Clone repository & install dependencies

```bash
git clone https://github.com/mohib080/CineVault.git
cd CineVault

# Install server and client packages
npm run install:all
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```env
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/cinevault_db"
JWT_SECRET="cinevault_super_secret_jwt_key_change_in_production_92817346"
TMDB_API_KEY="your_tmdb_api_key_here"
CLIENT_URL="http://localhost:5173"
```

### 3. Run Automated Privacy Verification Tests

```bash
cd server
npm test
```
*Validates that `PRIVATE` logs return 403, `UNLISTED` logs succeed only with the exact `share_token`, and `PUBLIC` logs are accessible.*

### 4. Run Development Servers

```bash
# In the root or in separate terminals:
# Terminal 1: Backend
npm run dev:server

# Terminal 2: Frontend
npm run dev:client
```
Visit `http://localhost:5173` to experience CineVault!

---

## 📋 Key REST API Endpoints

| Method | Endpoint | Description | Privacy Check |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register account with `default_privacy` | Public |
| `POST` | `/api/auth/login` | Log in and receive JWT token | Public |
| `GET` | `/api/auth/me` | Fetch authenticated session | Bearer JWT |
| `GET` | `/api/movies/search?q={query}` | Search TMDB & cache into `movies` | Public |
| `GET` | `/api/movies/:id` | Fetch movie metadata + personal log history | Public / Optional Auth |
| `POST` | `/api/diary` | Log a movie with rating, review, and visibility | Bearer JWT |
| `GET` | `/api/diary/:id` | Fetch single review | `verifyResourceAccess` |
| `PATCH` | `/api/diary/:id/visibility` | 1-Click toggle (`PRIVATE`, `UNLISTED`, `PUBLIC`) | Owner only |
| `PUT` | `/api/diary/:id` | Update diary entry | Owner only |
| `DELETE` | `/api/diary/:id` | Delete diary entry | Owner only |
| `POST` | `/api/lists` | Create new custom list or watchlist | Bearer JWT |
| `GET` | `/api/lists/:id` | Fetch list details & items | `verifyResourceAccess` |
| `PATCH` | `/api/lists/:id/visibility` | 1-Click toggle list visibility | Owner only |
| `GET` | `/api/users/:username/profile` | Public user profile & statistics | Filtered by Requester |

---

## 🎨 UI & Aesthetic Features

- **Sleek Noir Theme:** `#0a0d12` and `#12161f` background with glowing cyan and gold accents.
- **3-Way Segmented Control:** 🔒 **Private** | 🔗 **Unlisted** | 🌐 **Public** on all log modals and list creators.
- **Secret Link Clipboard Sharing:** Instant one-click copy with modal and toast confirmation for unlisted items.
- **Interactive Half-Star Rating:** Precision 0.5 to 5.0 star rating component.
- **Distraction-Free Shared Vault View:** Dedicated reader view for shared unlisted links (`/vault/r/:id?token=...`).

---

## 📜 License
MIT © 2026 CineVault Team
