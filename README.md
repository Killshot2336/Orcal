# Sanctuary

A private, two-person mobile application — a digital sacred space for one deeply connected couple. No ads. No third-party analytics. No social sharing. End-to-end encryption. Built to feel like a divine artifact made only for them.

## Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo 52), Expo Router, Reanimated 3, Gesture Handler, Lottie, Secure Store |
| Backend | Firebase Auth (anonymous + PIN gate), Firestore, Storage, Cloud Functions |
| Crypto | AES-256-GCM Cosmic Key (device SecureStore only), PIN stretch, HMAC Link signatures |
| AI | Private Oracle API via Cloud Function `sanctuaryOracle` (offline poetic bank as fortress fallback) |
| Simulation | Dual-user 90-day world model + stress suite (`simulation/`) |

## Feature map (build order)

1. **Sacred Pact** — cinematic intro, shared vow, PIN gate (no traditional login)
2. **The Sanctuary** — living background, Heartbeat widget, gesture navigation
3. **Vow Wall 2.0** — parallax plaque hallway, Daily / Sacred / Desire, Cherish bloom
4. **The Loom** — memory tapestry (photo / voice / screenshot / video threads)
5. **Oracle’s Chamber** — Topic Wheel + private AI questions
6. **The Link** — I’m Thinking of You pulses (Haptic Whisper, Emoji Touch, Heartbeat Presence)
7. **The Vault** — biometric gate + two-person unlock for vents / fears / trust
8. **Observatory** — star map / orrery from relationship metrics
9. **Slumber Room** — dream capture + shared theme constellation
10. **The Temple** — respectful body-map silhouette → Oracle prompts

## Repository layout

```
apps/sanctuary/          Expo React Native app
packages/shared/         Types, crypto, Oracle prompt + engine
functions/               Firebase Cloud Functions (fortress edge)
simulation/              90-day dual-user sim + stress tests
docs/                    Design notes + simulation reports
firestore.rules          Bond-scoped security rules
storage.rules            Encrypted blob limits (≤55MB)
```

> Note: A real React Native + Firebase product cannot ship as one literal source file. This monorepo is the ready-to-deploy unit. Shared domain logic is centralized in `@sanctuary/shared`.

## Setup

### Prerequisites

- Node 20+
- npm 10+
- Expo CLI / Expo Go for device preview
- Firebase project (Blaze if using remote Oracle API)

### Install

```bash
npm install
cp .env.example .env
```

Fill Firebase public keys into `.env` / EAS secrets. Keep `SANCTUARY_ORACLE_*` **only** on Cloud Functions config — never in the mobile bundle.

```bash
firebase functions:config:set sanctuary.oracle_url="https://your-private-endpoint" sanctuary.oracle_key="..."
# or prefer modern secrets:
firebase functions:secrets:set SANCTUARY_ORACLE_API_KEY
```

### Run mobile

```bash
npm run mobile
```

Demo path: onboarding → **Open simulation chamber** skips pact/PIN for UI review.

### Deploy fortress

```bash
npm run functions:build
firebase deploy --only functions,firestore:rules,storage
```

### Simulation & stress

```bash
npm run simulate
npm run simulate:stress
# or
npm run audit:actions
```

Reports write to `simulation/output/`:

- `simulation-90-day.md` / `.json`
- `stress-report.md` / `.json`

## Privacy fortress

- Anonymous Firebase Auth + local PIN / biometric gate (no email/password theater)
- Couple Cosmic Key generated on-device; only fingerprint stored in Firestore
- Vows, vault, dreams encrypted before leave the device
- Firestore rules: bond membership required; rate-limit docs server-only
- Storage: ciphertext-oriented content types, 55MB ceiling (covers 50MB Loom stress)
- Link pulses HMAC-signed; Cloud Function caps 100/min/bond
- Oracle: ephemeral inference; meta audit stores topic/tone only — never vault plaintext

## Oracle system prompt

Canonical prompt lives in `packages/shared/src/oracle-prompt.ts` (`ORACLE_SYSTEM_PROMPT`). Cloud Functions and the offline engine share it.

## Design language

Warm dusk sanctuary — deep forest slate, honey amber, soft rose, sage. Display serif elegance (Cormorant / Source Serif). Breathing orbs, Heartbeat pulse, Cherish bloom, orrery drift. No purple-glow UI kits, no analytics chrome, no public social patterns.

## Scripts

| Command | Purpose |
|---|---|
| `npm run mobile` | Expo dev server |
| `npm run functions:build` | Compile Cloud Functions |
| `npm run simulate` | 90-day User A / User B simulation |
| `npm run simulate:stress` | Link / Loom / Vault stress |
| `npm run audit:actions` | Full simulation gate |
| `npm test` | Workspace tests |

## License

Private bond software — not for redistribution. All rights reserved to the couple who holds the pact.
