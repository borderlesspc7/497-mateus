"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listVendasPaginated } from "@/actions/vendas";
import { DataListPanel } from "@/components/ui/DataListPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { InconsistenciaBadge } from "@/components/ui/InconsistenciaBadge";
import { PosVendaBadge } from "@/components/ui/PosVendaBadge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { VendaAtendimentoDrawer } from "@/components/vendas/VendaAtendimentoDrawer";
import {
  dataTableClass,
  formControlClass,
  secondaryActionClass,
  tableCellClass,
  tableHeadCellClass,
  tableRowClass,
  tableWrapClass,
} from "@/components/ui/list-panel-classes";
import type { VendasListFilters, VendasListPage } from "@/lib/firestore/repository";
import type { StatusInconsistencia, StatusOperacionalCota, StatusPosVenda, VendaRow } from "@/lib/types/domain";
import {
  useVendasPaginatedList,
} from "@/lib/vendas/use-vendas-paginated-list";
import { PaginatedListFooter } from "@/components/ui/PaginatedListFooter";
import { formatMoneyPtBrFromCentavos } from "@/lib/validators/currency";

export type ControleModo = "inadimplencia" | "inconsistencia" | "pos-venda";

const INADIMPLENCIA_DEFAULT_FILTERS: VendasListFilters = { statusOperacional: "INADIMPLENTE" };
const INCONSISTENCIA_DEFAULT_FILTERS: VendasListFilters = { statusInconsistencia: "INCONSISTENTE" };
const EMPTY_FILTERS: VendasListFilters = {};

type ControleCotasClientProps =
  | {
      modo: "inadimplencia" | "inconsistencia";
      initialPage: VendasListPage;
      initialItems?: never;
    }
  | {
      modo: "pos-venda";
      initialItems: VendaRow[];
      initialPage?: never;
    };

export default function ControleCotasClient(props: ControleCotasClientProps) {
  const { modo } = props;

  const defaultStatusFilter: "" | StatusOperacionalCota =
    modo === "inadimplencia" ? "INADIMPLENTE" : "";
  const defaultInconsistenciaFilter: "" | StatusInconsistencia =
    modo === "inconsistencia" ? "INCONSISTENTE" : "";

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | StatusOperacionalCota>(defaultStatusFilter);
  const [inconsistenciaFilter, setInconsistenciaFilter] = useState<"" | StatusInconsistencia>(
    defaultInconsistenciaFilter,
  );
  const [posVendaFilter, setPosVendaFilter] = useState<"" | StatusPosVenda>(
    modo === "pos-venda" ? "PENDENTE" : "",
  );
  const [selectedVenda, setSelectedVenda] = useState<VendaRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isPaginated = modo !== "pos-venda";
  const initialFilters =
    modo === "inadimplencia"
      ? INADIMPLENCIA_DEFAULT_FILTERS
      : modo === "inconsistencia"
        ? INCONSISTENCIA_DEFAULT_FILTERS
        : EMPTY_FILTERS;

  const clientFilter = useCallback(
    (items: VendaRow[]) => {
      const q = query.trim().toLowerCase();
      return items.filter((v) => {
        if (modo === "pos-venda" && posVendaFilter && v.statusPosVenda !== posVendaFilter) {
          return false;
        }
        if (!q) return true;
        const hay = `${v.numeroContrato} ${v.grupo} ${v.cota} ${v.consorciado?.nome ?? ""} ${v.equipe?.nome ?? ""} ${v.vendedor?.nome ?? ""}`.toLowerCase();
        return hay.includes(q);
      });
    },
    [modo, posVendaFilter, query],
  );

  const paginated = useVendasPaginatedList<VendaRow>({
    initialPage: isPaginated
      ? props.initialPage
      : { items: props.initialItems, lastDocId: null, hasMore: false },
    initialFilters,
    fetchPage: listVendasPaginated,
    clientFilter,
  });

  const {
    visibleItems: paginatedVisibleItems,
    hasMore,
    isLoadingMore,
    isResetting,
    error: paginatedError,
    loadMore,
    resetAndFetch,
    replaceItem,
  } = paginated;

  const [legacyItems, setLegacyItems] = useState<VendaRow[]>(
    !isPaginated ? props.initialItems : [],
  );

  const legacyItemsKey = useMemo(
    () => (!isPaginated ? props.initialItems.map((item) => item.id).join(",") : ""),
    [isPaginated, props.initialItems],
  );

  useEffect(() => {
    if (!isPaginated) {
      setLegacyItems(props.initialItems);
    }
  }, [isPaginated, legacyItemsKey, props.initialItems]);

  const skipInitialFilterFetch = useRef(true);
  useEffect(() => {
    if (!isPaginated) return;

    const nextFilters: VendasListFilters = {};
    if (modo === "inadimplencia" && statusFilter) {
      nextFilters.statusOperacional = statusFilter;
    }
    if (modo === "inconsistencia" && inconsistenciaFilter) {
      nextFilters.statusInconsistencia = inconsistenciaFilter;
    }

    if (skipInitialFilterFetch.current) {
      skipInitialFilterFetch.current = false;
      return;
    }

    void resetAndFetch(nextFilters);
  }, [isPaginated, modo, statusFilter, inconsistenciaFilter, resetAndFetch]);

  const visibleItems = isPaginated
    ? paginatedVisibleItems
    : clientFilter(legacyItems);

  function openDrawer(venda: VendaRow) {
    setSelectedVenda(venda);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  function onPosVendaCompleted(vendaId: string) {
    const updater = (item: VendaRow) =>
      item.id === vendaId ? { ...item, statusPosVenda: "FEITO" as const } : item;

    if (isPaginated) {
      replaceItem(vendaId, updater);
    } else {
      setLegacyItems((current) => current.map(updater));
    }

    setSelectedVenda((current) =>
      current?.id === vendaId ? { ...current, statusPosVenda: "FEITO" } : current,
    );
  }

  const defaultTipo =
    modo === "inconsistencia"
      ? ("INCONSISTENCIA" as const)
      : modo === "pos-venda"
        ? ("POS_VENDA" as const)
        : ("COBRANCA" as const);

  const emptyDescription =
    modo === "inconsistencia"
      ? "Ajuste o filtro ou marque cotas como inconsistentes na operação diária."
      : modo === "pos-venda"
        ? "Não há vendas recentes nem pendentes de pós-venda com os filtros atuais."
        : "Ajuste o filtro de status ou o termo de busca.";

  const isResettingList = isPaginated && isResetting;
  const showEmpty = !isResettingList && visibleItems.length === 0;

  return (
    <>
      <DataListPanel
        toolbar={
          <>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar contrato, grupo, cota, consorciado..."
              className={formControlClass("lg")}
            />
            {modo === "inadimplencia" ? (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className={formControlClass("md")}
              >
                <option value="">Todos os status</option>
                <option value="ATIVO">Ativo</option>
                <option value="INADIMPLENTE">Inadimplente</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            ) : null}
            {modo === "inconsistencia" ? (
              <select
                value={inconsistenciaFilter}
                onChange={(e) =>
                  setInconsistenciaFilter(e.target.value as typeof inconsistenciaFilter)
                }
                className={formControlClass("md")}
              >
                <option value="">Todas</option>
                <option value="INCONSISTENTE">Inconsistentes</option>
                <option value="CONSISTENTE">Consistentes</option>
              </select>
            ) : null}
            {modo === "pos-venda" ? (
              <select
                value={posVendaFilter}
                onChange={(e) => setPosVendaFilter(e.target.value as typeof posVendaFilter)}
                className={formControlClass("md")}
              >
                <option value="">Todos</option>
                <option value="PENDENTE">Pendentes</option>
                <option value="FEITO">Feitos</option>
              </select>
            ) : null}
          </>
        }
        error={
          paginatedError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {paginatedError}
            </div>
          ) : null
        }
      >
        {isResettingList ? (
          <TableSkeleton rows={8} columns={5} />
        ) : showEmpty ? (
          <EmptyState title="Nenhuma cota encontrada" description={emptyDescription} />
        ) : (
          <>
            <div className={tableWrapClass()}>
              <table className={dataTableClass()}>
                <thead>
                  <tr>
                    <th className={tableHeadCellClass()}>Contrato</th>
                    <th className={tableHeadCellClass()}>Grupo / Cota</th>
                    <th className={tableHeadCellClass()}>Consorciado</th>
                    <th className={tableHeadCellClass()}>Status</th>
                    {modo === "inconsistencia" ? (
                      <th className={tableHeadCellClass()}>Inconsistência</th>
                    ) : null}
                    {modo === "pos-venda" ? (
                      <th className={tableHeadCellClass()}>Pós-venda</th>
                    ) : null}
                    <th className={tableHeadCellClass()}>Equipe</th>
                    <th className={tableHeadCellClass()}>Valor</th>
                    <th className={`${tableHeadCellClass()} pr-0 text-right`}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((v, index) => (
                    <tr
                      key={v.id}
                      className={`${tableRowClass(index)} cursor-pointer hover:bg-zinc-50/80`}
                      onClick={() => openDrawer(v)}
                    >
                      <td className={`${tableCellClass()} font-medium text-zinc-900`}>{v.numeroContrato}</td>
                      <td className={tableCellClass()}>
                        {v.grupo} / {v.cota}
                        <div className="text-xs text-zinc-500">Venc. dia {v.dataVencimento}</div>
                      </td>
                      <td className={tableCellClass()}>{v.consorciado?.nome ?? "—"}</td>
                      <td className={tableCellClass()} onClick={(e) => e.stopPropagation()}>
                        <StatusBadge status={v.statusOperacional} />
                      </td>
                      {modo === "inconsistencia" ? (
                        <td className={tableCellClass()} onClick={(e) => e.stopPropagation()}>
                          <InconsistenciaBadge status={v.statusInconsistencia} />
                        </td>
                      ) : null}
                      {modo === "pos-venda" ? (
                        <td className={tableCellClass()} onClick={(e) => e.stopPropagation()}>
                          <PosVendaBadge status={v.statusPosVenda} />
                        </td>
                      ) : null}
                      <td className={tableCellClass()}>{v.equipe?.nome ?? "—"}</td>
                      <td className={`${tableCellClass()} tabular-nums`}>
                        {formatMoneyPtBrFromCentavos(v.valorCentavos)}
                      </td>
                      <td
                        className={`${tableCellClass()} pr-0 text-right`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          {(modo === "inadimplencia" || modo === "inconsistencia") && (
                            <WhatsAppButton
                              telefone={v.consorciado?.telefone}
                              nomeCliente={v.consorciado?.nome ?? ""}
                              numeroContrato={v.numeroContrato}
                              statusOperacional={v.statusOperacional}
                              vendaId={v.id}
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => openDrawer(v)}
                            className={secondaryActionClass()}
                          >
                            Timeline
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {isPaginated ? (
              <PaginatedListFooter
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                onLoadMore={() => void loadMore()}
                columns={5}
                skeletonRows={4}
              />
            ) : null}
          </>
        )}
      </DataListPanel>

      <VendaAtendimentoDrawer
        venda={selectedVenda}
        open={drawerOpen}
        onClose={closeDrawer}
        showInconsistenciaControls={modo === "inconsistencia"}
        showPosVendaControls={modo === "pos-venda"}
        defaultTipoRegistro={defaultTipo}
        onPosVendaCompleted={modo === "pos-venda" ? onPosVendaCompleted : undefined}
      />
    </>
  );
}
