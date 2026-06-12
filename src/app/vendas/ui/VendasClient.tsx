"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { deleteVenda, listVendasPaginated } from "@/actions/vendas";
import { DataListPanel } from "@/components/ui/DataListPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PendenciaBadge } from "@/components/vendas/PendenciaBadge";
import {
  dangerActionClass,
  dataTableClass,
  formControlClass,
  primaryActionClass,
  secondaryActionClass,
  tableCellClass,
  tableHeadCellClass,
  tableRowClass,
  tableWrapClass,
} from "@/components/ui/list-panel-classes";
import type { VendasListPage } from "@/lib/firestore/repository";
import type { AdministradoraMini, VendaRow } from "@/lib/types/domain";
import {
  useVendasPaginatedList,
} from "@/lib/vendas/use-vendas-paginated-list";
import { PaginatedListFooter } from "@/components/ui/PaginatedListFooter";
import { formatMoneyPtBrFromCentavos } from "@/lib/validators/currency";
import type { VendasListFilters } from "@/lib/firestore/repository";

const VENDAS_DEFAULT_FILTERS: VendasListFilters = {};

type VendasClientProps = {
  initialPage: VendasListPage;
  initialAdministradoras: AdministradoraMini[];
};

export default function VendasClient({
  initialPage,
  initialAdministradoras,
}: VendasClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusOperacional, setStatusOperacional] = useState<"" | VendaRow["statusOperacional"]>("");
  const [administradoraId, setAdministradoraId] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    visibleItems,
    hasMore,
    isLoadingMore,
    isResetting,
    error,
    setError,
    loadMore,
    resetAndFetch,
    removeItem,
  } = useVendasPaginatedList<VendaRow>({
    initialPage,
    initialFilters: VENDAS_DEFAULT_FILTERS,
    fetchPage: listVendasPaginated,
    clientFilter: useCallback(
      (items: VendaRow[]) => {
        const q = query.trim().toLowerCase();
        return items.filter((v) => {
          if (!q) return true;
          const hay = `${v.titulo} ${v.numeroContrato} ${v.grupo} ${v.cota} ${v.consorciado?.nome ?? ""} ${v.consorciado?.cpf_cnpj ?? ""} ${v.administradora?.nome ?? ""} ${v.plano?.nome ?? ""}`.toLowerCase();
          return hay.includes(q);
        });
      },
      [query],
    ),
  });

  const skipInitialFilterFetch = useRef(true);

  useEffect(() => {
    const nextFilters = {
      ...(statusOperacional ? { statusOperacional } : {}),
      ...(administradoraId ? { administradoraId } : {}),
    };

    if (skipInitialFilterFetch.current) {
      skipInitialFilterFetch.current = false;
      return;
    }

    void resetAndFetch(nextFilters);
  }, [statusOperacional, administradoraId, resetAndFetch]);

  async function onDelete(id: string) {
    if (!confirm("Excluir venda?")) return;
    setError(null);
    setDeletingId(id);
    try {
      await deleteVenda(id);
      removeItem(id);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir.");
    } finally {
      setDeletingId(null);
    }
  }

  const showEmpty = !isResetting && visibleItems.length === 0;
  const hasServerFilters = Boolean(statusOperacional || administradoraId);

  return (
    <DataListPanel
      toolbar={
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por contrato, grupo, cota ou consorciado..."
            className={formControlClass("lg")}
          />
          <select
            value={administradoraId}
            onChange={(e) => setAdministradoraId(e.target.value)}
            className={formControlClass("md")}
          >
            <option value="">Todas administradoras</option>
            {initialAdministradoras.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
          <select
            value={statusOperacional}
            onChange={(e) => setStatusOperacional(e.target.value as typeof statusOperacional)}
            className={formControlClass("sm")}
          >
            <option value="">Todos status</option>
            <option value="ATIVO">Ativo</option>
            <option value="INADIMPLENTE">Inadimplente</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
          <Link href="/vendas/nova" className={primaryActionClass()}>
            Nova venda
          </Link>
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
      {isResetting ? (
        <TableSkeleton rows={8} columns={6} />
      ) : showEmpty ? (
        <EmptyState
          title={
            !hasServerFilters && !query.trim()
              ? "Nenhuma venda cadastrada"
              : "Nenhum resultado encontrado"
          }
          description={
            !hasServerFilters && !query.trim()
              ? "Cadastre a primeira venda vinculada a um consorciado e administradora."
              : "Ajuste os filtros ou o termo de busca para ver outros registros."
          }
          action={
            !hasServerFilters && !query.trim() ? (
              <Link href="/vendas/nova" className={primaryActionClass()}>
                Nova venda
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className={tableWrapClass()}>
            <table className={dataTableClass()}>
              <thead>
                <tr>
                  <th className={tableHeadCellClass()}>Contrato</th>
                  <th className={tableHeadCellClass()}>Grupo / Cota</th>
                  <th className={tableHeadCellClass()}>Consorciado</th>
                  <th className={tableHeadCellClass()}>Equipe / Vendedor</th>
                  <th className={tableHeadCellClass()}>Administradora</th>
                  <th className={tableHeadCellClass()}>Plano</th>
                  <th className={tableHeadCellClass()}>Status</th>
                  <th className={tableHeadCellClass()}>Pós-venda</th>
                  <th className={tableHeadCellClass()}>Valor</th>
                  <th className={tableHeadCellClass()}>Data da venda</th>
                  <th className={tableHeadCellClass()}>Criado em</th>
                  <th className={`${tableHeadCellClass()} pr-0 text-right`}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((v, index) => (
                  <tr key={v.id} className={tableRowClass(index)}>
                    <td className={`${tableCellClass()} font-medium text-zinc-900`}>{v.numeroContrato}</td>
                    <td className={tableCellClass()}>
                      <div className="leading-5">
                        <div className="text-zinc-900">
                          {v.grupo} / {v.cota}
                        </div>
                        <div className="text-xs text-zinc-500">Venc. dia {v.dataVencimento}</div>
                      </div>
                    </td>
                    <td className={tableCellClass()}>
                      <div className="leading-5">
                        {v.consorciado ? (
                          <Link
                            href={`/consorciados/${v.consorciado.id}`}
                            className="font-medium text-zinc-900 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-sm"
                          >
                            {v.consorciado.nome}
                          </Link>
                        ) : (
                          <div className="text-zinc-800">—</div>
                        )}
                        {v.consorciado?.cpf_cnpj ? (
                          <div className="text-xs text-zinc-500">{v.consorciado.cpf_cnpj}</div>
                        ) : null}
                      </div>
                    </td>
                    <td className={tableCellClass()}>
                      <div className="leading-5">
                        <div className="text-zinc-900">{v.equipe?.nome ?? "—"}</div>
                        <div className="text-xs text-zinc-500">{v.vendedor?.nome ?? "—"}</div>
                      </div>
                    </td>
                    <td className={tableCellClass()}>
                      <div className="leading-5">
                        <Link
                          href={`/administradoras/${v.administradoraId}`}
                          className="font-medium text-zinc-900 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-sm"
                        >
                          {v.administradora?.nome ?? "—"}
                        </Link>
                        <div className="text-xs text-zinc-500">{v.administradora?.cnpj ?? ""}</div>
                      </div>
                    </td>
                    <td className={tableCellClass()}>
                      <div className="leading-5">
                        {v.plano ? (
                          <Link
                            href={`/planos/${v.plano.id}`}
                            className="font-medium text-zinc-900 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-sm"
                          >
                            {v.plano.nome}
                          </Link>
                        ) : (
                          <div className="text-zinc-800">—</div>
                        )}
                        {v.plano?.tipoBem ? (
                          <div className="text-xs text-zinc-500">{v.plano.tipoBem}</div>
                        ) : null}
                      </div>
                    </td>
                    <td className={tableCellClass()}>
                      <StatusBadge status={v.statusOperacional} />
                    </td>
                    <td className={tableCellClass()}>
                      <PendenciaBadge venda={v} />
                    </td>
                    <td className={`${tableCellClass()} whitespace-nowrap tabular-nums`}>
                      {formatMoneyPtBrFromCentavos(v.valorCentavos)}
                    </td>
                    <td className={`${tableCellClass()} whitespace-nowrap`}>
                      {v.dataVenda ? new Date(v.dataVenda).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className={`${tableCellClass()} whitespace-nowrap`}>
                      {new Date(v.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className={`${tableCellClass()} pr-0 text-right`}>
                      <div className="flex justify-end gap-2">
                        <Link href={`/vendas/${v.id}`} className={secondaryActionClass()}>
                          Editar
                        </Link>
                        <button
                          type="button"
                          onClick={() => void onDelete(v.id)}
                          disabled={deletingId === v.id}
                          className={dangerActionClass()}
                        >
                          {deletingId === v.id ? "Excluindo..." : "Excluir"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginatedListFooter
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={() => void loadMore()}
            columns={6}
            skeletonRows={4}
          />
        </>
      )}
    </DataListPanel>
  );
}
