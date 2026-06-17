"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { confirmImportacaoStatus, previewImportacaoStatus } from "@/actions/importacao";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { FilterChipBar, FilterChipButton } from "@/components/ui/FilterChipButton";
import { PanelSectionHeader } from "@/components/ui/PanelSectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryChip } from "@/components/ui/SummaryChip";
import {
  dataTableClass,
  panelClass,
  panelInsetClass,
  primaryActionClass,
  secondaryActionClass,
  tableCellClass,
  tableHeadCellClass,
  tableRowClass,
  tableWrapClass,
} from "@/components/ui/list-panel-classes";
import { parseImportFile } from "@/lib/importacao/parse-import-file";
import {
  buildSpreadsheetContractSet,
  isReconciliationComplete,
} from "@/lib/importacao/reconciliation";
import type {
  ImportConfirmItem,
  ImportPreviewResult,
  ImportReconciliationItem,
  ImportReconciliationResolution,
  ImportRowInput,
} from "@/lib/importacao/types";
import { ImportacaoReconciliationModal } from "./ImportacaoReconciliationModal";
import { ImportacaoReconciliationPanel } from "./ImportacaoReconciliationPanel";

type ImportPhase = "idle" | "parsing" | "previewing" | "confirming" | "done";

type PreviewFilter = "all" | "matched" | "not_found" | "invalid";

export default function ImportacaoClient() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<ImportPhase>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<ImportRowInput[]>([]);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmResult, setConfirmResult] = useState<{ updated: number; skipped: number } | null>(
    null,
  );
  const [filter, setFilter] = useState<PreviewFilter>("all");
  const [reconciliationResolutions, setReconciliationResolutions] = useState<
    Record<string, ImportReconciliationResolution | undefined>
  >({});
  const [reconciliationModalOpen, setReconciliationModalOpen] = useState(false);
  const [reconciliationGatePassed, setReconciliationGatePassed] = useState(false);

  const isBusy = phase === "parsing" || phase === "previewing" || phase === "confirming";

  const previewRows = useMemo(() => {
    if (!preview) return [];
    if (filter === "matched") {
      return preview.matched.map((item) => ({ type: "matched" as const, item }));
    }
    if (filter === "not_found") {
      return preview.notFound.map((item) => ({ type: "not_found" as const, item }));
    }
    if (filter === "invalid") {
      return preview.invalid.map((item) => ({ type: "invalid" as const, item }));
    }
    return [
      ...preview.matched.map((item) => ({ type: "matched" as const, item })),
      ...preview.notFound.map((item) => ({ type: "not_found" as const, item })),
      ...preview.invalid.map((item) => ({ type: "invalid" as const, item })),
    ].sort((a, b) => {
      const linhaA =
        a.type === "matched" ? a.item.linha : a.type === "not_found" ? a.item.linha : a.item.linha;
      const linhaB =
        b.type === "matched" ? b.item.linha : b.type === "not_found" ? b.item.linha : b.item.linha;
      return linhaA - linhaB;
    });
  }, [preview, filter]);

  const resetState = useCallback(() => {
    setPhase("idle");
    setFileName(null);
    setParseErrors([]);
    setParseWarnings([]);
    setParsedRows([]);
    setPreview(null);
    setConfirmError(null);
    setConfirmResult(null);
    setFilter("all");
    setReconciliationResolutions({});
    setReconciliationModalOpen(false);
    setReconciliationGatePassed(false);
  }, []);

  const reconciliationComplete = useMemo(() => {
    if (!preview) return true;
    return isReconciliationComplete(
      preview.reconciliation.missingFromSpreadsheet,
      reconciliationResolutions,
    );
  }, [preview, reconciliationResolutions]);

  const requiresReconciliationGate = Boolean(
    preview?.reconciliation.requiresManualReconciliation,
  );

  const canConfirmImport = useMemo(() => {
    if (!preview || phase === "done") return false;
    if (!reconciliationComplete) return false;
    if (requiresReconciliationGate && !reconciliationGatePassed) return false;
    const spreadsheetUpdates = preview.matched.filter((item) => item.willUpdate).length;
    const reconciliationUpdates = preview.reconciliation.missingFromSpreadsheet.filter(
      (item) => reconciliationResolutions[item.numeroContrato],
    ).length;
    return spreadsheetUpdates + reconciliationUpdates > 0;
  }, [
    phase,
    preview,
    reconciliationComplete,
    requiresReconciliationGate,
    reconciliationGatePassed,
    reconciliationResolutions,
  ]);

  const processFile = useCallback(async (file: File) => {
    resetState();
    setFileName(file.name);
    setPhase("parsing");

    try {
      const parsed = await parseImportFile(file);
      setParseWarnings(parsed.warnings);

      if (parsed.errors.length > 0) {
        setParseErrors(parsed.errors);
        setPhase("idle");
        return;
      }

      setPhase("previewing");
      const result = await previewImportacaoStatus(parsed.rows);
      setParsedRows(parsed.rows);
      setPreview(result);
      setReconciliationResolutions({});
      setReconciliationGatePassed(false);
      setReconciliationModalOpen(result.reconciliation.requiresManualReconciliation);
      setPhase("idle");
    } catch (error) {
      setParseErrors([
        error instanceof Error ? error.message : "Erro inesperado ao processar o arquivo.",
      ]);
      setPhase("idle");
    }
  }, [resetState]);

  const onFileSelected = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file || isBusy) return;
      void processFile(file);
    },
    [isBusy, processFile],
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      if (isBusy) return;
      onFileSelected(event.dataTransfer.files);
    },
    [isBusy, onFileSelected],
  );

  async function onConfirmImport() {
    if (!preview || !canConfirmImport) return;

    setConfirmError(null);
    setPhase("confirming");

    const spreadsheetUpdates: ImportConfirmItem[] = preview.matched
      .filter((item) => item.willUpdate)
      .map((item) => ({
        numeroContrato: item.numeroContrato,
        statusOperacional: item.statusNovo,
        parcelasPagasCancelamento: item.parcelasPagasCancelamento,
      }));

    const reconciliationUpdates: ImportConfirmItem[] = preview.reconciliation.missingFromSpreadsheet
      .map((item) => reconciliationResolutions[item.numeroContrato])
      .filter((item): item is ImportReconciliationResolution => Boolean(item))
      .map((item) => ({
        numeroContrato: item.numeroContrato,
        statusOperacional: item.statusOperacional,
        parcelasPagasCancelamento: item.parcelasPagasCancelamento,
      }));

    const updates = [...spreadsheetUpdates, ...reconciliationUpdates];

    try {
      const result = await confirmImportacaoStatus({
        updates,
        spreadsheetContractNumbers: [...buildSpreadsheetContractSet(parsedRows)],
      });
      setConfirmResult(result);
      setPhase("done");
      router.refresh();
    } catch (error) {
      setConfirmError(
        error instanceof Error ? error.message : "Erro ao confirmar a importação.",
      );
      setPhase("idle");
    }
  }

  function resolveReconciliationAtivo(item: ImportReconciliationItem) {
    setReconciliationResolutions((current) => ({
      ...current,
      [item.numeroContrato]: {
        numeroContrato: item.numeroContrato,
        statusOperacional: "ATIVO",
      },
    }));
  }

  function resolveReconciliationCancelado(item: ImportReconciliationItem, parcelasPagas: number) {
    setReconciliationResolutions((current) => ({
      ...current,
      [item.numeroContrato]: {
        numeroContrato: item.numeroContrato,
        statusOperacional: "CANCELADO",
        parcelasPagasCancelamento: parcelasPagas,
      },
    }));
  }

  function clearReconciliationResolution(numeroContrato: string) {
    setReconciliationResolutions((current) => {
      const next = { ...current };
      delete next[numeroContrato];
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className={panelClass()}>
        <PanelSectionHeader
          title="Upload da remessa"
          description={
            <>
              Arraste um arquivo .csv ou .xlsx com as colunas{" "}
              <span className="font-semibold">CONTRATO</span> e{" "}
              <span className="font-semibold">STATUS</span> (ATIVO, INADIMPLENTE ou CANCELADO).
              Para cancelamentos, inclua também <span className="font-semibold">PARCELAS_PAGAS</span>.
              Contratos inadimplentes no sistema que não constarem na remessa exigirão conciliação manual.
            </>
          }
        />

        <div className={`py-4 sm:py-5 ${panelInsetClass()}`}>
          <div
            role="button"
            tabIndex={0}
            onDragOver={(event) => {
              event.preventDefault();
              if (!isBusy) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
            onClick={() => {
              if (!isBusy) inputRef.current?.click();
            }}
            className={[
              "flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
              isDragging
                ? "border-emerald-400 bg-emerald-50"
                : "border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100/80",
              isBusy ? "pointer-events-none opacity-60" : "",
            ].join(" ")}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              disabled={isBusy}
              onChange={(event) => onFileSelected(event.target.files)}
            />

            {phase === "parsing" || phase === "previewing" ? (
              <>
                <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-800" />
                <p className="text-sm font-medium text-zinc-800">
                  {phase === "parsing" ? "Lendo arquivo..." : "Gerando pré-visualização..."}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-zinc-900">
                  Arraste o arquivo aqui ou clique para selecionar
                </p>
                <p className="mt-2 text-xs text-zinc-500">CSV ou Excel (.xlsx) · até 10.000 linhas</p>
                {fileName ? (
                  <p className="mt-4 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700">
                    {fileName}
                  </p>
                ) : null}
              </>
            )}
          </div>

          {parseErrors.length > 0 ? (
            <AlertBanner tone="error" title="Erros no arquivo" className="mt-4">
              <ul className="list-disc space-y-1 pl-5">
                {parseErrors.slice(0, 8).map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
              {parseErrors.length > 8 ? (
                <p className="mt-2 text-xs">... e mais {parseErrors.length - 8} erro(s).</p>
              ) : null}
            </AlertBanner>
          ) : null}

          {parseWarnings.length > 0 ? (
            <AlertBanner tone="warning" title="Avisos" className="mt-4">
              <ul className="list-disc space-y-1 pl-5">
                {parseWarnings.slice(0, 5).map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
              {parseWarnings.length > 5 ? (
                <p className="mt-2 text-xs">... e mais {parseWarnings.length - 5} aviso(s).</p>
              ) : null}
            </AlertBanner>
          ) : null}
        </div>
      </div>

      {preview ? (
        <>
          <ImportacaoReconciliationModal
            open={reconciliationModalOpen}
            reconciliation={preview.reconciliation}
            resolutions={reconciliationResolutions}
            onResolveAtivo={resolveReconciliationAtivo}
            onResolveCancelado={resolveReconciliationCancelado}
            onClearResolution={clearReconciliationResolution}
            onContinue={() => {
              setReconciliationModalOpen(false);
              setReconciliationGatePassed(true);
            }}
          />

          <ImportacaoReconciliationPanel
            reconciliation={preview.reconciliation}
            reconciliationGatePassed={reconciliationGatePassed}
          />

          <div
            className={[
              panelClass(),
              requiresReconciliationGate && !reconciliationGatePassed
                ? "pointer-events-none opacity-50"
                : "",
            ].join(" ")}
          >
            <PanelSectionHeader
              title="Pré-visualização"
              description="Revise os registros antes de confirmar. Contratos encontrados aparecem em verde; ausentes no sistema, em amarelo."
              actions={
                <>
                  <SummaryChip label="Total" value={preview.summary.total} />
                  <SummaryChip label="Atualizar" value={preview.summary.toUpdate} tone="green" />
                  <SummaryChip label="Sem alteração" value={preview.summary.unchanged} />
                  <SummaryChip label="Não encontrados" value={preview.summary.notFound} tone="yellow" />
                  {preview.summary.invalid > 0 ? (
                    <SummaryChip label="Inválidos" value={preview.summary.invalid} tone="red" />
                  ) : null}
                  {preview.reconciliation.requiresManualReconciliation ? (
                    <SummaryChip
                      label="Órfãos"
                      value={preview.reconciliation.totalDivergentes}
                      tone="yellow"
                    />
                  ) : null}
                  {preview.reconciliation.totalInadimplentesNoSistema > 0 ? (
                    <SummaryChip
                      label="Inadimpl. sistema"
                      value={preview.reconciliation.totalInadimplentesNoSistema}
                    />
                  ) : null}
                </>
              }
            />

            <div className={`border-b border-zinc-100 py-4 ${panelInsetClass()}`}>
              <FilterChipBar>
                <FilterChipButton active={filter === "all"} onClick={() => setFilter("all")}>
                  Todos ({preview.summary.total})
                </FilterChipButton>
                <FilterChipButton active={filter === "matched"} onClick={() => setFilter("matched")}>
                  Encontrados ({preview.matched.length})
                </FilterChipButton>
                <FilterChipButton active={filter === "not_found"} onClick={() => setFilter("not_found")}>
                  Não encontrados ({preview.notFound.length})
                </FilterChipButton>
                {preview.invalid.length > 0 ? (
                  <FilterChipButton active={filter === "invalid"} onClick={() => setFilter("invalid")}>
                    Inválidos ({preview.invalid.length})
                  </FilterChipButton>
                ) : null}
              </FilterChipBar>
            </div>

            <div className={`py-4 sm:py-5 ${panelInsetClass()}`}>
              <div className={tableWrapClass()}>
                <table className={dataTableClass()}>
                  <thead>
                    <tr>
                      <th className={tableHeadCellClass()}>Linha</th>
                      <th className={tableHeadCellClass()}>Contrato</th>
                      <th className={tableHeadCellClass()}>Status atual</th>
                      <th className={tableHeadCellClass()}>Status importado</th>
                      <th className={tableHeadCellClass()}>Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={`${tableCellClass()} text-zinc-500`}>
                          Nenhum registro neste filtro.
                        </td>
                      </tr>
                    ) : (
                      previewRows.map((row, index) => {
                        if (row.type === "matched") {
                          const { item } = row;
                          return (
                            <tr
                              key={`matched-${item.vendaId}-${item.linha}`}
                              className={[
                                tableRowClass(index),
                                item.willUpdate ? "bg-emerald-50/70" : "",
                              ].join(" ")}
                            >
                              <td className={tableCellClass()}>{item.linha}</td>
                              <td className={`${tableCellClass()} font-medium text-zinc-900`}>
                                {item.numeroContrato}
                              </td>
                              <td className={tableCellClass()}>
                                <StatusBadge status={item.statusAtual} />
                              </td>
                              <td className={tableCellClass()}>
                                <StatusBadge status={item.statusNovo} />
                              </td>
                              <td className={tableCellClass()}>
                                {item.willUpdate ? (
                                  <span className="text-xs font-semibold text-emerald-700">
                                    Será atualizado
                                  </span>
                                ) : (
                                  <span className="text-xs text-zinc-500">Sem alteração</span>
                                )}
                              </td>
                            </tr>
                          );
                        }

                        if (row.type === "not_found") {
                          const { item } = row;
                          return (
                            <tr
                              key={`not-found-${item.numeroContrato}-${item.linha}`}
                              className={[tableRowClass(index), "bg-amber-50/80"].join(" ")}
                            >
                              <td className={tableCellClass()}>{item.linha}</td>
                              <td className={`${tableCellClass()} font-medium text-zinc-900`}>
                                {item.numeroContrato}
                              </td>
                              <td className={tableCellClass()}>—</td>
                              <td className={tableCellClass()}>
                                <StatusBadge status={item.statusNovo} />
                              </td>
                              <td className={tableCellClass()}>
                                <span className="text-xs font-semibold text-amber-800">
                                  Contrato não encontrado
                                </span>
                              </td>
                            </tr>
                          );
                        }

                        const { item } = row;
                        return (
                          <tr
                            key={`invalid-${item.linha}`}
                            className={[tableRowClass(index), "bg-red-50/60"].join(" ")}
                          >
                            <td className={tableCellClass()}>{item.linha}</td>
                            <td className={tableCellClass()}>{item.numeroContrato ?? "—"}</td>
                            <td className={tableCellClass()}>—</td>
                            <td className={tableCellClass()}>—</td>
                            <td className={tableCellClass()}>
                              <span className="text-xs font-semibold text-red-700">{item.error}</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-zinc-600">
                  {requiresReconciliationGate && !reconciliationGatePassed
                    ? "Complete a conciliação no modal para liberar a confirmação."
                    : !reconciliationComplete
                      ? `Conciliação pendente: defina o status de ${preview.reconciliation.totalDivergentes} contrato(s) ausente(s) na planilha.`
                      : preview.summary.toUpdate > 0 ||
                          preview.reconciliation.missingFromSpreadsheet.some(
                            (item) => reconciliationResolutions[item.numeroContrato],
                          )
                        ? `${
                            preview.summary.toUpdate +
                            preview.reconciliation.missingFromSpreadsheet.filter(
                              (item) => reconciliationResolutions[item.numeroContrato],
                            ).length
                          } contrato(s) serão atualizados após a confirmação.`
                        : "Nenhuma alteração pendente para confirmar."}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={secondaryActionClass()}
                    disabled={isBusy}
                    onClick={resetState}
                  >
                    Nova importação
                  </button>
                  <button
                    type="button"
                    className={primaryActionClass()}
                    disabled={isBusy || !canConfirmImport}
                    onClick={() => void onConfirmImport()}
                  >
                    {phase === "confirming" ? "Confirmando..." : "Confirmar importação"}
                  </button>
                </div>
              </div>

              {confirmError ? (
                <AlertBanner tone="error" className="mt-4">
                  {confirmError}
                </AlertBanner>
              ) : null}

              {confirmResult ? (
                <AlertBanner tone="success" className="mt-4">
                  Importação concluída: {confirmResult.updated} venda(s) atualizada(s)
                  {confirmResult.skipped > 0
                    ? ` · ${confirmResult.skipped} ignorada(s) (já estavam no status ou não existiam)`
                    : ""}
                  .
                </AlertBanner>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
