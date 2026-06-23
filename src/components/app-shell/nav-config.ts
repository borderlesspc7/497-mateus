import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  DollarSign,
  HeadphonesIcon,
  LayoutDashboard,
  Settings,
  Target,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import type { UserRole } from "@/lib/auth/roles";
import {
  canAccessConfiguracoes,
  canManageUsuarios,
  canViewComissoes,
} from "@/lib/auth/roles";

export type NavLinkItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const BASE_MAIN_NAV: NavLinkItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/consorciados", label: "Consorciados", icon: Users },
  { href: "/vendas", label: "Vendas", icon: Wallet },
  { href: "/importacao", label: "Importação", icon: Upload },
  { href: "/controle/inadimplencia", label: "Inadimplência", icon: AlertTriangle },
  { href: "/controle/inconsistencia", label: "Inconsistência", icon: AlertCircle },
  { href: "/controle/pos-venda", label: "Pós-venda", icon: HeadphonesIcon },
];

const BASE_CONFIG_NAV: NavLinkItem[] = [
  { href: "/configuracoes", label: "Visão geral", icon: LayoutDashboard },
  { href: "/administradoras", label: "Administradoras", icon: Building2 },
  { href: "/planos", label: "Planos", icon: Wallet },
  { href: "/configuracoes/equipes", label: "Equipes", icon: Users },
  { href: "/configuracoes/vendedores", label: "Vendedores", icon: Users },
];

export function buildMainNav(role: UserRole | null): NavLinkItem[] {
  const items = [...BASE_MAIN_NAV];
  if (role && canViewComissoes(role)) {
    items.splice(3, 0, { href: "/comissoes", label: "Comissões", icon: DollarSign });
  }
  if (role && canAccessConfiguracoes(role)) {
    items.splice(4, 0, { href: "/metas", label: "Metas", icon: Target });
  } else if (role === "vendedor") {
    items.splice(3, 0, { href: "/metas/minhas", label: "Minhas Metas", icon: Target });
  }
  if (!role || !canAccessConfiguracoes(role)) {
    return items.filter((item) => item.href !== "/importacao");
  }
  return items;
}

export function buildConfigNav(role: UserRole | null): NavLinkItem[] {
  const items = [...BASE_CONFIG_NAV];
  if (role && canManageUsuarios(role)) {
    items.push({ href: "/configuracoes/usuarios", label: "Usuários", icon: Users });
  }
  return items;
}

export function isNavActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function isConfigSectionActive(pathname: string) {
  return (
    pathname.startsWith("/configuracoes") ||
    pathname.startsWith("/administradoras") ||
    pathname.startsWith("/planos")
  );
}

const ROUTE_LABELS: Record<string, string> = {
  "": "Dashboard",
  consorciados: "Consorciados",
  vendas: "Vendas",
  comissoes: "Comissões",
  metas: "Metas",
  minhas: "Minhas Metas",
  importacao: "Importação",
  controle: "Controle",
  inadimplencia: "Inadimplência",
  inconsistencia: "Inconsistência",
  "pos-venda": "Pós-venda",
  configuracoes: "Configurações",
  administradoras: "Administradoras",
  planos: "Planos",
  equipes: "Equipes",
  vendedores: "Vendedores",
  usuarios: "Usuários",
  nova: "Nova",
  editar: "Editar",
};

export type BreadcrumbItem = { label: string; href?: string };

export function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname === "/") {
    return [{ label: "Dashboard" }];
  }

  const segments = pathname.split("/").filter(Boolean);
  const items: BreadcrumbItem[] = [{ label: "Dashboard", href: "/" }];

  let path = "";
  for (const segment of segments) {
    path += `/${segment}`;
    const label = ROUTE_LABELS[segment] ?? segment;
    const isLast = segment === segments[segments.length - 1];
    items.push({
      label,
      href: isLast ? undefined : path,
    });
  }

  return items;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export { Settings };
