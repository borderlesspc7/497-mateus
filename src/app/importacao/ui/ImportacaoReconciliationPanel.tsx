"use client";

import { AlertBanner } from "@/components/ui/AlertBanner";
import { describeInadimplenciaGap } from "@/lib/importacao/inadimplencia-reconciliation";
import type { ImportReconciliationSummary } from "@/lib/importacao/types";

type ImportacaoReconciliationPanelProps = {
  reconciliation: ImportReconciliationSummary;
  reconciliationGatePassed: boolean;
};

/** Banner inline quando não há órfãos, ou após o modal de conciliação ser concluído. */
export function ImportacaoReconciliationPanel({
  reconciliation,
  reconciliationGatePassed,
}: ImportacaoReconciliationPanelProps) {
  if (reconciliation.requiresManualReconciliation && !reconciliationGatePassed) {
    return (
      <AlertBanner tone="warning" title="Conciliação em andamento">
        A importação está bloqueada até você definir o status de{" "}
        {reconciliation.totalDivergentes} contrato(s) inadimplente(s) ausente(s) na planilha.
      </AlertBanner>
    );
  }

  if (reconciliation.requiresManualReconciliation && reconciliationGatePassed) {
    return (
      <AlertBanner tone="success" title="Conciliação concluída">
        {reconciliation.totalDivergentes} contrato(s) órfão(s) foram definidos manualmente e serão
        atualizados junto com a planilha ao confirmar a importação.
      </AlertBanner>
    );
  }

  return <AlertBanner tone="success">{describeInadimplenciaGap(reconciliation)}</AlertBanner>;
}
