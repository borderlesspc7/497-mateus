import type { StatusOperacionalCota } from "@/lib/types/domain";

export type ImportRowInput = {
  numeroContrato: string;
  statusOperacional: StatusOperacionalCota;
  linha: number;
  parcelasPagasCancelamento?: number;
};

export type ImportPreviewMatched = {
  kind: "matched";
  linha: number;
  numeroContrato: string;
  statusAtual: StatusOperacionalCota;
  statusNovo: StatusOperacionalCota;
  vendaId: string;
  willUpdate: boolean;
  parcelasPagasCancelamento?: number;
};

export type ImportPreviewNotFound = {
  kind: "not_found";
  linha: number;
  numeroContrato: string;
  statusNovo: StatusOperacionalCota;
};

export type ImportPreviewInvalid = {
  kind: "invalid";
  linha: number;
  numeroContrato: string | null;
  error: string;
};

export type ImportPreviewResult = {
  matched: ImportPreviewMatched[];
  notFound: ImportPreviewNotFound[];
  invalid: ImportPreviewInvalid[];
  summary: {
    total: number;
    toUpdate: number;
    notFound: number;
    unchanged: number;
    invalid: number;
  };
  reconciliation: ImportReconciliationSummary;
};

/** Atualização de status na remessa — chaveada pelo número do contrato (matriz universal). */
export type ImportConfirmItem = {
  numeroContrato: string;
  statusOperacional: StatusOperacionalCota;
  parcelasPagasCancelamento?: number;
};

export type ImportConfirmResult = {
  updated: number;
  skipped: number;
};

export type ImportReconciliationItem = {
  numeroContrato: string;
  grupo: string;
  cota: string;
  consorciadoNome: string | null;
};

export type ImportReconciliationResolution = {
  numeroContrato: string;
  statusOperacional: "ATIVO" | "CANCELADO";
  parcelasPagasCancelamento?: number;
};

export type ImportReconciliationSummary = {
  missingFromSpreadsheet: ImportReconciliationItem[];
  /** Total de contratos INADIMPLENTE registrados no Firestore. */
  totalInadimplentesNoSistema: number;
  /** Inadimplentes do banco cujo número consta na planilha (cobertos pela remessa). */
  totalInadimplentesCobertosNaPlanilha: number;
  /** Contratos únicos presentes na planilha (qualquer status). */
  totalContratosUnicosNaPlanilha: number;
  /** Inadimplentes no banco ausentes na planilha — exigem conciliação manual. */
  totalDivergentes: number;
  /** Bloqueia confirmação até o usuário definir status de cada órfão. */
  requiresManualReconciliation: boolean;
};

export type ImportConfirmPayload = {
  updates: ImportConfirmItem[];
  spreadsheetContractNumbers: string[];
};
