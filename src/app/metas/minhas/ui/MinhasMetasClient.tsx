"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ConquistaCard } from "@/components/metas/ConquistaCard";
import { NavegacaoPeriodo } from "@/components/metas/NavegacaoPeriodo";
import { ProgressoMetaCard } from "@/components/metas/ProgressoMetaCard";
import { RankingCard } from "@/components/metas/RankingCard";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { panelClass } from "@/components/ui/list-panel-classes";
import { formatarMoeda } from "@/lib/format";
import { periodoAtual } from "@/lib/periodo";
import type { Conquista, Meta, RankingPeriodoItem, Realizacao } from "@/types/metas";

export type MinhasMetasClientProps = {
  meta: Meta | null;
  realizacao: Realizacao | null;
  ranking: RankingPeriodoItem[];
  conquistas: Conquista[];
  periodoInicial: string;
  titulo: string;
};

function faltandoTexto(
  conquista: Conquista,
  meta: Meta | null,
  realizacao: Realizacao | null,
): string | null {
  if (!meta || !realizacao) return null;
  switch (conquista.condicao.tipo) {
    case "META_VENDAS_ATINGIDA": {
      const falta = Math.max(0, meta.metaVendas - realizacao.realizadoVendas);
      return falta > 0 ? `faltam ${falta} vendas` : null;
    }
    case "META_CREDITO_ATINGIDA": {
      const falta = Math.max(0, meta.metaCreditoCentavos - realizacao.realizadoCreditoCentavos);
      return falta > 0 ? `faltam ${formatarMoeda(falta)}` : null;
    }
    default:
      return null;
  }
}

export function MinhasMetasClient({
  meta,
  realizacao,
  ranking,
  conquistas,
  periodoInicial,
  titulo,
}: MinhasMetasClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [periodo, setPeriodo] = useState(periodoInicial);

  const desbloqueadas = useMemo(
    () => new Set(realizacao?.conquistasDesbloqueadas ?? []),
    [realizacao],
  );

  function onPeriodoChange(next: string) {
    setPeriodo(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("periodo", next);
    router.push(`/metas/minhas?${params.toString()}`);
  }

  return (
    <>
      <PageFlowHeader
        crumbs={[{ label: "Minhas Metas" }]}
        title={titulo}
        description="Acompanhe seu progresso, conquistas e posição no ranking."
      />

      <div className={`${panelClass()} mb-6 p-4`}>
        <NavegacaoPeriodo periodoAtualProp={periodo} onChange={onPeriodoChange} />
      </div>

      {!meta && !realizacao ? (
        <EmptyState
          title="Nenhuma meta para este período"
          description="Aguarde a definição de metas pelo gestor ou verifique outro mês."
        />
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ProgressoMetaCard
              label="Vendas"
              realizado={realizacao?.realizadoVendas ?? 0}
              meta={meta?.metaVendas ?? null}
              unidade="vendas"
              percentual={realizacao?.percentualVendas ?? 0}
            />
            <ProgressoMetaCard
              label="Crédito"
              realizado={realizacao?.realizadoCreditoCentavos ?? 0}
              meta={meta?.metaCreditoCentavos ?? null}
              unidade="reais"
              percentual={realizacao?.percentualCredito ?? 0}
            />
            <ProgressoMetaCard
              label="Ativação"
              realizado={realizacao?.realizadoAtivacao ?? 0}
              meta={meta?.metaAtivacao ?? null}
              unidade="porcento"
              percentual={realizacao?.percentualAtivacao ?? 0}
            />
          </div>

          <section className="mb-8">
            <h2 className="mb-4 text-base font-semibold text-zinc-900">Conquistas do Mês</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {conquistas.map((conquista) => (
                <ConquistaCard
                  key={conquista.id}
                  conquista={conquista}
                  desbloqueada={desbloqueadas.has(conquista.id)}
                  dataDesbloqueio={realizacao?.atualizadoEm}
                  faltando={faltandoTexto(conquista, meta, realizacao)}
                />
              ))}
            </div>
          </section>
        </>
      )}

      <section>
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Ranking Geral do Mês</h2>
        {ranking.length === 0 ? (
          <EmptyState title="Ranking indisponível" description="Sem dados para este período." />
        ) : (
          <div className="grid gap-3">
            {ranking.map((item) => (
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
    </>
  );
}
