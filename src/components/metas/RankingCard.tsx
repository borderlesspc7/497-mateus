import type { Conquista } from "@/types/metas";
import { progressBarTone } from "@/lib/metas/conquistas";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type RankingCardProps = {
  posicao: number;
  nome: string;
  percentualVendas: number;
  realizadoVendas: number;
  metaVendas: number | null;
  conquistas: Conquista[];
  conquistasDesbloqueadas: string[];
  temMeta: boolean;
};

function medalForPosition(posicao: number): string {
  if (posicao === 1) return "🥇";
  if (posicao === 2) return "🥈";
  if (posicao === 3) return "🥉";
  return String(posicao);
}

export function RankingCard({
  posicao,
  nome,
  percentualVendas,
  realizadoVendas,
  metaVendas,
  conquistas,
  conquistasDesbloqueadas,
  temMeta,
}: RankingCardProps) {
  const pct = temMeta ? Math.min(percentualVendas, 100) : 0;
  const barWidth = temMeta ? Math.min(percentualVendas, 100) : 0;
  const tone = progressBarTone(percentualVendas);

  const conquistaMap = new Map(conquistas.map((c) => [c.id, c]));
  const badges = conquistasDesbloqueadas
    .map((id) => conquistaMap.get(id))
    .filter((c): c is Conquista => Boolean(c));

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-[3rem] items-center justify-center text-lg font-bold text-zinc-700">
        {medalForPosition(posicao)} {posicao <= 3 ? "" : `${posicao}º`}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-semibold text-zinc-900">{nome}</span>
          {!temMeta ? (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
              Sem meta
            </span>
          ) : null}
          {badges.length > 0 ? (
            <TooltipProvider delayDuration={200}>
              <div className="flex flex-wrap gap-1">
                {badges.map((c) => (
                  <Tooltip key={c.id}>
                    <TooltipTrigger asChild>
                      <span className="cursor-default text-base" aria-label={c.nome}>
                        {c.icone}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{c.nome}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          ) : null}
        </div>

        {temMeta ? (
          <div className="mt-2">
            <div
              role="progressbar"
              aria-label={`Progresso de vendas: ${percentualVendas}%`}
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100"
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${tone}`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-zinc-600">
              <span>
                {realizadoVendas}
                {metaVendas !== null ? ` / ${metaVendas} vnd` : " vnd"}
              </span>
              <span className="font-medium">{percentualVendas}%</span>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-sm text-zinc-600">{realizadoVendas} vendas no período</p>
        )}
      </div>
    </div>
  );
}
