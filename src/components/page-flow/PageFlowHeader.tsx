"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export type PageCrumb = { label: string; href?: string };

type PageFlowHeaderProps = {
  crumbs: PageCrumb[];
  title: string;
  description?: string;
  actions?: ReactNode;
};

/**
 * Cabeçalho consistente entre telas: trilha (breadcrumb), título e ações à direita.
 */
export function PageFlowHeader({
  crumbs,
  title,
  description,
  actions,
}: PageFlowHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1 space-y-3">
        <nav
          className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-zinc-500"
          aria-label="Trilha de navegação"
        >
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1.5">
              {i > 0 ? (
                <span className="select-none text-zinc-300" aria-hidden>
                  /
                </span>
              ) : null}
              {c.href ? (
                <Link
                  href={c.href}
                  className="rounded-sm text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                >
                  {c.label}
                </Link>
              ) : (
                <span className="font-medium text-zinc-800">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm leading-6 text-zinc-600">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">{actions}</div>
      ) : null}
    </header>
  );
}
