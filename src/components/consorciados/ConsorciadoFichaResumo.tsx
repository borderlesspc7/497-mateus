import { SummaryChip } from "@/components/ui/SummaryChip";
import { panelClass, panelInsetClass } from "@/components/ui/list-panel-classes";
import type { ConsorciadoRow, VendaRow } from "@/lib/types/domain";

type ConsorciadoFichaResumoProps = {
  consorciado: ConsorciadoRow;
  vendas: VendaRow[];
};

export function ConsorciadoFichaResumo({ consorciado, vendas }: ConsorciadoFichaResumoProps) {
  const inadimplentes = vendas.filter((v) => v.statusOperacional === "INADIMPLENTE").length;
  const inconsistentes = vendas.filter((v) => v.statusInconsistencia === "INCONSISTENTE").length;
  const ativas = vendas.filter((v) => v.statusOperacional === "ATIVO").length;

  return (
    <section className={panelClass()}>
      <div className={`py-4 ${panelInsetClass()}`}>
        <h2 className="text-base font-semibold text-zinc-900">Resumo operacional</h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          Visão consolidada das cotas de {consorciado.nome.split(" ")[0]}.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <SummaryChip label="Cotas contratadas" value={vendas.length} />
          <SummaryChip label="Ativas" value={ativas} tone="green" />
          <SummaryChip label="Inadimplentes" value={inadimplentes} tone="red" />
          <SummaryChip label="Inconsistentes" value={inconsistentes} tone="yellow" />
        </div>
      </div>
    </section>
  );
}
