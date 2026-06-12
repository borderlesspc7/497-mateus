"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { NavigationProgress } from "@/components/navigation/NavigationProgress";
import {
  canAccessConfiguracoes,
  canManageUsuarios,
  canViewComissoes,
  roleLabel,
  type UserRole,
} from "@/lib/auth/roles";

type NavLinkItem = { href: string; label: string };

const BASE_MAIN_NAV: NavLinkItem[] = [
  { href: "/", label: "Dashboard" },
  { href: "/consorciados", label: "Consorciados" },
  { href: "/vendas", label: "Vendas" },
  { href: "/importacao", label: "Importação" },
  { href: "/controle/inadimplencia", label: "Inadimplência" },
  { href: "/controle/inconsistencia", label: "Inconsistência" },
  { href: "/controle/pos-venda", label: "Pós-venda" },
];

function buildMainNav(role: UserRole | null): NavLinkItem[] {
  const items = [...BASE_MAIN_NAV];
  if (role && canViewComissoes(role)) {
    items.splice(3, 0, { href: "/comissoes", label: "Comissões" });
  }
  if (!role || !canAccessConfiguracoes(role)) {
    return items.filter((item) => item.href !== "/importacao");
  }
  return items;
}

const BASE_CONFIG_NAV: NavLinkItem[] = [
  { href: "/configuracoes", label: "Visão geral" },
  { href: "/administradoras", label: "Administradoras" },
  { href: "/planos", label: "Planos" },
  { href: "/configuracoes/equipes", label: "Equipes" },
  { href: "/configuracoes/vendedores", label: "Vendedores" },
];

function buildConfigNav(role: UserRole | null): NavLinkItem[] {
  const items = [...BASE_CONFIG_NAV];
  if (role && canManageUsuarios(role)) {
    items.push({ href: "/configuracoes/usuarios", label: "Usuários" });
  }
  return items;
}

function isNavActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

function isConfigSectionActive(pathname: string) {
  return (
    pathname.startsWith("/configuracoes") ||
    pathname.startsWith("/administradoras") ||
    pathname.startsWith("/planos")
  );
}

function navLinkClass(active: boolean, nested = false) {
  return [
    "block rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
    nested ? "px-3 py-2" : "px-4 py-3",
    active
      ? nested
        ? "bg-zinc-100 text-zinc-900"
        : "bg-zinc-900 text-white shadow-sm"
      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 hover:shadow-sm",
  ].join(" ");
}

function NavLink({ href, label, nested = false }: NavLinkItem & { nested?: boolean }) {
  const pathname = usePathname();
  const active = isNavActive(pathname, href);

  return (
    <Link
      href={href}
      className={navLinkClass(active, nested)}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}

function ConfigNavGroup({
  onNavigate,
  role,
}: {
  onNavigate?: () => void;
  role: UserRole | null;
}) {
  const pathname = usePathname();
  const sectionActive = isConfigSectionActive(pathname);
  const [open, setOpen] = useState(sectionActive);
  const configNav = buildConfigNav(role);

  useEffect(() => {
    if (sectionActive) setOpen(true);
  }, [sectionActive]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          "flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
          sectionActive
            ? "bg-zinc-900 text-white shadow-sm"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
        ].join(" ")}
        aria-expanded={open}
      >
        Configurações
        <span className="text-xs opacity-80" aria-hidden>
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open ? (
        <div className="mt-1.5 flex flex-col gap-0.5 border-l border-zinc-200 pl-3 ml-2">
          {configNav.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={navLinkClass(active, true)}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function SidebarNav({
  onNavigate,
  role,
}: {
  onNavigate?: () => void;
  role: UserRole | null;
}) {
  const mainNav = buildMainNav(role);
  const showConfig = role ? canAccessConfiguracoes(role) : false;

  return (
    <nav className="flex flex-col gap-1.5 px-1" aria-label="Menu principal">
      {mainNav.map((item) => (
        <div key={item.href} onClick={onNavigate}>
          <NavLink href={item.href} label={item.label} />
        </div>
      ))}
      {showConfig ? <ConfigNavGroup onNavigate={onNavigate} role={role} /> : null}
    </nav>
  );
}

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function onSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  const userLabel = user?.displayName?.trim() || user?.email || "Usuário";
  const userRoleLabel = user?.role ? roleLabel(user.role) : null;

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
      <NavigationProgress />
      <div className="flex min-h-screen w-full">
        <aside className="hidden w-[17rem] shrink-0 border-r border-zinc-200 bg-white md:sticky md:top-0 md:flex md:h-svh md:flex-col md:px-6 md:py-7">
          <div className="flex items-center gap-3.5 px-1">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-zinc-900 text-sm font-bold text-white shadow-sm">
              GO
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-semibold text-zinc-900">Gestão Operacional</div>
              <div className="text-xs text-zinc-500">Consórcio</div>
            </div>
          </div>

          <div className="mt-10">
            <SidebarNav role={user?.role ?? null} />
          </div>

          <div className="mt-auto rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 text-xs leading-5 text-zinc-600">
            Dados operacionais sincronizados com Firebase Firestore.
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur-md">
            <div className="flex h-[4.25rem] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-800 shadow-sm outline-none transition-colors hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-400 md:hidden"
                  aria-expanded={mobileOpen}
                  aria-controls="mobile-nav"
                  aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
                  onClick={() => setMobileOpen((o) => !o)}
                >
                  {mobileOpen ? (
                    <span className="text-xl leading-none" aria-hidden>
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
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-zinc-900 sm:text-base">
                    Sistema de Gestão Operacional
                  </div>
                  <div className="hidden truncate text-xs text-zinc-500 sm:block">
                    Consórcio · painel administrativo
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2.5">
                <div
                  className="hidden max-w-[14rem] truncate rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs sm:block"
                  title={user?.email ?? undefined}
                >
                  <div className="truncate font-medium text-zinc-800">{userLabel}</div>
                  {userRoleLabel ? (
                    <div className="truncate text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                      {userRoleLabel}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => void onSignOut()}
                  disabled={signingOut}
                  className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-60"
                >
                  {signingOut ? "Saindo..." : "Sair"}
                </button>
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
              <div className="absolute left-0 top-0 flex h-full w-[min(19rem,88vw)] flex-col border-r border-zinc-200 bg-white p-6 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-zinc-900 text-sm font-bold text-white">
                    GO
                  </div>
                  <div className="leading-tight">
                    <div className="text-sm font-semibold">Gestão Operacional</div>
                    <div className="text-xs text-zinc-500">Consórcio</div>
                  </div>
                </div>
                <div className="mt-8 flex-1 overflow-y-auto">
                  <SidebarNav
                    role={user?.role ?? null}
                    onNavigate={() => setMobileOpen(false)}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <main className="mx-auto w-full max-w-[100rem] flex-1 px-4 py-6 sm:px-6 lg:px-8 xl:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
