import type { VendaSearchIndexRow } from "@/lib/firestore/vendas-search-client";

export type ConsorciadoVendaStats = {
  totalCotas: number;
  inadimplentes: number;
  inconsistentes: number;
};

export function buildConsorciadoVendaStatsMap(
  vendasIndex: VendaSearchIndexRow[],
): Map<string, ConsorciadoVendaStats> {
  const map = new Map<string, ConsorciadoVendaStats>();

  for (const venda of vendasIndex) {
    if (!venda.consorciadoId) continue;

    const current = map.get(venda.consorciadoId) ?? {
      totalCotas: 0,
      inadimplentes: 0,
      inconsistentes: 0,
    };

    current.totalCotas += 1;
    if (venda.statusOperacional === "INADIMPLENTE") current.inadimplentes += 1;
    if (venda.statusInconsistencia === "INCONSISTENTE") current.inconsistentes += 1;

    map.set(venda.consorciadoId, current);
  }

  return map;
}
