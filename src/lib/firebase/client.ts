"use client";

import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { firebasePublicConfig, isFirebasePublicConfigReady } from "@/lib/firebase/config";

let analyticsInstance: Analytics | null = null;

export function getFirebaseClientApp(): FirebaseApp | null {
  if (typeof window === "undefined" || !isFirebasePublicConfigReady()) return null;
  return getApps()[0] ?? initializeApp(firebasePublicConfig);
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
