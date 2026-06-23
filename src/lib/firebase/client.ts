"use client";

import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import {
  firebasePublicConfig,
  isFirebaseAnalyticsEnabled,
  isFirebasePublicConfigReady,
} from "@/lib/firebase/config";

export { waitForAuthenticatedUser as ensureFirebaseAuth } from "@/lib/firebase/auth-client";

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

let analyticsInstance: Analytics | null = null;

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (!isFirebaseAnalyticsEnabled()) return null;
  if (analyticsInstance) return analyticsInstance;

  const app = getFirebaseClientApp();
  if (!app) return null;

  const supported = await isSupported();
  if (!supported) return null;

  try {
    analyticsInstance = getAnalytics(app);
    return analyticsInstance;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Firebase Analytics] Não foi possível inicializar. Verifique NEXT_PUBLIC_FIREBASE_API_KEY no Firebase Console.",
        error,
      );
    }
    return null;
  }
}
