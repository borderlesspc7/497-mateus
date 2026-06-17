"use client";

import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  dataTableClass,
  formControlClass,
  secondaryActionClass,
  tableCellClass,
  tableHeadCellClass,
  tableRowClass,
  tableWrapClass,
} from "@/components/ui/list-panel-classes";
import { countPendingReconciliation } from "@/lib/importacao/reconciliation";
import type {
  ImportReconciliationItem,
  ImportReconciliationResolution,
  ImportReconciliationSummary,
} from "@/lib/importacao/types";

export type ImportacaoReconciliationTableProps = {
  reconciliation: ImportReconciliationSummary;
  resolutions: Record<string, ImportReconciliationResolution | undefined>;
  onResolveAtivo: (item: ImportReconciliationItem) => void;
  onResolveCancelado: (item: ImportReconciliationItem, parcelasPagas: number) => void;
  onClearResolution: (numeroContrato: string) => void;
};

export function ImportacaoReconciliationTable({
  reconciliation,
  resolutions,
  onResolveAtivo,
  onResolveCancelado,
  onClearResolution,
}: ImportacaoReconciliationTableProps) {
  const pendingCount = useMemo(
    () => countPendingReconciliation(reconciliation.missingFromSpreadsheet, resolutions),
    [reconciliation.missingFromSpreadsheet, resolutions],
  );

  const resolvedCount = reconciliation.totalDivergentes - pendingCount;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <p>
          <span className="font-semibold">{reconciliation.totalInadimplentesNoSistema}</span> inadimplente(s)
          no sistema ·{" "}
          <span className="font-semibold">{reconciliation.totalInadimplentesCobertosNaPlanilha}</span> na
          planilha ·{" "}
          <span className="font-semibold text-amber-900">{reconciliation.totalDivergentes}</span> órfão(s)
        </p>
        <p className="text-xs font-semibold uppercase tracking-wide">
          {pendingCount > 0
            ? `${resolvedCount} de ${reconciliation.totalDivergentes} definido(s)`
            : "Todos definidos"}
        </p>
      </div>

      <div className={tableWrapClass()}>
        <table className={dataTableClass()}>
          <thead>
            <tr>
              <th className={tableHeadCellClass()}>Contrato</th>
              <th className={tableHeadCellClass()}>Grupo</th>
              <th className={tableHeadCellClass()}>Cota</th>
              <th className={tableHeadCellClass()}>Consorciado</th>
              <th className={tableHeadCellClass()}>Status atual</th>
              <th className={tableHeadCellClass()}>Nova definição</th>
              <th className={`${tableHeadCellClass()} pr-0 text-right`}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {reconciliation.missingFromSpreadsheet.map((item, index) => {
              const resolution = resolutions[item.numeroContrato];
              return (
                <ReconciliationRow
                  key={item.numeroContrato}
                  item={item}
                  index={index}
                  resolution={resolution}
                  onResolveAtivo={() => onResolveAtivo(item)}
                  onResolveCancelado={(parcelasPagas) =>
                    onResolveCancelado(item, parcelasPagas)
                  }
                  onClearResolution={() => onClearResolution(item.numeroContrato)}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReconciliationRow({
  item,
  index,
  resolution,
  onResolveAtivo,
  onResolveCancelado,
  onClearResolution,
}: {
  item: ImportReconciliationItem;
  index: number;
  resolution: ImportReconciliationResolution | undefined;
  onResolveAtivo: () => void;
  onResolveCancelado: (parcelasPagas: number) => void;
  onClearResolution: () => void;
}) {
  const isResolved = Boolean(resolution);
  const isCancelado = resolution?.statusOperacional === "CANCELADO";
  const cancelParcelasInvalid =
    isCancelado &&
    (resolution?.parcelasPagasCancelamento === undefined ||
      !Number.isInteger(resolution.parcelasPagasCancelamento) ||
      resolution.parcelasPagasCancelamento < 0);

  return (
    <tr
      className={[
        tableRowClass(index),
        isResolved && !cancelParcelasInvalid ? "bg-emerald-50/70" : "bg-amber-50/70",
      ].join(" ")}
    >
      <td className={`${tableCellClass()} font-medium text-zinc-900`}>{item.numeroContrato}</td>
      <td className={tableCellClass()}>{item.grupo}</td>
      <td className={tableCellClass()}>{item.cota}</td>
      <td className={tableCellClass()}>{item.consorciadoNome ?? "—"}</td>
      <td className={tableCellClass()}>
        <StatusBadge status="INADIMPLENTE" />
      </td>
      <td className={tableCellClass()}>
        {resolution ? (
          <div className="space-y-1">
            <StatusBadge status={resolution.statusOperacional} />
            {isCancelado ? (
              <p className="text-xs text-zinc-600">
                Parcelas pagas: {resolution.parcelasPagasCancelamento ?? "—"}
              </p>
            ) : null}
          </div>
        ) : (
          <span className="text-xs font-semibold text-amber-800">Pendente — escolha Ativo ou Cancelado</span>
        )}
      </td>
      <td className={`${tableCellClass()} pr-0 text-right`}>
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className={[
                secondaryActionClass(),
                resolution?.statusOperacional === "ATIVO"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "",
              ].join(" ")}
              onClick={onResolveAtivo}
            >
              Ativo
            </button>
            <CanceladoAction
              key={`${item.numeroContrato}-${resolution?.parcelasPagasCancelamento ?? "empty"}`}
              selected={resolution?.statusOperacional === "CANCELADO"}
              parcelasPagas={resolution?.parcelasPagasCancelamento}
              onConfirm={onResolveCancelado}
            />
          </div>
          {isResolved ? (
            <button
              type="button"
              className="text-xs font-semibold text-zinc-500 underline-offset-2 hover:underline"
              onClick={onClearResolution}
            >
              Limpar
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function CanceladoAction({
  selected,
  parcelasPagas,
  onConfirm,
}: {
  selected: boolean;
  parcelasPagas?: number;
  onConfirm: (parcelasPagas: number) => void;
}) {
  const [parcelasInput, setParcelasInput] = useState(
    parcelasPagas !== undefined ? String(parcelasPagas) : "",
  );

  function confirmCancelado() {
    const value = Number.parseInt(parcelasInput, 10);
    if (!Number.isInteger(value) || value < 0) return;
    onConfirm(value);
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        step={1}
        value={parcelasInput}
        placeholder="Parcelas"
        aria-label="Parcelas pagas no cancelamento"
        className={`${formControlClass("sm")} h-9`}
        onChange={(event) => setParcelasInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          confirmCancelado();
        }}
      />
      <button
        type="button"
        className={[
          secondaryActionClass(),
          selected ? "border-red-300 bg-red-50 text-red-800" : "",
        ].join(" ")}
        onClick={confirmCancelado}
      >
        Cancelado
      </button>
    </div>
  );
}
