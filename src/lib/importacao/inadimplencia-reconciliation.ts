import type {
  ImportReconciliationItem,
  ImportReconciliationSummary,
} from "@/lib/importacao/types";

export type InadimplenciaPreprocessInput = {
  missingFromSpreadsheet: ImportReconciliationItem[];
  totalInadimplentesNoSistema: number;
  spreadsheetUniqueContractCount: number;
};

/**
 * Pré-processamento da conciliação de inadimplência:
 * compara contratos INADIMPLENTE no banco com os presentes na planilha.
 */
export function buildInadimplenciaReconciliationSummary(
  input: InadimplenciaPreprocessInput,
): ImportReconciliationSummary {
  const totalDivergentes = input.missingFromSpreadsheet.length;
  const totalInadimplentesCobertosNaPlanilha =
    input.totalInadimplentesNoSistema - totalDivergentes;

  return {
    missingFromSpreadsheet: input.missingFromSpreadsheet,
    totalInadimplentesNoSistema: input.totalInadimplentesNoSistema,
    totalInadimplentesCobertosNaPlanilha,
    totalContratosUnicosNaPlanilha: input.spreadsheetUniqueContractCount,
    totalDivergentes,
    requiresManualReconciliation: totalDivergentes > 0,
  };
}

export function describeInadimplenciaGap(summary: ImportReconciliationSummary): string {
  if (!summary.requiresManualReconciliation) {
    return `Todos os ${summary.totalInadimplentesNoSistema} contrato(s) inadimplente(s) do sistema constam na planilha.`;
  }
  return (
    `O sistema possui ${summary.totalInadimplentesNoSistema} contrato(s) inadimplente(s), ` +
    `mas apenas ${summary.totalInadimplentesCobertosNaPlanilha} constam na planilha. ` +
    `${summary.totalDivergentes} contrato(s) órfão(s) exigem definição manual (Ativo ou Cancelado).`
  );
}
