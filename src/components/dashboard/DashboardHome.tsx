import Link from "next/link";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import {
  dataTableClass,
  panelClass,
  tableCellClass,
  tableEmptyCellClass,
  tableHeadCellClass,
  tableWrapClass,
} from "@/components/ui/list-panel-classes";
import type { DashboardStats, VendaStatus } from "@/lib/types/domain";
import { formatMoneyPtBrFromCentavos } from "@/lib/validators/currency";

type DashboardHomeProps = {
  stats: DashboardStats;
};

function KpiCard({
  label,
  value,
  hint,
  href,
  linkLabel,
}: {
  label: string;
  value: string;
  hint: string;
  href?: string;
  linkLabel?: string;
}) {
  const body = (
    <>
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-zinc-900">
        {value}
      </div>
      <div className="mt-1 text-sm leading-5 text-zinc-600">{hint}</div>
      {href && linkLabel ? (
        <div className="mt-3 text-xs font-medium text-zinc-900 underline-offset-2 group-hover:underline">
          {linkLabel}
        </div>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
      >
        {body}
      </Link>
    );
  }

  return <div className={`${panelClass()} p-5`}>{body}</div>;
}

function StatusBadge({ status }: { status: VendaStatus }) {
  const style =
    status === "FECHADA"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "CANCELADA"
        ? "border-red-200 bg-red-50 text-red-700"
        : status === "ENVIADA"
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-zinc-200 bg-zinc-50 text-zinc-700";

  const label =
    status === "RASCUNHO"
      ? "Rascunho"
      : status === "ENVIADA"
        ? "Enviada"
        : status === "FECHADA"
          ? "Fechada"
          : "Cancelada";

  return (
    <span
      className={[
        "inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-medium",
        style,
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

export function DashboardHome({ stats }: DashboardHomeProps) {
  const maxMesValor = Math.max(...stats.vendasPorMes.map((m) => m.valorCentavos), 1);
  const maxMesQtd = Math.max(...stats.vendasPorMes.map((m) => m.quantidade), 1);

  const statusRows = [
    { label: "Fechadas", count: stats.nVendasFechadas, tone: "bg-emerald-500" },
    { label: "Enviadas", count: stats.nVendasEnviadas, tone: "bg-blue-500" },
    { label: "Rascunho", count: stats.nVendasRascunho, tone: "bg-zinc-400" },
    { label: "Canceladas", count: stats.nVendasCanceladas, tone: "bg-red-400" },
  ];

  const taxaFechamento =
    stats.nVendas > 0 ? Math.round((stats.nVendasFechadas / stats.nVendas) * 100) : 0;

  return (
    <>
      <PageFlowHeader
        crumbs={[{ label: "Dashboard" }]}
        title="Dashboard"
        description="Visão geral do sistema: cadastros, volume de vendas, valores e tendência dos últimos meses."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Consorciados"
          value={String(stats.nConsorciados)}
          hint="Base cadastral do CRM operacional."
          href="/consorciados"
          linkLabel="Ver cadastro"
        />
        <KpiCard
          label="Administradoras"
          value={String(stats.nAdministradoras)}
          hint="Parceiros e regras por administradora."
          href="/administradoras"
          linkLabel="Ver cadastro"
        />
        <KpiCard
          label="Planos"
          value={String(stats.nPlanos)}
          hint="Produtos vinculados às administradoras."
          href="/planos"
          linkLabel="Ver cadastro"
        />
        <KpiCard
          label="Total de vendas"
          value={String(stats.nVendas)}
          hint={`${stats.nVendasFechadas} fechadas · taxa de fechamento ${taxaFechamento}%`}
          href="/vendas"
          linkLabel="Ver todas"
        />
        <KpiCard
          label="Valor total"
          value={formatMoneyPtBrFromCentavos(stats.valorTotalCentavos)}
          hint={`Fechadas: ${formatMoneyPtBrFromCentavos(stats.valorFechadasCentavos)}`}
        />
        <KpiCard
          label="Ticket médio"
          value={formatMoneyPtBrFromCentavos(stats.ticketMedioCentavos)}
          hint="Média das vendas com valor informado."
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className={`${panelClass()} p-6 lg:col-span-2`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Vendas nos últimos 6 meses</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Quantidade e valor por mês (data da venda ou cadastro).
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {stats.vendasPorMes.map((mes) => {
              const valorPct = Math.round((mes.valorCentavos / maxMesValor) * 100);
              const qtdPct = Math.round((mes.quantidade / maxMesQtd) * 100);
              return (
                <div key={mes.key}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-medium capitalize text-zinc-700">{mes.label}</span>
                    <span className="tabular-nums text-zinc-500">
                      {mes.quantidade} venda{mes.quantidade === 1 ? "" : "s"} ·{" "}
                      {formatMoneyPtBrFromCentavos(mes.valorCentavos)}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-zinc-900 transition-all"
                        style={{ width: `${Math.max(valorPct, mes.valorCentavos > 0 ? 4 : 0)}%` }}
                        title={`Valor: ${formatMoneyPtBrFromCentavos(mes.valorCentavos)}`}
                      />
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-zinc-400 transition-all"
                        style={{ width: `${Math.max(qtdPct, mes.quantidade > 0 ? 4 : 0)}%` }}
                        title={`Quantidade: ${mes.quantidade}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-6 rounded-full bg-zinc-900" />
              Valor (R$)
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-6 rounded-full bg-zinc-400" />
              Quantidade
            </span>
          </div>
        </section>

        <section className={`${panelClass()} p-6`}>
          <h2 className="text-sm font-semibold text-zinc-900">Vendas por status</h2>
          <p className="mt-1 text-xs text-zinc-500">Distribuição do pipeline comercial.</p>

          <div className="mt-6 space-y-4">
            {statusRows.map((row) => {
              const pct =
                stats.nVendas > 0 ? Math.round((row.count / stats.nVendas) * 100) : 0;
              return (
                <div key={row.label}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-700">{row.label}</span>
                    <span className="tabular-nums text-zinc-500">
                      {row.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className={`h-full rounded-full ${row.tone}`}
                      style={{ width: `${Math.max(pct, row.count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/80 p-4">
            <div className="text-xs font-medium text-zinc-500">Comissões</div>
            <div className="mt-1 text-sm text-zinc-600">
              Próxima etapa: extratos e relatórios a partir dos planos cadastrados.
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className={`${panelClass()} p-6`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Vendas recentes</h2>
              <p className="mt-1 text-xs text-zinc-500">Últimas movimentações registradas.</p>
            </div>
            <Link
              href="/vendas"
              className="text-xs font-medium text-zinc-900 underline-offset-2 hover:underline"
            >
              Ver todas
            </Link>
          </div>

          <div className={`${tableWrapClass()} mt-4`}>
            <table className={dataTableClass()}>
              <thead>
                <tr>
                  <th className={tableHeadCellClass()}>Título</th>
                  <th className={tableHeadCellClass()}>Status</th>
                  <th className={tableHeadCellClass()}>Valor</th>
                  <th className={tableHeadCellClass()}>Data</th>
                </tr>
              </thead>
              <tbody>
                {stats.vendasRecentes.length === 0 ? (
                  <tr>
                    <td className={tableEmptyCellClass()} colSpan={4}>
                      Nenhuma venda cadastrada ainda.
                    </td>
                  </tr>
                ) : (
                  stats.vendasRecentes.map((v) => (
                    <tr key={v.id}>
                      <td className={tableCellClass()}>
                        <Link
                          href={`/vendas/${v.id}`}
                          className="font-medium text-zinc-900 underline-offset-2 hover:underline"
                        >
                          {v.titulo}
                        </Link>
                        <div className="text-xs text-zinc-500">
                          {v.consorciadoNome ?? "Sem consorciado"} · {v.administradoraNome}
                        </div>
                      </td>
                      <td className={tableCellClass()}>
                        <StatusBadge status={v.status} />
                      </td>
                      <td className={`${tableCellClass()} whitespace-nowrap tabular-nums`}>
                        {formatMoneyPtBrFromCentavos(v.valorCentavos)}
                      </td>
                      <td className={`${tableCellClass()} whitespace-nowrap`}>
                        {formatDate(v.dataVenda ?? null)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className={`${panelClass()} p-6`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Top administradoras</h2>
              <p className="mt-1 text-xs text-zinc-500">Ranking por volume e valor de vendas.</p>
            </div>
            <Link
              href="/administradoras"
              className="text-xs font-medium text-zinc-900 underline-offset-2 hover:underline"
            >
              Ver todas
            </Link>
          </div>

          <div className={`${tableWrapClass()} mt-4`}>
            <table className={dataTableClass()}>
              <thead>
                <tr>
                  <th className={tableHeadCellClass()}>Administradora</th>
                  <th className={tableHeadCellClass()}>Vendas</th>
                  <th className={tableHeadCellClass()}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {stats.vendasPorAdministradora.length === 0 ? (
                  <tr>
                    <td className={tableEmptyCellClass()} colSpan={3}>
                      Sem vendas vinculadas a administradoras.
                    </td>
                  </tr>
                ) : (
                  stats.vendasPorAdministradora.map((adm, index) => (
                    <tr key={adm.id}>
                      <td className={tableCellClass()}>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
                            {index + 1}
                          </span>
                          <Link
                            href={`/administradoras/${adm.id}`}
                            className="font-medium text-zinc-900 underline-offset-2 hover:underline"
                          >
                            {adm.nome}
                          </Link>
                        </div>
                      </td>
                      <td className={`${tableCellClass()} tabular-nums`}>{adm.quantidade}</td>
                      <td className={`${tableCellClass()} whitespace-nowrap tabular-nums`}>
                        {formatMoneyPtBrFromCentavos(adm.valorCentavos)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
