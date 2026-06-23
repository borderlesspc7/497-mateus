import type { Conquista, ConquistaCondicaoTipo, Realizacao } from "@/types/metas";
import type { VendaDoc } from "@/lib/firestore/types";
import { parsePeriodo } from "@/lib/periodo";

export const CONQUISTAS_SEED: Omit<Conquista, "id">[] = [
  {
    nome: "Primeira Sangue",
    descricao: "Registrou a primeira venda do mês.",
    icone: "🎯",
    categoria: "VENDAS",
    condicao: { tipo: "PRIMEIRA_VENDA_MES" },
    ativo: true,
  },
  {
    nome: "Bateu a Meta",
    descricao: "Atingiu 100% da meta de vendas.",
    icone: "🏆",
    categoria: "VENDAS",
    condicao: { tipo: "META_VENDAS_ATINGIDA" },
    ativo: true,
  },
  {
    nome: "Crédito em Dobro",
    descricao: "Atingiu 100% da meta de crédito.",
    icone: "💰",
    categoria: "CREDITO",
    condicao: { tipo: "META_CREDITO_ATINGIDA" },
    ativo: true,
  },
  {
    nome: "Ativador",
    descricao: "Manteve taxa de ativação (pós-venda) acima de 80%.",
    icone: "✅",
    categoria: "ATIVACAO",
    condicao: { tipo: "META_ATIVACAO_ATINGIDA", valor: 80 },
    ativo: true,
  },
  {
    nome: "Hat-Trick",
    descricao: "Vendeu em 3 semanas consecutivas no mês.",
    icone: "🔥",
    categoria: "CONSISTENCIA",
    condicao: { tipo: "SEQUENCIA_SEMANAS", valor: 3 },
    ativo: true,
  },
  {
    nome: "Completo",
    descricao: "Atingiu todas as metas do período.",
    icone: "⭐",
    categoria: "VENDAS",
    condicao: { tipo: "TODAS_METAS_ATINGIDAS" },
    ativo: true,
  },
];

export const CONQUISTA_IDS = {
  PRIMEIRA_SANGUE: "primeira_sangue",
  BATEU_META: "bateu_meta",
  CREDITO_DOBRO: "credito_dobro",
  ATIVADOR: "ativador",
  HAT_TRICK: "hat_trick",
  COMPLETO: "completo",
} as const;

export const CONQUISTAS_SEED_WITH_IDS: Conquista[] = [
  { id: CONQUISTA_IDS.PRIMEIRA_SANGUE, ...CONQUISTAS_SEED[0] },
  { id: CONQUISTA_IDS.BATEU_META, ...CONQUISTAS_SEED[1] },
  { id: CONQUISTA_IDS.CREDITO_DOBRO, ...CONQUISTAS_SEED[2] },
  { id: CONQUISTA_IDS.ATIVADOR, ...CONQUISTAS_SEED[3] },
  { id: CONQUISTA_IDS.HAT_TRICK, ...CONQUISTAS_SEED[4] },
  { id: CONQUISTA_IDS.COMPLETO, ...CONQUISTAS_SEED[5] },
];

function roundPercentual(realizado: number, meta: number): number {
  if (meta <= 0) return 0;
  return Math.round((realizado / meta) * 1000) / 10;
}

export function calcularPercentuais(input: {
  realizadoVendas: number;
  realizadoCreditoCentavos: number;
  realizadoAtivacao: number;
  metaVendas: number;
  metaCreditoCentavos: number;
  metaAtivacao: number;
}): Pick<Realizacao, "percentualVendas" | "percentualCredito" | "percentualAtivacao"> {
  return {
    percentualVendas: roundPercentual(input.realizadoVendas, input.metaVendas),
    percentualCredito: roundPercentual(
      input.realizadoCreditoCentavos,
      input.metaCreditoCentavos,
    ),
    percentualAtivacao: roundPercentual(input.realizadoAtivacao, input.metaAtivacao),
  };
}

function hasSequenciaSemanas(vendas: VendaDoc[], periodo: string, semanas: number): boolean {
  if (vendas.length === 0 || semanas <= 0) return false;
  const { inicio } = parsePeriodo(periodo);
  const weekFlags = new Array<boolean>(semanas).fill(false);

  for (const venda of vendas) {
    const date = new Date(venda.createdAt);
    if (Number.isNaN(date.getTime())) continue;
    const weekIndex = Math.floor(
      (date.getTime() - inicio.getTime()) / (7 * 24 * 60 * 60 * 1000),
    );
    if (weekIndex >= 0 && weekIndex < semanas) {
      weekFlags[weekIndex] = true;
    }
  }

  return weekFlags.every(Boolean);
}

function isCondicaoAtendida(
  tipo: ConquistaCondicaoTipo,
  valor: number | undefined,
  ctx: {
    realizadoVendas: number;
    percentualVendas: number;
    percentualCredito: number;
    realizadoAtivacao: number;
    metaAtivacao: number;
    vendas: VendaDoc[];
    periodo: string;
  },
): boolean {
  switch (tipo) {
    case "PRIMEIRA_VENDA_MES":
      return ctx.realizadoVendas >= 1;
    case "META_VENDAS_ATINGIDA":
      return ctx.percentualVendas >= 100;
    case "META_CREDITO_ATINGIDA":
      return ctx.percentualCredito >= 100;
    case "META_ATIVACAO_ATINGIDA": {
      const limite = valor ?? ctx.metaAtivacao;
      return ctx.realizadoAtivacao >= limite;
    }
    case "TODAS_METAS_ATINGIDAS":
      return (
        ctx.percentualVendas >= 100 &&
        ctx.percentualCredito >= 100 &&
        ctx.realizadoAtivacao >= ctx.metaAtivacao
      );
    case "SEQUENCIA_SEMANAS":
      return hasSequenciaSemanas(ctx.vendas, ctx.periodo, valor ?? 3);
    default:
      return false;
  }
}

export function avaliarConquistas(
  conquistas: Conquista[],
  ctx: {
    realizadoVendas: number;
    percentualVendas: number;
    percentualCredito: number;
    realizadoAtivacao: number;
    metaAtivacao: number;
    vendas: VendaDoc[];
    periodo: string;
  },
): string[] {
  return conquistas
    .filter((c) => c.ativo)
    .filter((c) =>
      isCondicaoAtendida(c.condicao.tipo, c.condicao.valor, ctx),
    )
    .map((c) => c.id);
}

export function buildRealizacaoId(
  tipo: "VENDEDOR" | "EQUIPE",
  referenciaId: string,
  periodo: string,
): string {
  return `${tipo}_${referenciaId}_${periodo}`;
}

export function filtrarVendasPeriodo(
  vendas: VendaDoc[],
  inicio: Date,
  fim: Date,
): VendaDoc[] {
  const inicioMs = inicio.getTime();
  const fimMs = fim.getTime();
  return vendas.filter((v) => {
    if (v.statusOperacional === "CANCELADO") return false;
    const ms = new Date(v.createdAt).getTime();
    if (Number.isNaN(ms)) return false;
    return ms >= inicioMs && ms <= fimMs;
  });
}

export function calcularRealizados(vendas: VendaDoc[]): {
  realizadoVendas: number;
  realizadoCreditoCentavos: number;
  realizadoAtivacao: number;
} {
  const realizadoVendas = vendas.length;
  const realizadoCreditoCentavos = vendas.reduce(
    (sum, v) => sum + (v.valorCentavos ?? 0),
    0,
  );
  const concluidas = vendas.filter((v) => v.statusPosVenda === "FEITO").length;
  const realizadoAtivacao =
    realizadoVendas > 0 ? Math.round((concluidas / realizadoVendas) * 1000) / 10 : 0;

  return { realizadoVendas, realizadoCreditoCentavos, realizadoAtivacao };
}

export function progressBarTone(percentual: number): string {
  if (percentual >= 100) return "bg-emerald-500";
  if (percentual >= 80) return "bg-sky-500";
  if (percentual >= 50) return "bg-amber-400";
  return "bg-red-500";
}
