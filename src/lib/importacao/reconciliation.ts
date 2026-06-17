import { normalizeContrato } from "@/lib/importacao/status";
import type {
  ImportReconciliationItem,
  ImportReconciliationResolution,
  ImportRowInput,
} from "@/lib/importacao/types";

export function buildSpreadsheetContractSet(rows: ImportRowInput[]): Set<string> {
  const set = new Set<string>();
  for (const row of rows) {
    const numeroContrato = normalizeContrato(row.numeroContrato);
    if (numeroContrato) set.add(numeroContrato);
  }
  return set;
}

export function isReconciliationComplete(
  missing: ImportReconciliationItem[],
  resolutions: Record<string, ImportReconciliationResolution | undefined>,
): boolean {
  if (missing.length === 0) return true;

  return missing.every((item) => {
    const resolution = resolutions[item.numeroContrato];
    if (!resolution) return false;
    if (resolution.statusOperacional === "ATIVO") return true;
    if (resolution.statusOperacional === "CANCELADO") {
      return (
        resolution.parcelasPagasCancelamento !== undefined &&
        Number.isInteger(resolution.parcelasPagasCancelamento) &&
        resolution.parcelasPagasCancelamento >= 0
      );
    }
    return false;
  });
}

export function countPendingReconciliation(
  missing: ImportReconciliationItem[],
  resolutions: Record<string, ImportReconciliationResolution | undefined>,
): number {
  return missing.filter((item) => {
    const resolution = resolutions[item.numeroContrato];
    if (!resolution) return true;
    if (resolution.statusOperacional === "ATIVO") return false;
    if (resolution.statusOperacional === "CANCELADO") {
      return (
        resolution.parcelasPagasCancelamento === undefined ||
        !Number.isInteger(resolution.parcelasPagasCancelamento) ||
        resolution.parcelasPagasCancelamento < 0
      );
    }
    return true;
  }).length;
}
