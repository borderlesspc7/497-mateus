import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cert, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
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

  const fromSeparateEnv = loadServiceAccountFromSeparateEnv();
  if (fromSeparateEnv) return fromSeparateEnv;

  throw new Error(
    [
      "Firebase Admin não configurado.",
      "Baixe a chave em Firebase Console → Configurações → Contas de serviço → Gerar nova chave privada.",
      "Salve como firebase/serviceAccountKey.json e defina FIREBASE_SERVICE_ACCOUNT_PATH=firebase/serviceAccountKey.json no .env.local.",
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
