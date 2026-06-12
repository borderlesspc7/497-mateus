import Link from "next/link";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  dataTableClass,
  panelClass,
  tableCellClass,
  tableHeadCellClass,
  tableRowClass,
  tableWrapClass,
} from "@/components/ui/list-panel-classes";
import { canViewComissoes, type UserRole } from "@/lib/auth/roles";
import type { DashboardStats } from "@/lib/types/domain";
import { formatMoneyPtBrFromCentavos } from "@/lib/validators/currency";

type DashboardHomeProps = {
  stats: DashboardStats;
  userRole: UserRole | null;
};

type KpiTone = "emerald" | "sky" | "violet" | "amber" | "rose" | "zinc";

type KpiCardProps = {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  href?: string;
  linkLabel?: string;
  tone?: KpiTone;
  muted?: boolean;
};

const KPI_TONE_STYLES: Record<
  KpiTone,
  { border: string; icon: string; link: string }
> = {
  emerald: {
    border: "border-t-emerald-500",
    icon: "border-emerald-100 bg-emerald-50 text-emerald-600",
    link: "text-emerald-700 group-hover:text-emerald-800",
  },
  sky: {
    border: "border-t-sky-500",
    icon: "border-sky-100 bg-sky-50 text-sky-600",
    link: "text-sky-700 group-hover:text-sky-800",
  },
  violet: {
    border: "border-t-violet-500",
    icon: "border-violet-100 bg-violet-50 text-violet-600",
    link: "text-violet-700 group-hover:text-violet-800",
  },
  amber: {
    border: "border-t-amber-500",
    icon: "border-amber-100 bg-amber-50 text-amber-600",
    link: "text-amber-700 group-hover:text-amber-800",
  },
  rose: {
    border: "border-t-rose-500",
    icon: "border-rose-100 bg-rose-50 text-rose-600",
    link: "text-rose-700 group-hover:text-rose-800",
  },
  zinc: {
    border: "border-t-zinc-400",
    icon: "border-zinc-200 bg-zinc-50 text-zinc-600",
    link: "text-zinc-700 group-hover:text-zinc-900",
  },
};

function getValueTextClass(value: string, muted: boolean): string {
  const length = value.length;

  if (muted) {
    if (length > 12) return "text-lg font-semibold";
    if (length > 8) return "text-xl font-semibold";
    return "text-2xl font-semibold";
  }

  if (length > 14) return "text-lg font-bold";
  if (length > 10) return "text-xl font-bold";
  if (length > 6) return "text-2xl font-bold";
  return "text-3xl font-bold";
}

function KpiCard({
  label,
  value,
  hint,
  icon,
  href,
  linkLabel,
  tone = "zinc",
  muted = false,
}: KpiCardProps) {
  const styles = KPI_TONE_STYLES[tone];
  const valueClass = getValueTextClass(value, muted);
  const isCurrency = value.startsWith("R$");

  const content = (
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            {label}
          </p>
          <p
            className={[
              "mt-2.5 max-w-full tabular-nums tracking-tight",
              isCurrency ? "break-words leading-tight" : "overflow-hidden text-ellipsis whitespace-nowrap leading-none",
              valueClass,
              muted ? "text-zinc-400" : "text-zinc-900",
            ].join(" ")}
            title={value}
          >
            {value}
          </p>
        </div>
        <div
          className={[
            "grid h-11 w-11 shrink-0 place-items-center rounded-xl border",
            muted ? "border-dashed border-zinc-300 bg-zinc-50 text-zinc-400" : styles.icon,
          ].join(" ")}
        >
          {icon}
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-5 text-zinc-500">{hint}</p>

      {href && linkLabel ? (
        <span
          className={[
            "mt-auto inline-flex items-center gap-1 pt-4 text-xs font-semibold transition-colors",
            styles.link,
          ].join(" ")}
        >
          {linkLabel}
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </span>
      ) : (
        <span className="mt-auto block pt-4" aria-hidden />
      )}
    </div>
  );

  const cardClass = [
    "group relative flex min-h-[11.5rem] min-w-0 overflow-hidden rounded-2xl border border-zinc-200/90 border-t-[3px] bg-white p-5 shadow-sm transition-all duration-200",
    muted ? "border-dashed hover:border-zinc-300" : styles.border,
    href
      ? "hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
      : "hover:shadow-md",
  ].join(" ");

  if (href) {
    return (
      <Link href={href} className={cardClass}>
        {content}
      </Link>
    );
  }

  return <article className={cardClass}>{content}</article>;
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function IconBuilding() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 9h.01M15 9h.01M9 13h.01M15 13h.01" />
    </svg>
  );
}

function IconLayers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function IconCart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h15l-1.5 9h-12L6 6zM6 6l-2-2H2M9 20a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
    </svg>
  );
}

function IconCurrency() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H7" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5M4 19h16M8 17V9M12 17V7M16 17v-4" />
    </svg>
  );
}

function IconSpark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
    </svg>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <p className="mt-1.5 text-sm leading-6 text-zinc-600">{description}</p>
    </div>
  );
}

export function DashboardHome({ stats, userRole }: DashboardHomeProps) {
  const maxMesValor = Math.max(...stats.vendasPorMes.map((m) => m.valorCentavos), 1);
  const maxMesQtd = Math.max(...stats.vendasPorMes.map((m) => m.quantidade), 1);
  const showComissoes = userRole ? canViewComissoes(userRole) : false;
  const mesAtual = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const statusRows = [
    { label: "Ativas", count: stats.nVendasAtivas, tone: "bg-emerald-500" },
    { label: "Inadimplentes", count: stats.nVendasInadimplentes, tone: "bg-amber-500" },
    { label: "Canceladas", count: stats.nVendasCanceladas, tone: "bg-red-400" },
  ];

  const taxaAtivas =
    stats.nVendas > 0 ? Math.round((stats.nVendasAtivas / stats.nVendas) * 100) : 0;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
        <KpiCard
          label="Vendas ativas"
          value={String(stats.nVendasAtivas)}
          hint="Cotas com status operacional Ativo."
          icon={<IconCart />}
          href="/vendas"
          linkLabel="Ver vendas"
          tone="emerald"
        />
        <KpiCard
          label="Crédito comercializado"
          value={formatMoneyPtBrFromCentavos(stats.valorCreditoComercializadoCentavos)}
          hint="Soma dos valores das vendas ativas."
          icon={<IconCurrency />}
          tone="sky"
        />
        <KpiCard
          label="Comissões pagas"
          value={formatMoneyPtBrFromCentavos(stats.comissoesPagasMesCentavos)}
          hint={`Extratos com status Pago em ${mesAtual}.`}
          icon={<IconSpark />}
          href={showComissoes ? "/comissoes" : undefined}
          linkLabel={showComissoes ? "Ver extratos" : undefined}
          tone="violet"
        />
        <KpiCard
          label="Cotas inadimplentes"
          value={String(stats.nVendasInadimplentes)}
          hint="Vendas com status Inadimplente."
          icon={<IconChart />}
          href="/controle/inadimplencia"
          linkLabel="Ver inadimplência"
          tone="amber"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
        <KpiCard
          label="Consorciados"
          value={String(stats.nConsorciados)}
          hint="Base cadastral do CRM operacional."
          icon={<IconUsers />}
          href="/consorciados"
          linkLabel="Ver cadastro"
          tone="zinc"
        />
        <KpiCard
          label="Administradoras"
          value={String(stats.nAdministradoras)}
          hint="Parceiros e regras por administradora."
          icon={<IconBuilding />}
          href="/administradoras"
          linkLabel="Ver cadastro"
          tone="zinc"
        />
        <KpiCard
          label="Planos"
          value={String(stats.nPlanos)}
          hint="Produtos vinculados às administradoras."
          icon={<IconLayers />}
          href="/planos"
          linkLabel="Ver cadastro"
          tone="zinc"
        />
        <KpiCard
          label="Vendas"
          value={String(stats.nVendas)}
          hint={`${stats.nVendasAtivas} ativas · ${taxaAtivas}% da carteira`}
          icon={<IconCart />}
          href="/vendas"
          linkLabel="Ver todas"
          tone="emerald"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Valor total (carteira)"
          value={formatMoneyPtBrFromCentavos(stats.valorTotalCentavos)}
          hint={`Ativas: ${formatMoneyPtBrFromCentavos(stats.valorAtivasCentavos)}`}
          icon={<IconCurrency />}
          tone="sky"
        />
        <KpiCard
          label="Ticket médio"
          value={formatMoneyPtBrFromCentavos(stats.ticketMedioCentavos)}
          hint="Média das vendas com valor informado."
          icon={<IconChart />}
          tone="violet"
        />
        <KpiCard
          label="Canceladas"
          value={String(stats.nVendasCanceladas)}
          hint={`${stats.nVendas} vendas no total`}
          icon={<IconLayers />}
          tone="rose"
          muted={stats.nVendasCanceladas === 0}
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-5">
        <section className={`${panelClass()} p-5 sm:p-6 xl:col-span-3`}>
          <SectionTitle
            title="Vendas nos últimos 6 meses"
            description="Quantidade e valor por mês (data da venda ou cadastro)."
          />

          <div className="mt-8 space-y-5">
            {stats.vendasPorMes.map((mes) => {
              const valorPct = Math.round((mes.valorCentavos / maxMesValor) * 100);
              const qtdPct = Math.round((mes.quantidade / maxMesQtd) * 100);
              return (
                <div key={mes.key}>
                  <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-semibold capitalize text-zinc-800">{mes.label}</span>
                    <span className="tabular-nums text-zinc-500">
                      {mes.quantidade} venda{mes.quantidade === 1 ? "" : "s"} ·{" "}
                      {formatMoneyPtBrFromCentavos(mes.valorCentavos)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-zinc-900 transition-all"
                        style={{ width: `${Math.max(valorPct, mes.valorCentavos > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-zinc-400 transition-all"
                        style={{ width: `${Math.max(qtdPct, mes.quantidade > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-5 text-xs font-medium text-zinc-500">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-7 rounded-full bg-zinc-900" />
              Valor (R$)
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-7 rounded-full bg-zinc-400" />
              Quantidade
            </span>
          </div>
        </section>

        <section className={`${panelClass()} p-5 sm:p-6 xl:col-span-2`}>
          <SectionTitle
            title="Vendas por status"
            description="Distribuição do pipeline comercial."
          />

          <div className="mt-8 space-y-5">
            {statusRows.map((row) => {
              const pct = stats.nVendas > 0 ? Math.round((row.count / stats.nVendas) * 100) : 0;
              return (
                <div key={row.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-800">{row.label}</span>
                    <span className="tabular-nums text-zinc-500">
                      {row.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className={`h-full rounded-full ${row.tone}`}
                      style={{ width: `${Math.max(pct, row.count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className={panelClass()}>
          <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
            <SectionTitle
              title="Vendas recentes"
              description="Últimas movimentações registradas."
            />
            <Link
              href="/vendas"
              className="shrink-0 text-xs font-semibold text-zinc-900 underline-offset-4 hover:underline"
            >
              Ver todas
            </Link>
          </div>

          {stats.vendasRecentes.length === 0 ? (
            <div className="px-5 pb-5 sm:px-6">
              <EmptyState
                title="Nenhuma venda cadastrada"
                description="Registre a primeira venda para acompanhar o pipeline comercial."
                action={
                  <Link
                    href="/vendas/nova"
                    className="inline-flex h-11 items-center rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white hover:bg-zinc-800"
                  >
                    Nova venda
                  </Link>
                }
              />
            </div>
          ) : (
            <div className={`${tableWrapClass()} pb-2`}>
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
                  {stats.vendasRecentes.map((v, index) => (
                    <tr key={v.id} className={tableRowClass(index)}>
                      <td className={tableCellClass()}>
                        <Link
                          href={`/vendas/${v.id}`}
                          className="font-semibold text-zinc-900 underline-offset-2 hover:underline"
                        >
                          {v.titulo}
                        </Link>
                        <div className="mt-0.5 text-xs text-zinc-500">
                          {v.consorciadoNome ?? "Sem consorciado"} · {v.administradoraNome}
                        </div>
                      </td>
                      <td className={tableCellClass()}>
                        <StatusBadge status={v.statusOperacional} />
                      </td>
                      <td className={`${tableCellClass()} whitespace-nowrap tabular-nums font-medium`}>
                        {formatMoneyPtBrFromCentavos(v.valorCentavos)}
                      </td>
                      <td className={`${tableCellClass()} whitespace-nowrap`}>
                        {formatDate(v.dataVenda ?? null)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={`${panelClass()} p-6`}>
          <div className="flex items-start justify-between gap-4">
            <SectionTitle
              title="Top administradoras"
              description="Ranking por volume e valor de vendas."
            />
            <Link
              href="/administradoras"
              className="shrink-0 text-xs font-semibold text-zinc-900 underline-offset-4 hover:underline"
            >
              Ver todas
            </Link>
          </div>

          {stats.vendasPorAdministradora.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="Sem dados de ranking"
                description="Cadastre administradoras e vendas para ver o ranking por parceiro."
              />
            </div>
          ) : (
            <div className={`${tableWrapClass()} mt-6`}>
              <table className={dataTableClass()}>
                <thead>
                  <tr>
                    <th className={tableHeadCellClass()}>Administradora</th>
                    <th className={tableHeadCellClass()}>Vendas</th>
                    <th className={tableHeadCellClass()}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.vendasPorAdministradora.map((adm, index) => (
                    <tr key={adm.id} className={tableRowClass(index)}>
                      <td className={tableCellClass()}>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xs font-bold text-zinc-700">
                            {index + 1}
                          </span>
                          <Link
                            href={`/administradoras/${adm.id}`}
                            className="font-semibold text-zinc-900 underline-offset-2 hover:underline"
                          >
                            {adm.nome}
                          </Link>
                        </div>
                      </td>
                      <td className={`${tableCellClass()} tabular-nums font-medium`}>
                        {adm.quantidade}
                      </td>
                      <td className={`${tableCellClass()} whitespace-nowrap tabular-nums font-medium`}>
                        {formatMoneyPtBrFromCentavos(adm.valorCentavos)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
