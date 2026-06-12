"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { updateVendaStatusInconsistencia, updateVendaStatusPosVenda } from "@/actions/vendas";
import { EmptyState } from "@/components/ui/EmptyState";
import { InconsistenciaBadge } from "@/components/ui/InconsistenciaBadge";
import { PosVendaBadge } from "@/components/ui/PosVendaBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formControlClass } from "@/components/ui/list-panel-classes";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  addHistoricoAtendimentoUniversal,
  subscribeHistoricoAtendimentoUniversal,
} from "@/lib/firestore/vendas-historico-client";
import type {
  HistoricoAtendimentoUniversalRow,
  StatusInconsistencia,
  StatusPosVenda,
  TipoRegistroAtendimento,
  VendaRow,
} from "@/lib/types/domain";
import {
  STATUS_INCONSISTENCIA_LABELS,
  TIPO_REGISTRO_LABELS,
  TIPO_REGISTRO_OPTIONS,
} from "@/lib/vendas/atendimento";
import { formatMoneyPtBrFromCentavos } from "@/lib/validators/currency";

type VendaAtendimentoDrawerProps = {
  venda: VendaRow | null;
  open: boolean;
  onClose: () => void;
  showInconsistenciaControls?: boolean;
  showPosVendaControls?: boolean;
  defaultTipoRegistro?: TipoRegistroAtendimento;
  onPosVendaCompleted?: (vendaId: string) => void;
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function tipoRegistroClass(tipo: TipoRegistroAtendimento) {
  switch (tipo) {
    case "COBRANCA":
      return "border-red-200 bg-red-50 text-red-800";
    case "COBRANCA_WHATSAPP":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "POS_VENDA":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "INCONSISTENCIA":
      return "border-amber-200 bg-amber-50 text-amber-800";
  }
}

function TimelineEntry({ item }: { item: HistoricoAtendimentoUniversalRow }) {
  return (
    <li className="relative pl-7 pb-6 last:pb-0">
      <span
        className="absolute left-0 top-2 h-2.5 w-2.5 rounded-full bg-zinc-900 ring-4 ring-white"
        aria-hidden
      />
      <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={[
              "inline-flex h-6 items-center rounded-full border px-2 text-[11px] font-semibold uppercase tracking-wide",
              tipoRegistroClass(item.tipoRegistro),
            ].join(" ")}
          >
            {TIPO_REGISTRO_LABELS[item.tipoRegistro]}
          </span>
          <time className="text-xs tabular-nums text-zinc-500" dateTime={item.dataRegistro}>
            {formatDateTime(item.dataRegistro)}
          </time>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
          {item.observacao}
        </p>
      </div>
    </li>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-2.5 w-2.5 shrink-0 rounded-full" />
          <Skeleton className="h-20 flex-1 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function VendaAtendimentoDrawer({
  venda,
  open,
  onClose,
  showInconsistenciaControls = false,
  showPosVendaControls = false,
  defaultTipoRegistro = "COBRANCA",
  onPosVendaCompleted,
}: VendaAtendimentoDrawerProps) {
  const router = useRouter();
  const [historico, setHistorico] = useState<HistoricoAtendimentoUniversalRow[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(true);
  const [historicoError, setHistoricoError] = useState<string | null>(null);
  const [tipoRegistro, setTipoRegistro] = useState<TipoRegistroAtendimento>(defaultTipoRegistro);
  const [observacao, setObservacao] = useState("");
  const [savingRegistro, setSavingRegistro] = useState(false);
  const [savingInconsistencia, setSavingInconsistencia] = useState(false);
  const [statusInconsistencia, setStatusInconsistencia] = useState<StatusInconsistencia>("CONSISTENTE");
  const [statusPosVenda, setStatusPosVenda] = useState<StatusPosVenda>("PENDENTE");
  const [marcarPosVendaFeito, setMarcarPosVendaFeito] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !venda) return;
    setTipoRegistro(defaultTipoRegistro);
    setObservacao("");
    setFormError(null);
    setStatusInconsistencia(venda.statusInconsistencia);
    setStatusPosVenda(venda.statusPosVenda);
    setMarcarPosVendaFeito(false);
    setLoadingHistorico(true);
    setHistoricoError(null);

    const unsub = subscribeHistoricoAtendimentoUniversal(
      venda.id,
      (items) => {
        setHistorico(items);
        setLoadingHistorico(false);
      },
      (error) => {
        setHistoricoError(error.message);
        setLoadingHistorico(false);
      },
    );
    return unsub;
  }, [open, venda, defaultTipoRegistro]);

  async function onAddRegistro() {
    if (!venda) return;
    setFormError(null);
    setSavingRegistro(true);
    try {
      const tipo = showPosVendaControls ? ("POS_VENDA" as const) : tipoRegistro;
      await addHistoricoAtendimentoUniversal(
        venda.id,
        venda.numeroContrato,
        tipo,
        observacao,
      );

      if (showPosVendaControls && marcarPosVendaFeito && statusPosVenda !== "FEITO") {
        const updated = await updateVendaStatusPosVenda(venda.id, "FEITO");
        setStatusPosVenda(updated.statusPosVenda);
        onPosVendaCompleted?.(venda.id);
      }

      setObservacao("");
      setMarcarPosVendaFeito(false);
      router.refresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Erro ao salvar registro.");
    } finally {
      setSavingRegistro(false);
    }
  }

  async function onToggleInconsistencia(next: StatusInconsistencia) {
    if (!venda) return;
    setSavingInconsistencia(true);
    setFormError(null);
    try {
      const updated = await updateVendaStatusInconsistencia(venda.id, next);
      setStatusInconsistencia(updated.statusInconsistencia);
      router.refresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Erro ao atualizar inconsistência.");
    } finally {
      setSavingInconsistencia(false);
    }
  }

  if (!open || !venda) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="venda-atendimento-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[1px]"
        aria-label="Fechar modal"
        onClick={onClose}
      />
      <div className="relative flex max-h-[min(90vh,880px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
        <header className="shrink-0 border-b border-zinc-200 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Cota / Contrato
              </p>
              <h2
                id="venda-atendimento-modal-title"
                className="mt-0.5 truncate text-lg font-semibold text-zinc-900"
              >
                {venda.numeroContrato}
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Grupo {venda.grupo} · Cota {venda.cota} · Venc. dia {venda.dataVencimento}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={venda.statusOperacional} />
            <InconsistenciaBadge status={statusInconsistencia} />
            {showPosVendaControls ? <PosVendaBadge status={statusPosVenda} /> : null}
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-600">
            <div>
              <dt className="text-zinc-500">Consorciado</dt>
              <dd className="font-medium text-zinc-800">{venda.consorciado?.nome ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Valor</dt>
              <dd className="font-medium tabular-nums text-zinc-800">
                {formatMoneyPtBrFromCentavos(venda.valorCentavos)}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Equipe</dt>
              <dd className="font-medium text-zinc-800">{venda.equipe?.nome ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Vendedor</dt>
              <dd className="font-medium text-zinc-800">{venda.vendedor?.nome ?? "—"}</dd>
            </div>
          </dl>
          <Link
            href={`/vendas/${venda.id}`}
            className="mt-3 inline-block text-xs font-semibold text-zinc-800 underline-offset-2 hover:underline"
          >
            Abrir ficha completa da venda →
          </Link>
        </header>

        {showInconsistenciaControls ? (
          <div className="shrink-0 border-b border-zinc-200 bg-zinc-50/80 px-5 py-3">
            <div className="text-xs font-medium text-zinc-600">Status de inconsistência</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["CONSISTENTE", "INCONSISTENTE"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled={savingInconsistencia || statusInconsistencia === value}
                  onClick={() => void onToggleInconsistencia(value)}
                  className={[
                    "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60",
                    statusInconsistencia === value
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
                  ].join(" ")}
                >
                  {STATUS_INCONSISTENCIA_LABELS[value]}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {showPosVendaControls && statusPosVenda === "FEITO" ? (
          <div className="shrink-0 border-b border-emerald-200 bg-emerald-50/80 px-5 py-3 text-xs font-medium text-emerald-800">
            Pós-venda concluído para esta venda.
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <h3 className="text-sm font-semibold text-zinc-900">Timeline de atendimento</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Registros universais desta cota, do mais recente ao mais antigo.
            </p>

            <div className="mt-4">
              {loadingHistorico ? (
                <TimelineSkeleton />
              ) : historicoError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {historicoError}
                </div>
              ) : historico.length === 0 ? (
                <EmptyState
                  title="Nenhum registro ainda"
                  description="Adicione a primeira interação de cobrança, pós-venda ou inconsistência abaixo."
                />
              ) : (
                <ol className="border-l border-zinc-200 ml-1">
                  {historico.map((item) => (
                    <TimelineEntry key={item.id} item={item} />
                  ))}
                </ol>
              )}
            </div>
          </div>

          <footer className="shrink-0 border-t border-zinc-200 bg-white px-5 py-4 sm:px-6">
            <div className="text-xs font-medium text-zinc-600">Novo registro</div>
            <div className="mt-2 grid gap-3">
              {!showPosVendaControls ? (
                <label className="block">
                  <span className="sr-only">Tipo</span>
                  <select
                    value={tipoRegistro}
                    onChange={(e) => setTipoRegistro(e.target.value as TipoRegistroAtendimento)}
                    className={formControlClass()}
                  >
                    {TIPO_REGISTRO_OPTIONS.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {TIPO_REGISTRO_LABELS[tipo]}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800">
                  Tipo: {TIPO_REGISTRO_LABELS.POS_VENDA}
                </div>
              )}
              <label className="block">
                <span className="sr-only">Observação</span>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder={
                    showPosVendaControls
                      ? "Ex.: Boas-vindas realizadas, checklist de ativação orientado"
                      : "Ex.: 11/12 — enviado WhatsApp cobrando parcela"
                  }
                  rows={3}
                  className="w-full resize-y rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-900 shadow-sm outline-none focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-300/50"
                />
              </label>
              {showPosVendaControls && statusPosVenda !== "FEITO" ? (
                <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={marcarPosVendaFeito}
                    onChange={(e) => setMarcarPosVendaFeito(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-zinc-300"
                  />
                  <span className="text-sm leading-snug text-zinc-800">
                    <span className="font-semibold">Pós-venda realizado com sucesso</span>
                    <span className="mt-0.5 block text-xs text-zinc-500">
                      Marca esta venda como concluída na fila de pós-venda ao salvar o registro.
                    </span>
                  </span>
                </label>
              ) : null}
            </div>
            {formError ? (
              <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                {formError}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => void onAddRegistro()}
              disabled={savingRegistro || !observacao.trim()}
              className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {savingRegistro ? "Salvando..." : "Adicionar registro"}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
