import { normalizeNumeroContrato } from "@/lib/firestore/contrato-matriz";
import type { StatusOperacionalCota } from "@/lib/types/domain";

const VALID_STATUSES: StatusOperacionalCota[] = ["ATIVO", "INADIMPLENTE", "CANCELADO"];

export function parseImportStatus(raw: unknown): StatusOperacionalCota | null {
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  const normalized = String(raw).trim().toUpperCase();
  if (!normalized) return null;
  return VALID_STATUSES.includes(normalized as StatusOperacionalCota)
    ? (normalized as StatusOperacionalCota)
    : null;
}

/** @deprecated Use normalizeNumeroContrato */
export const normalizeContrato = normalizeNumeroContrato;

export function normalizeNumeroContratoImport(raw: unknown): string {
  return normalizeNumeroContrato(raw);
}

export function findColumnKey(
  headers: string[],
  candidates: string[],
): string | null {
  const normalizedHeaders = headers.map((h) => h.trim().toUpperCase());
  for (const candidate of candidates) {
    const idx = normalizedHeaders.indexOf(candidate.toUpperCase());
    if (idx >= 0) return headers[idx];
  }
  return null;
}

export const CONTRATO_COLUMN_CANDIDATES = [
  "NUMERO_CONTRATO",
  "NÚMERO DO CONTRATO",
  "NUMERO DO CONTRATO",
  "CONTRATO",
];
export const STATUS_COLUMN_CANDIDATES = ["STATUS"];
export const PARCELAS_PAGAS_COLUMN_CANDIDATES = ["PARCELAS_PAGAS", "PARCELAS PAGAS"];

export function parseParcelasPagas(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const parsed = typeof raw === "number" ? raw : Number.parseInt(String(raw).trim(), 10);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
}
