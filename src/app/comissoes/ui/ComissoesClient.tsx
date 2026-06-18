"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  liberarExtrato,
  marcarExtratoPago,
  sincronizarExtratos,
} from "@/actions/comissoes";
import { DataListPanel } from "@/components/ui/DataListPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExtratoStatusBadge } from "@/components/ui/ExtratoStatusBadge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import {
  dataTableClass,
  formControlClass,
  secondaryActionClass,
  tableCellClass,
  tableHeadCellClass,
  tableRowClass,
  tableWrapClass,
} from "@/components/ui/list-panel-classes";
import type { ExtratoRow, ExtratoStatus } from "@/lib/types/domain";
import { formatMoneyPtBrFromCentavos } from "@/lib/validators/currency";

type ComissoesClientProps = {
  initialItems: ExtratoRow[];
};

export default function ComissoesClient({ initialItems }: ComissoesClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ExtratoStatus>("");
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      if (!q) return true;
      const hay = `${row.numeroContrato} ${row.vendaTitulo} ${row.consorciadoNome ?? ""} ${row.planoNome} ${row.vendedorNome ?? ""} ${row.parcelaLabel}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query, statusFilter]);

  const totais = useMemo(() => {
    const pendente = filtered
      .filter((r) => r.status === "PENDENTE")
      .reduce((s, r) => s + r.valorCentavos, 0);
    const liberado = filtered
      .filter((r) => r.status === "LIBERADO")
      .reduce((s, r) => s + r.valorCentavos, 0);
    const pago = filtered
      .filter((r) => r.status === "PAGO")
      .reduce((s, r) => s + r.valorCentavos, 0);
    return { pendente, liberado, pago };
  }, [filtered]);

  async function onSync() {
    setError(null);
    setSyncing(true);
    try {
      await sincronizarExtratos();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao sincronizar extratos.");
    } finally {
      setSyncing(false);
    }
  }

  async function onLiberar(id: string) {
    setError(null);
    setActionId(id);
    try {
      await liberarExtrato(id);
      setItems((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "LIBERADO" as const } : r)),
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao liberar.");
    } finally {
      setActionId(null);
    }
  }

  async function onMarcarPago(id: string) {
    setError(null);
    setActionId(id);
    try {
      await marcarExtratoPago(id);
      setItems((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "PAGO" as const } : r)),
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao marcar como pago.");
    } finally {
      setActionId(null);
    }
  }

  return (
    <DataListPanel
      toolbar={
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por contrato, consorciado, plano..."
            className={formControlClass("lg")}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className={formControlClass("sm")}
          >
            <option value="">Todos status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="LIBERADO">Liberado</option>
            <option value="PAGO">Pago</option>
          </select>
          <button
            type="button"
            onClick={() => void onSync()}
            disabled={syncing}
            className={secondaryActionClass()}
          >
            {syncing ? "Sincronizando..." : "Recalcular extratos"}
          </button>
        </>
      }
      error={
        error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null
      }
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {(
          [
            ["Pendente", totais.pendente, "border-zinc-200 bg-zinc-50"],
            ["Liberado", totais.liberado, "border-blue-200 bg-blue-50/50"],
            ["Pago", totais.pago, "border-emerald-200 bg-emerald-50/50"],
          ] as const
        ).map(([label, centavos, cardClass]) => (
          <div
            key={label}
            className={`rounded-2xl border p-4 ${cardClass}`}
          >
            <div className="text-xs font-medium text-zinc-500">{label}</div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-zinc-900">
              {formatMoneyPtBrFromCentavos(centavos)}
            </div>
          </div>
        ))}
      </div>

      {syncing ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <TableSkeleton rows={6} columns={8} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? "Nenhum extrato gerado" : "Nenhum resultado encontrado"}
          description={
            items.length === 0
              ? "Os extratos são gerados automaticamente ao registrar vendas ativas com plano e regras financeiras. Use Recalcular extratos para reprocessar vendas antigas."
              : "Ajuste os filtros ou recalcule os extratos."
          }
          action={
            items.length === 0 ? (
              <button
                type="button"
                onClick={() => void onSync()}
                disabled={syncing}
                className={secondaryActionClass()}
              >
                {syncing ? "Sincronizando..." : "Gerar extratos"}
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className={tableWrapClass()}>
          <table className={dataTableClass()}>
            <thead>
              <tr>
                <th className={tableHeadCellClass()}>Contrato</th>
                <th className={tableHeadCellClass()}>Consorciado</th>
                <th className={tableHeadCellClass()}>Plano</th>
                <th className={tableHeadCellClass()}>Vendedor</th>
                <th className={tableHeadCellClass()}>Crédito</th>
                <th className={tableHeadCellClass()}>%</th>
                <th className={tableHeadCellClass()}>Parcela</th>
                <th className={tableHeadCellClass()}>Valor</th>
                <th className={tableHeadCellClass()}>Status</th>
                <th className={`${tableHeadCellClass()} pr-0 text-right`}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, index) => (
                <tr key={row.id} className={tableRowClass(index)}>
                  <td className={`${tableCellClass()} font-medium text-zinc-900`}>
                    <Link
                      href={`/vendas/${row.vendaId}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {row.numeroContrato}
                    </Link>
                  </td>
                  <td className={tableCellClass()}>{row.consorciadoNome ?? "—"}</td>
                  <td className={tableCellClass()}>{row.planoNome}</td>
                  <td className={tableCellClass()}>
                    <div className="text-sm">{row.vendedorNome ?? "—"}</div>
                    {row.equipeNome ? (
                      <div className="text-xs text-zinc-500">{row.equipeNome}</div>
                    ) : null}
                  </td>
                  <td className={`${tableCellClass()} whitespace-nowrap tabular-nums`}>
                    {formatMoneyPtBrFromCentavos(row.creditoCentavos)}
                  </td>
                  <td className={`${tableCellClass()} tabular-nums`}>
                    {row.percentualComissao.toLocaleString("pt-BR")}%
                  </td>
                  <td className={tableCellClass()}>
                    {row.parcelaLabel}
                    <span className="text-xs text-zinc-500">
                      {" "}
                      / {row.parcelaTotal}
                    </span>
                  </td>
                  <td className={`${tableCellClass()} whitespace-nowrap tabular-nums font-medium ${row.valorCentavos < 0 ? "text-red-700" : ""}`}>
                    {formatMoneyPtBrFromCentavos(row.valorCentavos)}
                  </td>
                  <td className={tableCellClass()}>
                    <div className="flex flex-wrap items-center gap-2">
                      {row.tipo === "ESTORNO" ? (
                        <span className="inline-flex h-7 items-center rounded-full border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-800">
                          Estorno
                        </span>
                      ) : null}
                      <ExtratoStatusBadge status={row.status} />
                    </div>
                  </td>
                  <td className={`${tableCellClass()} pr-0 text-right`}>
                    <div className="flex justify-end gap-2">
                      {row.tipo === "ESTORNO" ? (
                        <span className="text-xs font-medium text-red-700">Débito automático</span>
                      ) : null}
                      {row.tipo !== "ESTORNO" && row.status === "PENDENTE" ? (
                        <button
                          type="button"
                          onClick={() => void onLiberar(row.id)}
                          disabled={actionId === row.id}
                          className={secondaryActionClass()}
                        >
                          {actionId === row.id ? "..." : "Liberar"}
                        </button>
                      ) : null}
                      {row.tipo !== "ESTORNO" && row.status === "LIBERADO" ? (
                        <button
                          type="button"
                          onClick={() => void onMarcarPago(row.id)}
                          disabled={actionId === row.id}
                          className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-3 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
                        >
                          {actionId === row.id ? "..." : "Marcar pago"}
                        </button>
                      ) : null}
                      {row.tipo !== "ESTORNO" && row.status === "PAGO" ? (
                        <span className="text-xs text-zinc-400">Concluído</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DataListPanel>
  );
}
