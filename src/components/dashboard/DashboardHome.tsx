"use client";

import Link from "next/link";
import type { DashboardCounts } from "@/lib/types/domain";

type DashboardHomeProps = {
  initialCounts: DashboardCounts;
};

export function DashboardHome({ initialCounts }: DashboardHomeProps) {
  const { nAdministradoras, nPlanos, nVendas, nVendasFechadas } = initialCounts;

  return (
    <>
      <header className="mb-8 space-y-3">
        <nav
          className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-zinc-500"
          aria-label="Trilha de navegação"
        >
          <span className="font-medium text-zinc-800">Dashboard</span>
        </nav>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Dashboard
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-zinc-600">
            Indicadores da base cadastrada e atalhos para administradoras, planos e vendas.
          </p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/administradoras"
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
        >
          <div className="text-xs font-medium text-zinc-500">Administradoras</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{nAdministradoras}</div>
          <div className="mt-1 text-sm text-zinc-600">Parceiros e regras por administradora.</div>
          <div className="mt-3 text-xs font-medium text-zinc-900 underline-offset-2 hover:underline">
            Abrir cadastro
          </div>
        </Link>

        <Link
          href="/planos"
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
        >
          <div className="text-xs font-medium text-zinc-500">Planos</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{nPlanos}</div>
          <div className="mt-1 text-sm text-zinc-600">Produtos vinculados às administradoras.</div>
          <div className="mt-3 text-xs font-medium text-zinc-900 underline-offset-2 hover:underline">
            Abrir cadastro
          </div>
        </Link>

        <Link
          href="/vendas"
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
        >
          <div className="text-xs font-medium text-zinc-500">Vendas</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{nVendas}</div>
          <div className="mt-1 text-sm text-zinc-600">
            Fechadas: <span className="font-medium text-zinc-800">{nVendasFechadas}</span>
          </div>
          <div className="mt-3 text-xs font-medium text-zinc-900 underline-offset-2 hover:underline">
            Abrir lista
          </div>
        </Link>

        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 p-5">
          <div className="text-xs font-medium text-zinc-500">Comissões</div>
          <div className="mt-2 text-2xl font-semibold text-zinc-400">—</div>
          <div className="mt-1 text-sm text-zinc-600">
            Próxima etapa: extratos e relatórios a partir dos planos.
          </div>
        </div>
      </div>
    </>
  );
}
