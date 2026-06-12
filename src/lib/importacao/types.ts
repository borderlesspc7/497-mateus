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
};

export type ImportConfirmItem = {
  vendaId: string;
  statusOperacional: StatusOperacionalCota;
  parcelasPagasCancelamento?: number;
};

export type ImportConfirmResult = {
  updated: number;
  skipped: number;
};
