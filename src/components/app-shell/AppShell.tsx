"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren, useEffect, useState } from "react";
import { ensureFirebaseAuth } from "@/lib/firebase/client";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/consorciados", label: "Consorciados" },
  { href: "/administradoras", label: "Administradoras" },
  { href: "/planos", label: "Planos" },
  { href: "/vendas", label: "Vendas" },
];

function isNavActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

function navLinkClass(active: boolean) {
  return [
    "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
    active
      ? "bg-zinc-900 text-white"
      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
  ].join(" ");
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = isNavActive(pathname, href);

  return (
    <Link href={href} className={navLinkClass(active)} aria-current={active ? "page" : undefined}>
      {label}
    </Link>
  );
}

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    void ensureFirebaseAuth().catch(() => {
      // Falha silenciosa: módulos server-side continuam via Admin SDK.
    });
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="flex min-h-screen w-full">
        <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white md:sticky md:top-0 md:flex md:h-svh md:flex-col md:px-5 md:py-6">
          <div className="flex items-center gap-3 px-1">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-900 text-sm font-semibold text-white">
              GO
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-semibold text-zinc-900">Gestão Operacional</div>
              <div className="text-xs text-zinc-500">Consórcio</div>
            </div>
          </div>

          <nav className="mt-8 flex flex-col gap-1 px-1" aria-label="Menu principal">
            {nav.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </nav>

          <div className="mt-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs leading-5 text-zinc-600">
            Consorciados, administradoras, planos e vendas no Firestore (Firebase).
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur">
            <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-800 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 md:hidden"
                  aria-expanded={mobileOpen}
                  aria-controls="mobile-nav"
                  aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
                  onClick={() => setMobileOpen((o) => !o)}
                >
                  {mobileOpen ? (
                    <span className="text-lg leading-none" aria-hidden>
                      ×
                    </span>
                  ) : (
                    <span className="flex flex-col gap-1.5" aria-hidden>
                      <span className="h-0.5 w-5 rounded-full bg-zinc-800" />
                      <span className="h-0.5 w-5 rounded-full bg-zinc-800" />
                      <span className="h-0.5 w-5 rounded-full bg-zinc-800" />
                    </span>
                  )}
                </button>
                <div className="min-w-0 truncate text-sm font-medium text-zinc-700 sm:text-base">
                  Sistema de Gestão Operacional
                </div>
              </div>
              <div className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
                Admin
              </div>
            </div>
          </header>

          {mobileOpen ? (
            <div className="fixed inset-0 z-40 md:hidden" id="mobile-nav">
              <button
                type="button"
                className="absolute inset-0 bg-black/40"
                aria-label="Fechar menu"
                onClick={() => setMobileOpen(false)}
              />
              <div className="absolute left-0 top-0 flex h-full w-[min(18rem,88vw)] flex-col border-r border-zinc-200 bg-white p-5 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-900 text-sm font-semibold text-white">
                    GO
                  </div>
                  <div className="leading-tight">
                    <div className="text-sm font-semibold">Gestão Operacional</div>
                    <div className="text-xs text-zinc-500">Consórcio</div>
                  </div>
                </div>
                <nav className="mt-6 flex flex-col gap-1" aria-label="Menu principal">
                  {nav.map((item) => {
                    const active = isNavActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={navLinkClass(active)}
                        aria-current={active ? "page" : undefined}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          ) : null}

          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
