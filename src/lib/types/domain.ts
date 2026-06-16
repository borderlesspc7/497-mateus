export type UserRole = "admin" | "gerente" | "vendedor";

export type UsuarioRow = {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

/** Status operacional exclusivo da cota/contrato — nunca pertence ao ConsorciadoRow. */
export type StatusOperacionalCota = "ATIVO" | "INADIMPLENTE" | "CANCELADO";

/** @deprecated Prefira StatusOperacionalCota. Mantido para compatibilidade. */
export type VendaStatus = StatusOperacionalCota;

/** Atributos descritivos da cota — não compõem a chave matriz (use apenas numeroContrato). */
export type CotaIdentificacao = {
  grupo: string;
  cota: string;
  dataVencimento: number;
};

/** @deprecated Prefira CotaIdentificacao. Mantido para compatibilidade de importações. */
export type CotaContrato = CotaIdentificacao & {
  numeroContrato: string;
};

export type StatusPosVenda = "PENDENTE" | "FEITO";

export type StatusInconsistencia = "CONSISTENTE" | "INCONSISTENTE";

export type TipoRegistroAtendimento =
  | "COBRANCA"
  | "COBRANCA_WHATSAPP"
  | "POS_VENDA"
  | "INCONSISTENCIA";

export type HistoricoAtendimentoUniversalRow = {
  id: string;
  dataRegistro: string;
  tipoRegistro: TipoRegistroAtendimento;
  observacao: string;
};

export type ChecklistAtivacao = {
  documentacaoRecebida: boolean;
  taxaPaga: boolean;
  contratoAssinado: boolean;
};

export type HistoricoAtendimentoTipo = "chamada" | "email" | "nota" | "atualizacao";

export type HistoricoAtendimentoRow = {
  id: string;
  data: string;
  tipo: HistoricoAtendimentoTipo;
  descricao: string;
};

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
  percentualComissao: number | null;
  parcelasRecebimento: number | null;
  diasParaEstorno: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ExtratoStatus = "PENDENTE" | "LIBERADO" | "PAGO";

export type ExtratoTipo = "COMISSAO" | "ESTORNO";

export type ExtratoRow = {
  id: string;
  vendaId: string;
  planoId: string;
  parcelaNumero: number;
  parcelaTotal: number;
  parcelaLabel: string;
  valorCentavos: number;
  status: ExtratoStatus;
  tipo: ExtratoTipo;
  vendedorId: string;
  equipeId: string;
  vendaTitulo: string;
  numeroContrato: string;
  consorciadoNome: string | null;
  planoNome: string;
  vendedorNome: string | null;
  equipeNome: string | null;
  percentualComissao: number;
  creditoCentavos: number;
  createdAt: string;
  updatedAt: string;
};

export type PlanoMini = { id: string; nome: string; tipoBem: string };

/** Perfil do consorciado — sem status operacional (cada cota tem o seu). */
export type ConsorciadoRow = {
  id: string;
  nome: string;
  cpf_cnpj: string;
  telefone: string;
  email: string;
  criadoEm: string;
};

export type ConsorciadoMini = { id: string; nome: string; cpf_cnpj: string; telefone: string };

export type EquipeRow = {
  id: string;
  nome: string;
  createdAt: string;
  updatedAt: string;
};

export type EquipeMini = { id: string; nome: string };

export type VendedorRow = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  equipeId: string;
  equipe: EquipeMini;
  createdAt: string;
  updatedAt: string;
};

export type VendedorMini = { id: string; nome: string; equipeId: string };

export type VendaRow = {
  id: string;
  administradoraId: string;
  planoId: string | null;
  consorciadoId: string | null;
  equipeId: string;
  vendedorId: string;
  administradora: AdministradoraMini;
  plano: PlanoMini | null;
  consorciado: ConsorciadoMini | null;
  equipe: EquipeMini | null;
  vendedor: VendedorMini | null;
  /** Status operacional da cota — não confundir com perfil do consorciado. */
  statusOperacional: StatusOperacionalCota;
  statusInconsistencia: StatusInconsistencia;
  statusPosVenda: StatusPosVenda;
  parcelasPagasCancelamento: number | null;
  /** Chave matriz universal — identificador único do produto/cota no sistema. */
  numeroContrato: string;
  /** Atributos descritivos da cota (não fazem parte da chave matriz). */
  grupo: string;
  cota: string;
  dataVencimento: number;
  titulo: string;
  descricao: string | null;
  valorCentavos: number | null;
  dataVenda: string | null;
  /** Mês/ano de fechamento no formato YYYY-MM. */
  mesAnoFechamento: string | null;
  observacoes: string | null;
  checklistAtivacao: ChecklistAtivacao;
  dataPendencia: string | null;
  alertaAtivo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DashboardCounts = {
  nAdministradoras: number;
  nPlanos: number;
  nVendas: number;
  nVendasAtivas: number;
};

export type DashboardVendaResumo = {
  id: string;
  titulo: string;
  statusOperacional: StatusOperacionalCota;
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

export type DashboardVendedorRanking = {
  id: string;
  nome: string;
  equipeId: string;
  equipeNome: string;
  creditoCentavos: number;
  quantidadeVendas: number;
};

export type DashboardEquipeRanking = {
  id: string;
  nome: string;
  creditoCentavos: number;
  quantidadeVendas: number;
};

export type DashboardRanking = {
  mesLabel: string;
  mesAno: { month: number; year: number };
  topVendedores: DashboardVendedorRanking[];
  melhorEquipe: DashboardEquipeRanking | null;
  topEquipes: DashboardEquipeRanking[];
};

export type DashboardStats = {
  nConsorciados: number;
  nAdministradoras: number;
  nPlanos: number;
  nVendas: number;
  nVendasAtivas: number;
  nVendasInadimplentes: number;
  nVendasCanceladas: number;
  valorTotalCentavos: number;
  valorAtivasCentavos: number;
  valorCreditoComercializadoCentavos: number;
  comissoesPagasMesCentavos: number;
  ticketMedioCentavos: number | null;
  vendasPorMes: DashboardMesResumo[];
  vendasRecentes: DashboardVendaResumo[];
  vendasPorAdministradora: DashboardAdmResumo[];
};
