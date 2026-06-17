"use client";

import { useEffect, useMemo } from "react";
import { primaryCtaClass } from "@/components/page-flow/button-classes";
import { secondaryActionClass } from "@/components/ui/list-panel-classes";
import { describeInadimplenciaGap } from "@/lib/importacao/inadimplencia-reconciliation";
import { isReconciliationComplete } from "@/lib/importacao/reconciliation";
import type {
  ImportReconciliationItem,
  ImportReconciliationResolution,
  ImportReconciliationSummary,
} from "@/lib/importacao/types";
import { ImportacaoReconciliationTable } from "./ImportacaoReconciliationTable";

type ImportacaoReconciliationModalProps = {
  open: boolean;
  reconciliation: ImportReconciliationSummary;
  resolutions: Record<string, ImportReconciliationResolution | undefined>;
  onResolveAtivo: (item: ImportReconciliationItem) => void;
  onResolveCancelado: (item: ImportReconciliationItem, parcelasPagas: number) => void;
  onClearResolution: (numeroContrato: string) => void;
  onContinue: () => void;
};

export function ImportacaoReconciliationModal({
  open,
  reconciliation,
  resolutions,
  onResolveAtivo,
  onResolveCancelado,
  onClearResolution,
  onContinue,
}: ImportacaoReconciliationModalProps) {
  const reconciliationComplete = useMemo(
    () => isReconciliationComplete(reconciliation.missingFromSpreadsheet, resolutions),
    [reconciliation.missingFromSpreadsheet, resolutions],
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reconciliation-modal-title"
    >
      <div className="absolute inset-0 bg-zinc-900/55 backdrop-blur-[2px]" aria-hidden />

      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-2xl sm:rounded-2xl">
        <header className="border-b border-amber-200 bg-amber-50 px-5 py-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            Importação bloqueada — conciliação obrigatória
          </p>
          <h2 id="reconciliation-modal-title" className="mt-1 text-lg font-semibold text-zinc-900">
            Cotas inadimplentes ausentes na planilha
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            {describeInadimplenciaGap(reconciliation)} Para cada contrato listado abaixo, informe se
            a situação atual é <span className="font-semibold">Ativo</span> (pagamento regularizado)
            ou <span className="font-semibold">Cancelado</span> (com parcelas pagas).
          </p>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <ImportacaoReconciliationTable
            reconciliation={reconciliation}
            resolutions={resolutions}
            onResolveAtivo={onResolveAtivo}
            onResolveCancelado={onResolveCancelado}
            onClearResolution={onClearResolution}
          />
        </div>

        <footer className="flex flex-col gap-3 border-t border-zinc-100 bg-zinc-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-zinc-600">
            {reconciliationComplete
              ? "Conciliação concluída. Você pode liberar a importação e confirmar o lote."
              : `Defina o status de todos os ${reconciliation.totalDivergentes} contrato(s) órfão(s) para continuar.`}
          </p>
          <button
            type="button"
            className={reconciliationComplete ? primaryCtaClass() : secondaryActionClass()}
            disabled={!reconciliationComplete}
            onClick={onContinue}
          >
            {reconciliationComplete ? "Liberar e continuar importação" : "Conciliação pendente"}
          </button>
        </footer>
      </div>
    </div>
  );
}
