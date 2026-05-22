import type { VendaStatus } from "@/lib/types/domain";

export const COLLECTIONS = {
  administradoras: "administradoras",
  planos: "planos",
  vendas: "vendas",
  consorciados: "consorciados",
} as const;

export type AdministradoraDoc = {
  nome: string;
  cnpj: string;
  telefone: string | null;
  email: string | null;
  contatoPrincipal: string | null;
  enderecoLogradouro: string | null;
  enderecoNumero: string | null;
  enderecoComplemento: string | null;
  enderecoBairro: string | null;
  enderecoCidade: string | null;
  enderecoUf: string | null;
  enderecoCep: string | null;
  regrasOperacionaisJson: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlanoDoc = {
  administradoraId: string;
  nome: string;
  tipoBem: string;
  valorCreditoCentavos: number | null;
  regrasComissaoJson: string | null;
  regrasRecebimentoJson: string | null;
  regrasEstornoJson: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ConsorciadoDoc = {
  nome: string;
  documento: string;
  telefone: string;
  email: string;
  endereco: string;
  criadoEm: string;
};

export type VendaDoc = {
  administradoraId: string;
  planoId: string | null;
  consorciadoId: string | null;
  status: VendaStatus;
  titulo: string;
  descricao: string | null;
  valorCentavos: number | null;
  dataVenda: string | null;
  observacoes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DocWithId<T> = T & { id: string };

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function sortByCreatedAtDesc<T extends { createdAt: string }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function sortByCriadoEmDesc<T extends { criadoEm: string }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
  );
}
