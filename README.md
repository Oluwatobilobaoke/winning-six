# Winning Six

A Vue 3 + Vite admin app for the Winning Six 5-a-side stats tracker.

Backed by the Go API in [`../mini-football-golang`](../mini-football-golang). All reads and writes go through that API; no Firestore.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Project Setup

```sh
npm install
```

### Configure the API base URL

```sh
cp .env.example .env
```

The default in `.env.example`:

```
VITE_API_BASE_URL=http://localhost:8733
```

That's the dev port the Go API listens on. Make sure the API is running and reachable; the frontend calls `${VITE_API_BASE_URL}/api/v1/...` for everything.

The backend allows `http://localhost:3000` and `https://winning-six.web.app` in CORS by default — Vite is pinned to port 3000 in `vite.config.js` to match.

### Sign in

The first admin is seeded by the backend on startup from its `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env vars. Use those credentials at `/login`. Additional admins can be created via `POST /api/v1/auth/register` (must be authenticated).

### Compile and Hot-Reload for Development

```sh
npm run dev
```

App at [http://localhost:3000](http://localhost:3000).

### Compile and Minify for Production

```sh
npm run build
```

Output goes to `dist/`.

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

