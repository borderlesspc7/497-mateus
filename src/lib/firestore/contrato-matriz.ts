import type { StatusOperacionalCota } from "@/lib/types/domain";

/** Campos mínimos para resolver o número do contrato em documentos legados ou relacionados. */
export type NumeroContratoSource = {
  numeroContrato?: string;
  /** @deprecated Use numeroContrato. Mantido para documentos legados. */
  contrato?: string;
  titulo?: string;
};

export function normalizeNumeroContrato(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  return String(raw).trim();
}

/** Lê o número do contrato com fallback para o campo legado `contrato`. */
export function readNumeroContrato(source: NumeroContratoSource): string {
  return (
    normalizeNumeroContrato(source.numeroContrato) ||
    normalizeNumeroContrato(source.contrato) ||
    normalizeNumeroContrato(source.titulo) ||
    ""
  );
}

/** Persiste o número do contrato no campo canônico e espelha no legado para compatibilidade. */
export function withNumeroContratoFields(numeroContrato: string): {
  numeroContrato: string;
  contrato: string;
} {
  const value = normalizeNumeroContrato(numeroContrato);
  return { numeroContrato: value, contrato: value };
}

export type VendaContratoLookup = {
  id: string;
  numeroContrato: string;
  statusOperacional: StatusOperacionalCota;
};
