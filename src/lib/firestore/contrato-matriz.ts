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

/** Valida e retorna o número do contrato normalizado (chave matriz universal). */
export function assertNumeroContratoInformado(numeroContrato: string): string {
  const normalized = normalizeNumeroContrato(numeroContrato);
  if (!normalized) {
    throw new Error("Informe o número do contrato.");
  }
  return normalized;
}

export type CotaIdentificacaoInput = {
  grupo: string;
  cota: string;
  dataVencimento: number;
};

/** Atributos descritivos da cota — não fazem parte da chave matriz. */
export function assertCotaIdentificacaoFields(data: CotaIdentificacaoInput): void {
  if (!data.grupo.trim()) throw new Error("Informe o grupo.");
  if (!data.cota.trim()) throw new Error("Informe a cota.");
  if (
    !Number.isInteger(data.dataVencimento) ||
    data.dataVencimento < 1 ||
    data.dataVencimento > 31
  ) {
    throw new Error("Informe o dia de vencimento entre 1 e 31.");
  }
}

export type VendaContratoLookup = {
  id: string;
  numeroContrato: string;
  statusOperacional: StatusOperacionalCota;
};

export class ContratoDuplicadoError extends Error {
  readonly numeroContrato: string;
  readonly vendaIds: string[];

  constructor(numeroContrato: string, vendaIds: string[]) {
    super(
      `Contrato duplicado no sistema: ${numeroContrato} (vendas: ${vendaIds.join(", ")}).`,
    );
    this.name = "ContratoDuplicadoError";
    this.numeroContrato = numeroContrato;
    this.vendaIds = vendaIds;
  }
}

/** Monta mapa contrato → venda; falha se houver mais de um documento com o mesmo contrato. */
export function buildContratoLookupFromVendas<T extends VendaContratoLookup>(
  entries: T[],
): Map<string, T> {
  const map = new Map<string, T>();
  const duplicates = new Map<string, string[]>();

  for (const entry of entries) {
    const numeroContrato = normalizeNumeroContrato(entry.numeroContrato);
    if (!numeroContrato) continue;

    const existing = map.get(numeroContrato);
    if (existing) {
      const ids = duplicates.get(numeroContrato) ?? [existing.id];
      ids.push(entry.id);
      duplicates.set(numeroContrato, ids);
      continue;
    }
    map.set(numeroContrato, { ...entry, numeroContrato });
  }

  if (duplicates.size > 0) {
    const [numeroContrato, vendaIds] = [...duplicates.entries()][0]!;
    throw new ContratoDuplicadoError(numeroContrato, vendaIds);
  }

  return map;
}
