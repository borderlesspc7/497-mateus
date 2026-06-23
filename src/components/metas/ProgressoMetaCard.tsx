import { progressBarTone } from "@/lib/metas/conquistas";
import { formatarMoeda, formatarPercentual } from "@/lib/format";

export type ProgressoMetaCardProps = {
  label: string;
  realizado: number;
  meta: number | null;
  unidade: "vendas" | "reais" | "porcento";
  percentual: number;
};

function formatRealizado(unidade: ProgressoMetaCardProps["unidade"], valor: number): string {
  if (unidade === "reais") return formatarMoeda(valor);
  if (unidade === "porcento") return formatarPercentual(valor);
  return String(valor);
}

export function ProgressoMetaCard({
  label,
  realizado,
  meta,
  unidade,
  percentual,
}: ProgressoMetaCardProps) {
  const temMeta = meta !== null && meta > 0;
  const barWidth = temMeta ? Math.min(percentual, 100) : 0;
  const tone = progressBarTone(percentual);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>

      {temMeta ? (
        <>
          <p className="mt-2 text-lg font-bold text-zinc-900">
            {formatRealizado(unidade, realizado)}
            <span className="text-sm font-normal text-zinc-500">
              {" "}
              / {formatRealizado(unidade, meta)}
            </span>
          </p>
          <div
            role="progressbar"
            aria-label={`Progresso de ${label}: ${percentual}%`}
            aria-valuenow={Math.min(percentual, 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100"
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${tone}`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <p className="mt-2 text-sm font-medium text-zinc-700">{formatarPercentual(percentual)}</p>
        </>
      ) : (
        <>
          <p className="mt-2 text-lg font-bold text-zinc-900">
            {formatRealizado(unidade, realizado)}
          </p>
          <span className="mt-2 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
            Sem meta definida
          </span>
        </>
      )}
    </div>
  );
}
