"use client";

import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  type Auth,
  type User,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { firebasePublicConfig, isFirebasePublicConfigReady } from "@/lib/firebase/config";

let analyticsInstance: Analytics | null = null;
let authReadyPromise: Promise<User> | null = null;

export function getFirebaseClientApp(): FirebaseApp | null {
  if (typeof window === "undefined" || !isFirebasePublicConfigReady()) return null;
  return getApps()[0] ?? initializeApp(firebasePublicConfig);
}

export function getClientAuth(): Auth | null {
  const app = getFirebaseClientApp();
  return app ? getAuth(app) : null;
}

export function getClientFirestore(): Firestore | null {
  const app = getFirebaseClientApp();
  return app ? getFirestore(app) : null;
}

export function ensureFirebaseAuth(): Promise<User> {
  if (authReadyPromise) return authReadyPromise;

  authReadyPromise = new Promise((resolve, reject) => {
    const auth = getClientAuth();
    if (!auth) {
      reject(new Error("Firebase não configurado. Verifique as variáveis NEXT_PUBLIC_FIREBASE_*."));
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          unsubscribe();
          resolve(user);
          return;
        }

        void signInAnonymously(auth)
          .then((credential) => resolve(credential.user))
          .catch((error: unknown) => {
            authReadyPromise = null;
            reject(error instanceof Error ? error : new Error("Falha na autenticação anônima."));
          });
      },
      (error) => {
        authReadyPromise = null;
        reject(error);
      },
    );
  });

  return authReadyPromise;
}

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (analyticsInstance) return analyticsInstance;
  const app = getFirebaseClientApp();
  if (!app) return null;
  const supported = await isSupported();
  if (!supported) return null;
  analyticsInstance = getAnalytics(app);
  return analyticsInstance;
}
