# Winning Six

A Vue 3 + Vite app backed by Firebase (Firestore).

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Configure Firebase

This app reads its Firebase config from environment variables. You'll need your own Firebase project to run it locally.

**1. Create a Firebase project**

- Go to the [Firebase console](https://console.firebase.google.com/) and create a new project (or use an existing one).
- In the project, register a new **Web app** (`</>` icon on the project overview page). Firebase will show you a `firebaseConfig` object — keep that tab open, you'll copy values from it in the next step.
- Enable **Cloud Firestore** under **Build → Firestore Database**.

**2. Create your `.env` file**

Copy the template:

```sh
cp .env.example .env
```

Open `.env` and fill in the values from the `firebaseConfig` object Firebase gave you:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

`.env` is gitignored — it stays on your machine. Never commit it.

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
