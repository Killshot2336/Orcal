/**
 * Firebase client — Sanctuary fortress gateway.
 * No Analytics, no Crashlytics-to-third-party, no AdMob.
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  type Auth,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  type Firestore,
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'demo-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'sanctuary-demo.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'sanctuary-demo',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'sanctuary-demo.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '0',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '1:0:web:demo',
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let functions: Functions;

export function getFirebase() {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0]!;
  }
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  functions = getFunctions(app, 'us-central1');
  return { app, auth, db, storage, functions };
}

/** Anonymous Auth + local PIN gate = no traditional login screens. */
export async function ensureAnonymousSession() {
  const { auth: a } = getFirebase();
  if (a.currentUser) return a.currentUser;
  const cred = await signInAnonymously(a);
  return cred.user;
}

export async function callOracle(payload: Record<string, unknown>) {
  const { functions: fn } = getFirebase();
  const callable = httpsCallable(fn, 'sanctuaryOracle');
  const res = await callable(payload);
  return res.data;
}

export async function callAcceptPact(payload: Record<string, unknown>) {
  const { functions: fn } = getFirebase();
  const callable = httpsCallable(fn, 'acceptSacredPact');
  const res = await callable(payload);
  return res.data as {
    bondId: string;
    inviteCode?: string;
    role: 'A' | 'B';
  };
}

export async function callSendLink(payload: Record<string, unknown>) {
  const { functions: fn } = getFirebase();
  const callable = httpsCallable(fn, 'sendLinkPulse');
  const res = await callable(payload);
  return res.data;
}

export async function callCherish(payload: { bondId: string; vowId: string }) {
  const { functions: fn } = getFirebase();
  const callable = httpsCallable(fn, 'cherishVow');
  const res = await callable(payload);
  return res.data;
}

export async function callUnlockVault(payload: { bondId: string; entryId: string }) {
  const { functions: fn } = getFirebase();
  const callable = httpsCallable(fn, 'unlockVaultEntry');
  const res = await callable(payload);
  return res.data as { unlockedBy: string[]; mutuallyOpen: boolean };
}

export async function callDreamThemes(payload: {
  bondId: string;
  themeHints: string[];
}) {
  const { functions: fn } = getFirebase();
  const callable = httpsCallable(fn, 'analyzeDreamThemes');
  const res = await callable(payload);
  return res.data;
}

export {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
};
