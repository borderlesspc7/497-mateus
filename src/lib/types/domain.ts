export type VendaStatus = "RASCUNHO" | "ENVIADA" | "FECHADA" | "CANCELADA";

export type AdministradoraRow = {
  id: string;
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

export type AdministradoraMini = { id: string; nome: string; cnpj: string };

export type PlanoRow = {
  id: string;
  administradoraId: string;
  administradora: AdministradoraMini;
  nome: string;
  tipoBem: string;
  valorCreditoCentavos: number | null;
  regrasComissaoJson: string | null;
  regrasRecebimentoJson: string | null;
  regrasEstornoJson: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlanoMini = { id: string; nome: string; tipoBem: string };

export type ConsorciadoRow = {
  id: string;
  nome: string;
  documento: string;
  telefone: string;
  email: string;
  endereco: string;
  criadoEm: string;
};

export type ConsorciadoMini = { id: string; nome: string; documento: string };

export type VendaRow = {
  id: string;
  administradoraId: string;
  planoId: string | null;
  consorciadoId: string | null;
  administradora: AdministradoraMini;
  plano: PlanoMini | null;
  consorciado: ConsorciadoMini | null;
  status: VendaStatus;
  titulo: string;
  descricao: string | null;
  valorCentavos: number | null;
  dataVenda: string | null;
  observacoes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DashboardCounts = {
  nAdministradoras: number;
  nPlanos: number;
  nVendas: number;
  nVendasFechadas: number;
};

export type DashboardVendaResumo = {
  id: string;
  titulo: string;
  status: VendaStatus;
  valorCentavos: number | null;
  dataVenda: string | null;
  consorciadoNome: string | null;
  administradoraNome: string;
};

export type DashboardMesResumo = {
  key: string;
  label: string;
  quantidade: number;
  valorCentavos: number;
};

export type DashboardAdmResumo = {
  id: string;
  nome: string;
  quantidade: number;
  valorCentavos: number;
};

export type DashboardStats = {
  nConsorciados: number;
  nAdministradoras: number;
  nPlanos: number;
  nVendas: number;
  nVendasFechadas: number;
  nVendasRascunho: number;
  nVendasEnviadas: number;
  nVendasCanceladas: number;
  valorTotalCentavos: number;
  valorFechadasCentavos: number;
  ticketMedioCentavos: number | null;
  vendasPorMes: DashboardMesResumo[];
  vendasRecentes: DashboardVendaResumo[];
  vendasPorAdministradora: DashboardAdmResumo[];
};
