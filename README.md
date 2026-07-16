# Sanctuary (Web)

A private, two-person **React web application** — a digital sacred space you can open in your browser.

No ads. No third-party analytics. No social sharing. Your bond data stays in this browser (localStorage).

## Quick start

```bash
npm install
npm start
```

The app opens at [http://localhost:5173](http://localhost:5173).

### GitHub Pages

This repo is configured for **legacy** Pages (`main` branch, `/` root).  
After UI changes, publish a production build into the repo root:

```bash
npm run build:pages
```

That writes hashed bundles to `assets/` and a production `index.html` that loads `/Orcal/assets/...` (not raw `.tsx`). Local `npm start` restores the Vite entry via `index.dev.html`.

| Script | Purpose |
|---|---|
| `npm start` / `npm run dev` | Launch Vite dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build |

## Features

1. **Sacred Pact** — cinematic vow onboarding (no traditional login)
2. **PIN gate** — private 4–6 digit unlock
3. **Home Heartbeat** — living pulse of the bond
4. **Vow Wall** — Daily / Sacred / Desire plaques + Cherish bloom
5. **The Loom** — memory tapestry threads
6. **Oracle’s Chamber** — Topic Tapestry, Intensity slider, Compass, AI questions
7. **The Link** — I’m Thinking of You pulses
8. **The Vault** — two-key trust space
9. **Observatory** — constellation sky from your activity
10. **Slumber Room** & **Temple** — dreams + sacred body map

## Oracle API (optional)

By default the Oracle uses a beautiful offline question bank (works with zero config).

To point at your private API:

```bash
cp .env.example .env
# set VITE_ORACLE_API_URL=https://your-private-oracle-endpoint
```

The client POSTs JSON shaped like an OpenAI-compatible chat completion (or a direct `{ question, followUps, tone }` body). If the network call fails, Sanctuary falls back offline.

## Stack

- React 18 + TypeScript
- Vite 6
- React Router
- Framer Motion

## Privacy

- Couple content is stored locally in your browser only
- No analytics SDKs
- Reset clears the Sanctuary from this device

## ZIP package

If you received `Sanctuary-Web-App.zip`:

1. Unzip
2. `cd Sanctuary-Web-App` (or the unzipped folder name)
3. `npm install`
4. `npm start`
