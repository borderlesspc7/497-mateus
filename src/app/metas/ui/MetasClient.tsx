"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { excluirMeta } from "@/actions/metas";
import { MetaFormDialog } from "@/components/metas/MetaFormDialog";
import { RankingCard } from "@/components/metas/RankingCard";
import { SincronizarButton } from "@/components/metas/SincronizarButton";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
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
  panelClass,
} from "@/components/ui/list-panel-classes";
import { formatarMoeda } from "@/lib/format";
import { periodoLabelCurto } from "@/lib/periodo";
import type { Conquista, MetaComRealizacao, MetaTipo, RankingPeriodoItem } from "@/types/metas";

type ReferenciaOption = { id: string; nome: string };

export type MetasClientProps = {
  initialMetas: MetaComRealizacao[];
  initialRanking: RankingPeriodoItem[];
  conquistas: Conquista[];
  vendedores: ReferenciaOption[];
  equipes: ReferenciaOption[];
  isAdmin: boolean;
  periodoInicial: string;
  tipoInicial: MetaTipo;
};

export function MetasClient({
  initialMetas,
  initialRanking,
  conquistas,
  vendedores,
  equipes,
  isAdmin,
  periodoInicial,
  tipoInicial,
}: MetasClientProps) {
  const router = useRouter();
  const confirm = useConfirmDialog();
  const [periodo, setPeriodo] = useState(periodoInicial);
  const [tipo, setTipo] = useState<MetaTipo>(tipoInicial);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState<MetaComRealizacao | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const metasFiltradas = useMemo(() => initialMetas, [initialMetas]);

  const rankingFiltrado = useMemo(() => initialRanking, [initialRanking]);

  async function onDelete(metaId: string) {
    const ok = await confirm({
      title: "Excluir meta?",
      description: "A realização associada também será removida.",
      variant: "destructive",
      confirmLabel: "Excluir",
    });
    if (!ok) return;
    setDeletingId(metaId);
    setError(null);
    const result = await excluirMeta(metaId);
    if (!result.success) {
      setError(result.error);
    } else {
      router.refresh();
    }
    setDeletingId(null);
  }

  function openCreate() {
    setEditingMeta(null);
    setDialogOpen(true);
  }

  function openEdit(meta: MetaComRealizacao) {
    setEditingMeta(meta);
    setDialogOpen(true);
  }

  return (
    <>
      <PageFlowHeader
        crumbs={[{ label: "Metas & Gamificação" }]}
        title="Metas & Gamificação"
        description="Metas mensais, ranking e conquistas da equipe comercial."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SincronizarButton periodo={periodo} />
            <button type="button" className={primaryActionClass()} onClick={openCreate}>
              <Plus className="mr-2 inline h-4 w-4" />
              Nova Meta
            </button>
          </div>
        }
      />

      <div className={`${panelClass()} mb-6 p-4`}>
        <div className="flex flex-wrap gap-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-zinc-600">Período</span>
            <input
              type="month"
              value={periodo}
              onChange={(e) => {
                setPeriodo(e.target.value);
                router.push(`/metas?periodo=${e.target.value}&tipo=${tipo}`);
              }}
              className={formControlClass("md")}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-zinc-600">Tipo</span>
            <select
              value={tipo}
              onChange={(e) => {
                const next = e.target.value as MetaTipo;
                setTipo(next);
                router.push(`/metas?periodo=${periodo}&tipo=${next}`);
              }}
              className={formControlClass("md")}
            >
              <option value="VENDEDOR">Vendedor</option>
              <option value="EQUIPE">Equipe</option>
            </select>
          </label>
        </div>
      </div>

      {error ? (
        <AlertBanner tone="error" className="mb-4">
          {error}
        </AlertBanner>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Ranking do Período</h2>
        {rankingFiltrado.length === 0 ? (
          <EmptyState
            title="Sem ranking"
            description="Cadastre metas ou aguarde vendas no período."
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-1">
            {rankingFiltrado.map((item) => (
              <RankingCard
                key={item.referenciaId}
                posicao={item.posicao}
                nome={item.referenciaNome}
                percentualVendas={item.percentualVendas}
                realizadoVendas={item.realizadoVendas}
                metaVendas={item.metaVendas}
                conquistas={conquistas}
                conquistasDesbloqueadas={item.conquistasDesbloqueadas}
                temMeta={item.temMeta}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Metas Cadastradas</h2>
        {metasFiltradas.length === 0 ? (
          <EmptyState
            title="Nenhuma meta cadastrada"
            description="Crie metas para acompanhar o desempenho do time."
            action={
              <button type="button" className={primaryActionClass()} onClick={openCreate}>
                Nova meta
              </button>
            }
          />
        ) : (
          <div className={tableWrapClass()}>
            <table className={dataTableClass()}>
              <thead>
                <tr>
                  <th className={tableHeadCellClass()}>Referência</th>
                  <th className={tableHeadCellClass()}>Período</th>
                  <th className={tableHeadCellClass()}>Vendas</th>
                  <th className={tableHeadCellClass()}>Crédito</th>
                  <th className={tableHeadCellClass()}>Ativação</th>
                  <th className={tableHeadCellClass()} aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {metasFiltradas.map((meta, index) => (
                  <tr key={meta.id} className={tableRowClass(index)}>
                    <td className={tableCellClass()}>{meta.referenciaNome}</td>
                    <td className={tableCellClass()}>{periodoLabelCurto(meta.periodo)}</td>
                    <td className={tableCellClass()}>{meta.metaVendas}</td>
                    <td className={tableCellClass()}>{formatarMoeda(meta.metaCreditoCentavos)}</td>
                    <td className={tableCellClass()}>{meta.metaAtivacao}%</td>
                    <td className={tableCellClass()}>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className={secondaryActionClass()}
                          onClick={() => openEdit(meta)}
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {isAdmin ? (
                          <button
                            type="button"
                            className={dangerActionClass()}
                            onClick={() => void onDelete(meta.id)}
                            disabled={deletingId === meta.id}
                            aria-label="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <MetaFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        vendedores={vendedores}
        equipes={equipes}
        meta={editingMeta}
        defaultPeriodo={periodo}
      />
    </>
  );
}
