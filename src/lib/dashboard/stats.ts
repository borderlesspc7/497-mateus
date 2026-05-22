import type {
  DashboardAdmResumo,
  DashboardMesResumo,
  DashboardStats,
  DashboardVendaResumo,
  VendaRow,
} from "@/lib/types/domain";

const MESES_ANALISE = 6;
const RECENTES_LIMITE = 8;
const TOP_ADM_LIMITE = 5;

function monthKeyFromIso(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function buildLastMonths(count: number): DashboardMesResumo[] {
  const now = new Date();
  const slots: DashboardMesResumo[] = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    const key = monthKeyFromIso(d.toISOString());
    if (!key) continue;
    const label = d.toLocaleDateString("pt-BR", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    });
    slots.push({ key, label, quantidade: 0, valorCentavos: 0 });
  }

  return slots;
}

function vendaReferenceDate(venda: VendaRow): string {
  return venda.dataVenda ?? venda.createdAt;
}

function sumValores(vendas: VendaRow[]): number {
  return vendas.reduce((acc, v) => acc + (v.valorCentavos ?? 0), 0);
}

export function buildDashboardStats(
  vendas: VendaRow[],
  nConsorciados: number,
  nAdministradoras: number,
  nPlanos: number,
): DashboardStats {
  const nVendasFechadas = vendas.filter((v) => v.status === "FECHADA").length;
  const nVendasRascunho = vendas.filter((v) => v.status === "RASCUNHO").length;
  const nVendasEnviadas = vendas.filter((v) => v.status === "ENVIADA").length;
  const nVendasCanceladas = vendas.filter((v) => v.status === "CANCELADA").length;

  const vendasComValor = vendas.filter((v) => v.valorCentavos !== null);
  const valorTotalCentavos = sumValores(vendas);
  const valorFechadasCentavos = sumValores(vendas.filter((v) => v.status === "FECHADA"));
  const ticketMedioCentavos =
    vendasComValor.length > 0 ? Math.round(valorTotalCentavos / vendasComValor.length) : null;

  const vendasPorMes = buildLastMonths(MESES_ANALISE);
  const mesMap = new Map(vendasPorMes.map((m) => [m.key, m]));

  for (const venda of vendas) {
    const key = monthKeyFromIso(vendaReferenceDate(venda));
    if (!key) continue;
    const slot = mesMap.get(key);
    if (!slot) continue;
    slot.quantidade += 1;
    slot.valorCentavos += venda.valorCentavos ?? 0;
  }

  const admAgg = new Map<string, DashboardAdmResumo>();
  for (const venda of vendas) {
    const current = admAgg.get(venda.administradoraId) ?? {
      id: venda.administradoraId,
      nome: venda.administradora.nome,
      quantidade: 0,
      valorCentavos: 0,
    };
    current.quantidade += 1;
    current.valorCentavos += venda.valorCentavos ?? 0;
    admAgg.set(venda.administradoraId, current);
  }

  const vendasPorAdministradora = [...admAgg.values()]
    .sort((a, b) => b.valorCentavos - a.valorCentavos || b.quantidade - a.quantidade)
    .slice(0, TOP_ADM_LIMITE);

  const vendasRecentes: DashboardVendaResumo[] = [...vendas]
    .sort(
      (a, b) =>
        new Date(vendaReferenceDate(b)).getTime() - new Date(vendaReferenceDate(a)).getTime(),
    )
    .slice(0, RECENTES_LIMITE)
    .map((v) => ({
      id: v.id,
      titulo: v.titulo,
      status: v.status,
      valorCentavos: v.valorCentavos,
      dataVenda: v.dataVenda,
      consorciadoNome: v.consorciado?.nome ?? null,
      administradoraNome: v.administradora.nome,
    }));

  return {
    nConsorciados,
    nAdministradoras,
    nPlanos,
    nVendas: vendas.length,
    nVendasFechadas,
    nVendasRascunho,
    nVendasEnviadas,
    nVendasCanceladas,
    valorTotalCentavos,
    valorFechadasCentavos,
    ticketMedioCentavos,
    vendasPorMes,
    vendasRecentes,
    vendasPorAdministradora,
  };
}
