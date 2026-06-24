import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cert, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

type ServiceAccountPayload = ServiceAccount & {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

function normalizeServiceAccount(raw: ServiceAccountPayload): ServiceAccount {
  return {
    projectId: raw.projectId ?? raw.project_id,
    clientEmail: raw.clientEmail ?? raw.client_email,
    privateKey: raw.privateKey ?? raw.private_key,
  };
}

function loadServiceAccountFromFile(): ServiceAccount | null {
  // Em Netlify/Vercel o JSON local não existe — use variáveis de ambiente.
  if (process.env.NETLIFY || process.env.VERCEL) return null;

  const relativePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (!relativePath) return null;

  try {
    const absolutePath = resolve(process.cwd(), relativePath);
    const raw = readFileSync(absolutePath, "utf8");
    const parsed = JSON.parse(raw) as ServiceAccountPayload;
    const normalized = normalizeServiceAccount(parsed);
    if (!normalized.projectId || !normalized.clientEmail || !normalized.privateKey) return null;
    return normalized;
  } catch {
    return null;
  }
}

function parseServiceAccountFromEnv(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ServiceAccountPayload;
    const normalized = normalizeServiceAccount(parsed);
    if (!normalized.projectId || !normalized.clientEmail || !normalized.privateKey) return null;
    return normalized;
  } catch {
    return null;
  }
}

function parseServiceAccountFromBase64Env(): ServiceAccount | null {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim();
  if (!encoded) return null;
  try {
    const raw = Buffer.from(encoded, "base64").toString("utf8");
    const parsed = JSON.parse(raw) as ServiceAccountPayload;
    const normalized = normalizeServiceAccount(parsed);
    if (!normalized.projectId || !normalized.clientEmail || !normalized.privateKey) return null;
    return normalized;
  } catch {
    return null;
  }
}

function loadServiceAccountFromSeparateEnv(): ServiceAccount | null {
  const projectId =
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ||
    "";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim() ?? "";
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? "";

  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
}

function getServiceAccount(): ServiceAccount {
  const fromFile = loadServiceAccountFromFile();
  if (fromFile) return fromFile;

  const fromEnvJson = parseServiceAccountFromEnv();
  if (fromEnvJson) return fromEnvJson;

  const fromBase64 = parseServiceAccountFromBase64Env();
  if (fromBase64) return fromBase64;

  const fromSeparateEnv = loadServiceAccountFromSeparateEnv();
  if (fromSeparateEnv) return fromSeparateEnv;

  const isServerless = Boolean(process.env.NETLIFY || process.env.VERCEL);
  throw new Error(
    [
      "Firebase Admin não configurado.",
      isServerless
        ? "No Netlify/Vercel, o arquivo JSON da service account não vai no deploy. Configure FIREBASE_SERVICE_ACCOUNT (JSON em uma linha), FIREBASE_SERVICE_ACCOUNT_BASE64 ou FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY nas variáveis de ambiente do painel."
        : "Localmente: baixe a chave em Firebase Console → Contas de serviço e use FIREBASE_SERVICE_ACCOUNT_PATH ou FIREBASE_SERVICE_ACCOUNT no .env.local.",
    ].join(" "),
  );
}

function getAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const serviceAccount = getServiceAccount();

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.projectId,
  });
}

export function getAdminFirestore(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}
