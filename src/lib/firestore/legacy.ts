import { readNumeroContrato, withNumeroContratoFields } from "@/lib/firestore/contrato-matriz";
import type { ConsorciadoDoc, VendaDoc } from "@/lib/firestore/types";
import type { StatusInconsistencia, StatusOperacionalCota, StatusPosVenda } from "@/lib/types/domain";
import { DEFAULT_STATUS_POS_VENDA } from "@/lib/vendas/pos-venda";

type LegacyConsorciadoDoc = ConsorciadoDoc & {
  documento?: string;
  endereco?: string;
  /** Campos legados incorretos — removidos na sanitização. */
  status?: string;
  statusOperacional?: string;
};

const LEGACY_STATUS_MAP: Record<string, StatusOperacionalCota> = {
  RASCUNHO: "ATIVO",
  ENVIADA: "ATIVO",
  FECHADA: "ATIVO",
  CANCELADA: "CANCELADO",
  ATIVO: "ATIVO",
  INADIMPLENTE: "INADIMPLENTE",
  CANCELADO: "CANCELADO",
};

export function readConsorciadoCpfCnpj(raw: LegacyConsorciadoDoc): string {
  return raw.cpf_cnpj?.trim() || raw.documento?.trim() || "";
}

/** Remove campos operacionais que não pertencem ao perfil do consorciado. */
export function sanitizeConsorciadoDoc(raw: LegacyConsorciadoDoc): ConsorciadoDoc {
  return {
    nome: raw.nome,
    cpf_cnpj: readConsorciadoCpfCnpj(raw),
    telefone: raw.telefone,
    email: raw.email,
    criadoEm: raw.criadoEm,
  };
}

export function normalizeStatusOperacional(status: string | undefined): StatusOperacionalCota {
  if (!status) return "ATIVO";
  return LEGACY_STATUS_MAP[status] ?? "ATIVO";
}

/** @deprecated Use normalizeStatusOperacional */
export const normalizeVendaStatus = normalizeStatusOperacional;

type LegacyVendaDoc = VendaDoc & {
  /** @deprecated Use statusOperacional */
  status?: string;
  contrato?: string;
  grupo?: string;
  cota?: string;
  dataVencimento?: number;
  equipeId?: string;
  vendedorId?: string;
  statusInconsistencia?: string;
  statusPosVenda?: string;
  parcelasPagasCancelamento?: number | null;
};

function normalizeStatusInconsistencia(value: string | undefined): StatusInconsistencia {
  if (value === "INCONSISTENTE") return "INCONSISTENTE";
  return "CONSISTENTE";
}

function normalizeParcelasPagasCancelamento(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
}

function normalizeStatusPosVenda(value: string | undefined): StatusPosVenda {
  if (value === "FEITO") return "FEITO";
  return DEFAULT_STATUS_POS_VENDA;
}

export function resolveDataContrato(raw: {
  dataContrato?: string;
  dataVenda?: string | null;
  createdAt?: string;
}): string {
  return raw.dataContrato ?? raw.dataVenda ?? raw.createdAt ?? new Date(0).toISOString();
}

/** Espelha statusOperacional no campo legado `status` para queries Firestore existentes. */
export function withStatusOperacionalFields(statusOperacional: StatusOperacionalCota): {
  statusOperacional: StatusOperacionalCota;
  status: StatusOperacionalCota;
} {
  return { statusOperacional, status: statusOperacional };
}

export function normalizeVendaFields(raw: LegacyVendaDoc): Pick<
  VendaDoc,
  | "statusOperacional"
  | "status"
  | "statusInconsistencia"
  | "statusPosVenda"
  | "parcelasPagasCancelamento"
  | "numeroContrato"
  | "contrato"
  | "grupo"
  | "cota"
  | "dataVencimento"
  | "equipeId"
  | "vendedorId"
  | "dataContrato"
> {
  const numeroContrato = readNumeroContrato(raw);
  const matrizFields = withNumeroContratoFields(numeroContrato);

  const statusOperacional = normalizeStatusOperacional(raw.statusOperacional ?? raw.status);

  return {
    ...withStatusOperacionalFields(statusOperacional),
    statusInconsistencia: normalizeStatusInconsistencia(raw.statusInconsistencia),
    statusPosVenda: normalizeStatusPosVenda(raw.statusPosVenda),
    parcelasPagasCancelamento: normalizeParcelasPagasCancelamento(raw.parcelasPagasCancelamento),
    ...matrizFields,
    grupo: raw.grupo?.trim() || "",
    cota: raw.cota?.trim() || "",
    dataVencimento:
      typeof raw.dataVencimento === "number" && raw.dataVencimento >= 1 && raw.dataVencimento <= 31
        ? raw.dataVencimento
        : 10,
    equipeId: raw.equipeId?.trim() || "",
    vendedorId: raw.vendedorId?.trim() || "",
    dataContrato: resolveDataContrato(raw),
  };
}
