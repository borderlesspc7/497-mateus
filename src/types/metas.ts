/** Tipos do módulo Metas & Gamificação. Timestamps persistidos como ISO string (padrão do projeto). */
export type MetaTipo = "VENDEDOR" | "EQUIPE";

export type ConquistaCategoria = "VENDAS" | "CREDITO" | "ATIVACAO" | "CONSISTENCIA";

export type ConquistaCondicaoTipo =
  | "PRIMEIRA_VENDA_MES"
  | "META_VENDAS_ATINGIDA"
  | "META_CREDITO_ATINGIDA"
  | "META_ATIVACAO_ATINGIDA"
  | "TODAS_METAS_ATINGIDAS"
  | "SEQUENCIA_SEMANAS";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface Meta {
  id: string;
  periodo: string;
  tipo: MetaTipo;
  referenciaId: string;
  referenciaNome: string;
  metaVendas: number;
  metaCreditoCentavos: number;
  metaAtivacao: number;
  criadoPor: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Realizacao {
  id: string;
  metaId: string;
  periodo: string;
  tipo: MetaTipo;
  referenciaId: string;
  referenciaNome: string;
  realizadoVendas: number;
  realizadoCreditoCentavos: number;
  realizadoAtivacao: number;
  percentualVendas: number;
  percentualCredito: number;
  percentualAtivacao: number;
  conquistasDesbloqueadas: string[];
  atualizadoEm: string;
}

export interface Conquista {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  categoria: ConquistaCategoria;
  condicao: {
    tipo: ConquistaCondicaoTipo;
    valor?: number;
  };
  ativo: boolean;
}

export type RankingPeriodoItem = {
  posicao: number;
  referenciaId: string;
  referenciaNome: string;
  realizadoVendas: number;
  realizadoCreditoCentavos: number;
  percentualVendas: number;
  percentualCredito: number;
  percentualAtivacao: number;
  metaVendas: number | null;
  metaCreditoCentavos: number | null;
  metaAtivacao: number | null;
  conquistasDesbloqueadas: string[];
  temMeta: boolean;
};

export type CriarMetaInput = {
  periodo: string;
  tipo: MetaTipo;
  referenciaId: string;
  metaVendas: number;
  metaCreditoCentavos: number;
  metaAtivacao: number;
};

export type EditarMetaInput = {
  metaVendas: number;
  metaCreditoCentavos: number;
  metaAtivacao: number;
};

export type MetaComRealizacao = Meta & {
  realizacao: Realizacao | null;
};
