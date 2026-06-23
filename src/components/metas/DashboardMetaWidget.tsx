import Link from "next/link";
import { getMetasDashboardWidgetData } from "@/actions/metas";
import { RankingCard } from "@/components/metas/RankingCard";
import { ProgressoMetaCard } from "@/components/metas/ProgressoMetaCard";
import { panelClass } from "@/components/ui/list-panel-classes";
import { periodoLabel } from "@/lib/periodo";
import type { UserRole } from "@/lib/auth/roles";
import { canAccessConfiguracoes } from "@/lib/auth/roles";

export type DashboardMetaWidgetProps = {
  userRole: UserRole | null;
};

export async function DashboardMetaWidget({ userRole }: DashboardMetaWidgetProps) {
  const result = await getMetasDashboardWidgetData();
  if (!result.success) return null;

  const { periodo, minhaMeta, minhaRealizacao, rankingTop, conquistas, role } = result.data;
  const label = periodoLabel(periodo);

  if (role === "vendedor") {
    if (!minhaMeta && !minhaRealizacao) {
      return (
        <div className={`${panelClass()} p-6`}>
          <h3 className="text-sm font-semibold text-zinc-900">🎯 Minha Meta — {label}</h3>
          <p className="mt-2 text-sm text-zinc-600">
            Nenhuma meta definida para este mês.
          </p>
        </div>
      );
    }

    const r = minhaRealizacao;
    const m = minhaMeta;

    return (
      <div className={`${panelClass()} p-6`}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-900">🎯 Minha Meta — {label}</h3>
          <Link href="/metas/minhas" className="text-sm font-medium text-sky-700 hover:text-sky-800">
            Ver detalhes →
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <ProgressoMetaCard
            label="Vendas"
            realizado={r?.realizadoVendas ?? 0}
            meta={m?.metaVendas ?? null}
            unidade="vendas"
            percentual={r?.percentualVendas ?? 0}
          />
          <ProgressoMetaCard
            label="Crédito"
            realizado={r?.realizadoCreditoCentavos ?? 0}
            meta={m?.metaCreditoCentavos ?? null}
            unidade="reais"
            percentual={r?.percentualCredito ?? 0}
          />
          <ProgressoMetaCard
            label="Ativação"
            realizado={r?.realizadoAtivacao ?? 0}
            meta={m?.metaAtivacao ?? null}
            unidade="porcento"
            percentual={r?.percentualAtivacao ?? 0}
          />
        </div>
        {r && r.conquistasDesbloqueadas.length > 0 ? (
          <p className="mt-3 text-sm text-zinc-600">
            Conquistas:{" "}
            {conquistas
              .filter((c) => r.conquistasDesbloqueadas.includes(c.id))
              .map((c) => c.icone)
              .join(" ")}
          </p>
        ) : null}
      </div>
    );
  }

  if (!userRole || !canAccessConfiguracoes(userRole)) return null;

  return (
    <div className={`${panelClass()} p-6`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-900">🏆 Ranking de {label.split(" ")[0]}</h3>
        <Link href="/metas" className="text-sm font-medium text-sky-700 hover:text-sky-800">
          Ver ranking completo
        </Link>
      </div>
      {rankingTop.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-600">Nenhum dado de ranking para este mês.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {rankingTop.map((item) => (
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
    </div>
  );
}
