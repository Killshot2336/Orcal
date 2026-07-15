# Sanctuary — Design Spec

## Purpose

Sanctuary is a private two-person mobile app: a living digital sacred space for one couple. Every surface fosters intimacy, trust, mutual healing, and worship. It is not a social network.

## Non-negotiables

- Zero ads, zero third-party analytics, zero social sharing
- End-to-end encryption for intimate content
- Emotional-first UX: therapeutic, calm, luminous
- 60fps motion via Reanimated / Lottie; gesture-led navigation
- Backend is a private Firebase fortress + private Oracle API

## Architecture

```
Expo App (PIN + SecureStore Cosmic Key)
    │ HTTPS callable / Firestore RT
    ▼
Cloud Functions (authz, rate limits, Oracle proxy)
    │
    ├── Firestore (ciphertext + meta)
    ├── Storage (encrypted blobs ≤55MB)
    └── Private Oracle API (system prompt from @sanctuary/shared)
```

## Auth model

1. Cinematic Sacred Pact (shared vow)
2. Anonymous Firebase session
3. Local 4–6 digit PIN (+ optional biometrics)
4. Partner B joins via invite code; Cosmic Key exchanged out-of-band / local pairing export

## Heartbeat

Derived score (0–100) from cherishes, Link pulses, vows, vault trust, and connection freshness. Drives home widget pulse rate and Observatory magnitude.

## Oracle

Topic Wheel: Deep Connection, Naughty Exploration, Future Dreams, Healing, Playful. Body Map and Slumber Room feed redacted context only. Offline bank guarantees beauty without network.

## Simulation

`simulation/` models User A & User B for 90 days across all pillars, then stress tests Link×100/min, Loom 50MB, simultaneous Vault unlock.
