"use server";

import { revalidatePath } from "next/cache";
import {
  requireAdmin,
  requireGerenteOrAdmin,
  requireServerSessionUser,
} from "@/lib/auth/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { COLLECTIONS, nowIso, type VendaDoc } from "@/lib/firestore/types";
import {
  avaliarConquistas,
  buildRealizacaoId,
  calcularPercentuais,
  calcularRealizados,
  CONQUISTAS_SEED_WITH_IDS,
  filtrarVendasPeriodo,
} from "@/lib/metas/conquistas";
import { criarMetaSchema, editarMetaSchema } from "@/lib/metas/schemas";
import { parsePeriodo, periodoAtual, isPeriodoValido } from "@/lib/periodo";
import type {
  ActionResult,
  Conquista,
  CriarMetaInput,
  EditarMetaInput,
  Meta,
  MetaComRealizacao,
  MetaTipo,
  RankingPeriodoItem,
  Realizacao,
} from "@/types/metas";

function db() {
  return getAdminFirestore();
}

function ok<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

function fail<T>(error: string): ActionResult<T> {
  return { success: false, error };
}

function revalidateMetas() {
  revalidatePath("/");
  revalidatePath("/metas");
  revalidatePath("/metas/minhas");
}

type MetaDoc = Omit<Meta, "id">;
type RealizacaoDoc = Omit<Realizacao, "id">;
type ConquistaDoc = Conquista;

function toMeta(id: string, doc: MetaDoc): Meta {
  return { id, ...doc };
}

function toRealizacao(id: string, doc: RealizacaoDoc): Realizacao {
  return { id, ...doc };
}

function toConquista(id: string, doc: ConquistaDoc): Conquista {
  return { ...doc, id };
}

async function resolveReferenciaNome(
  tipo: MetaTipo,
  referenciaId: string,
): Promise<string | null> {
  const collection = tipo === "VENDEDOR" ? COLLECTIONS.vendedores : COLLECTIONS.equipes;
  const snap = await db().collection(collection).doc(referenciaId).get();
  if (!snap.exists) return null;
  const data = snap.data() as { nome: string };
  return data.nome;
}

async function findMetaDuplicada(
  periodo: string,
  tipo: MetaTipo,
  referenciaId: string,
  excludeId?: string,
): Promise<boolean> {
  const snap = await db()
    .collection(COLLECTIONS.metas)
    .where("periodo", "==", periodo)
    .where("tipo", "==", tipo)
    .where("referenciaId", "==", referenciaId)
    .limit(1)
    .get();
  const doc = snap.docs[0];
  if (!doc) return false;
  if (excludeId && doc.id === excludeId) return false;
  return true;
}

async function listConquistasAtivas(): Promise<Conquista[]> {
  const snap = await db().collection(COLLECTIONS.conquistas).where("ativo", "==", true).get();
  if (snap.empty) return CONQUISTAS_SEED_WITH_IDS.filter((c) => c.ativo);
  return snap.docs.map((doc) => toConquista(doc.id, doc.data() as ConquistaDoc));
}

async function fetchVendasForReferencia(
  tipo: MetaTipo,
  referenciaId: string,
  inicioIso: string,
  fimIso: string,
): Promise<VendaDoc[]> {
  const field = tipo === "VENDEDOR" ? "vendedorId" : "equipeId";
  const snap = await db()
    .collection(COLLECTIONS.vendas)
    .where(field, "==", referenciaId)
    .where("createdAt", ">=", inicioIso)
    .where("createdAt", "<=", fimIso)
    .get();
  return snap.docs.map((doc) => doc.data() as VendaDoc);
}

async function resolveVendedorIdForUser(uid: string, email: string | null): Promise<string | null> {
  const snap = await db().collection(COLLECTIONS.vendedores).get();
  if (!email) return null;
  const normalizedEmail = email.trim().toLowerCase();
  for (const doc of snap.docs) {
    const data = doc.data() as { email?: string };
    if (data.email?.trim().toLowerCase() === normalizedEmail) return doc.id;
  }
  return null;
}

export async function sincronizarRealizacao(metaId: string): Promise<ActionResult<Realizacao>> {
  try {
    await requireServerSessionUser();
    const metaSnap = await db().collection(COLLECTIONS.metas).doc(metaId).get();
    if (!metaSnap.exists) return fail("Meta não encontrada.");

    const meta = toMeta(metaSnap.id, metaSnap.data() as MetaDoc);
    const { inicio, fim } = parsePeriodo(meta.periodo);
    const inicioIso = inicio.toISOString();
    const fimIso = fim.toISOString();

    const vendasRaw = await fetchVendasForReferencia(
      meta.tipo,
      meta.referenciaId,
      inicioIso,
      fimIso,
    );
    const vendas = filtrarVendasPeriodo(vendasRaw, inicio, fim);
    const { realizadoVendas, realizadoCreditoCentavos, realizadoAtivacao } =
      calcularRealizados(vendas);

    const percentuais = calcularPercentuais({
      realizadoVendas,
      realizadoCreditoCentavos,
      realizadoAtivacao,
      metaVendas: meta.metaVendas,
      metaCreditoCentavos: meta.metaCreditoCentavos,
      metaAtivacao: meta.metaAtivacao,
    });

    const conquistas = await listConquistasAtivas();
    const conquistasDesbloqueadas = avaliarConquistas(conquistas, {
      realizadoVendas,
      percentualVendas: percentuais.percentualVendas,
      percentualCredito: percentuais.percentualCredito,
      realizadoAtivacao,
      metaAtivacao: meta.metaAtivacao,
      vendas,
      periodo: meta.periodo,
    });

    const realizacaoId = buildRealizacaoId(meta.tipo, meta.referenciaId, meta.periodo);
    const ts = nowIso();
    const doc: RealizacaoDoc = {
      metaId: meta.id,
      periodo: meta.periodo,
      tipo: meta.tipo,
      referenciaId: meta.referenciaId,
      referenciaNome: meta.referenciaNome,
      realizadoVendas,
      realizadoCreditoCentavos,
      realizadoAtivacao,
      ...percentuais,
      conquistasDesbloqueadas,
      atualizadoEm: ts,
    };

    await db().collection(COLLECTIONS.realizacoes).doc(realizacaoId).set(doc);
    revalidateMetas();
    return ok(toRealizacao(realizacaoId, doc));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao sincronizar realização.");
  }
}

export async function criarMeta(input: CriarMetaInput): Promise<ActionResult<Meta>> {
  try {
    const user = await requireGerenteOrAdmin();
    const parsed = criarMetaSchema.safeParse(input);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
    }

    const data = parsed.data;
    const referenciaNome = await resolveReferenciaNome(data.tipo, data.referenciaId);
    if (!referenciaNome) {
      return fail(data.tipo === "VENDEDOR" ? "Vendedor não encontrado." : "Equipe não encontrada.");
    }

    const duplicada = await findMetaDuplicada(data.periodo, data.tipo, data.referenciaId);
    if (duplicada) {
      return fail("Já existe meta para este período, tipo e referência.");
    }

    const ts = nowIso();
    const id = db().collection(COLLECTIONS.metas).doc().id;
    const doc: MetaDoc = {
      periodo: data.periodo,
      tipo: data.tipo,
      referenciaId: data.referenciaId,
      referenciaNome,
      metaVendas: data.metaVendas,
      metaCreditoCentavos: data.metaCreditoCentavos,
      metaAtivacao: data.metaAtivacao,
      criadoPor: user.uid,
      criadoEm: ts,
      atualizadoEm: ts,
    };

    await db().collection(COLLECTIONS.metas).doc(id).set(doc);
    const meta = toMeta(id, doc);
    await sincronizarRealizacao(id);
    revalidateMetas();
    return ok(meta);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao criar meta.");
  }
}

export async function editarMeta(
  metaId: string,
  input: EditarMetaInput,
): Promise<ActionResult<Meta>> {
  try {
    await requireGerenteOrAdmin();
    const parsed = editarMetaSchema.safeParse(input);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
    }

    const snap = await db().collection(COLLECTIONS.metas).doc(metaId).get();
    if (!snap.exists) return fail("Meta não encontrada.");

    const current = snap.data() as MetaDoc;
    const next: MetaDoc = {
      ...current,
      ...parsed.data,
      atualizadoEm: nowIso(),
    };
    await db().collection(COLLECTIONS.metas).doc(metaId).set(next);
    await sincronizarRealizacao(metaId);
    revalidateMetas();
    return ok(toMeta(metaId, next));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao editar meta.");
  }
}

export async function excluirMeta(metaId: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const snap = await db().collection(COLLECTIONS.metas).doc(metaId).get();
    if (!snap.exists) return fail("Meta não encontrada.");

    const meta = toMeta(snap.id, snap.data() as MetaDoc);
    const realizacaoId = buildRealizacaoId(meta.tipo, meta.referenciaId, meta.periodo);

    await db().collection(COLLECTIONS.metas).doc(metaId).delete();
    await db().collection(COLLECTIONS.realizacoes).doc(realizacaoId).delete().catch(() => undefined);
    revalidateMetas();
    return ok(undefined);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao excluir meta.");
  }
}

export async function listarMetas(filtros?: {
  periodo?: string;
  tipo?: MetaTipo;
  referenciaId?: string;
}): Promise<ActionResult<Meta[]>> {
  try {
    const user = await requireServerSessionUser();
    let q: FirebaseFirestore.Query = db().collection(COLLECTIONS.metas);

    if (filtros?.periodo) {
      if (!isPeriodoValido(filtros.periodo)) return fail("Período inválido.");
      q = q.where("periodo", "==", filtros.periodo);
    }
    if (filtros?.tipo) {
      q = q.where("tipo", "==", filtros.tipo);
    }

    const snap = await q.get();
    let metas = snap.docs.map((doc) => toMeta(doc.id, doc.data() as MetaDoc));

    if (filtros?.referenciaId) {
      metas = metas.filter((m) => m.referenciaId === filtros.referenciaId);
    }

    if (user.role === "vendedor") {
      const vendedorId = await resolveVendedorIdForUser(user.uid, user.email);
      if (!vendedorId) return ok([]);
      metas = metas.filter((m) => m.tipo === "VENDEDOR" && m.referenciaId === vendedorId);
    }

    metas.sort((a, b) => a.referenciaNome.localeCompare(b.referenciaNome, "pt-BR"));
    return ok(metas);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao listar metas.");
  }
}

export async function listarMetasComRealizacao(filtros?: {
  periodo?: string;
  tipo?: MetaTipo;
}): Promise<ActionResult<MetaComRealizacao[]>> {
  const metasResult = await listarMetas(filtros);
  if (!metasResult.success) return metasResult;

  const items: MetaComRealizacao[] = [];
  for (const meta of metasResult.data) {
    const realizacaoId = buildRealizacaoId(meta.tipo, meta.referenciaId, meta.periodo);
    const snap = await db().collection(COLLECTIONS.realizacoes).doc(realizacaoId).get();
    items.push({
      ...meta,
      realizacao: snap.exists
        ? toRealizacao(snap.id, snap.data() as RealizacaoDoc)
        : null,
    });
  }
  return ok(items);
}

export async function sincronizarTodasRealizacoes(periodo: string): Promise<
  ActionResult<{ processadas: number; erros: number }>
> {
  try {
    await requireGerenteOrAdmin();
    if (!isPeriodoValido(periodo)) return fail("Período inválido.");

    const snap = await db()
      .collection(COLLECTIONS.metas)
      .where("periodo", "==", periodo)
      .get();
    const metaIds = snap.docs.map((doc) => doc.id);

    const results = await Promise.allSettled(
      metaIds.map((id) => sincronizarRealizacao(id)),
    );

    let erros = 0;
    for (const result of results) {
      if (result.status === "rejected") {
        erros += 1;
        continue;
      }
      if (!result.value.success) erros += 1;
    }

    revalidateMetas();
    return ok({ processadas: metaIds.length - erros, erros });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao sincronizar metas.");
  }
}

async function aggregateVendasPeriodo(
  periodo: string,
  tipo: MetaTipo,
): Promise<Map<string, { nome: string; vendas: VendaDoc[] }>> {
  const { inicio, fim } = parsePeriodo(periodo);
  const inicioIso = inicio.toISOString();
  const fimIso = fim.toISOString();

  const snap = await db()
    .collection(COLLECTIONS.vendas)
    .where("createdAt", ">=", inicioIso)
    .where("createdAt", "<=", fimIso)
    .get();

  const vendas = snap.docs
    .map((doc) => doc.data() as VendaDoc)
    .filter((v) => v.statusOperacional !== "CANCELADO");

  const map = new Map<string, { nome: string; vendas: VendaDoc[] }>();

  if (tipo === "VENDEDOR") {
    const vendedoresSnap = await db().collection(COLLECTIONS.vendedores).get();
    const nomeMap = new Map(
      vendedoresSnap.docs.map((d) => [d.id, (d.data() as { nome: string }).nome]),
    );
    for (const venda of vendas) {
      if (!venda.vendedorId) continue;
      const entry = map.get(venda.vendedorId) ?? {
        nome: nomeMap.get(venda.vendedorId) ?? "Vendedor",
        vendas: [],
      };
      entry.vendas.push(venda);
      map.set(venda.vendedorId, entry);
    }
  } else {
    const equipesSnap = await db().collection(COLLECTIONS.equipes).get();
    const nomeMap = new Map(
      equipesSnap.docs.map((d) => [d.id, (d.data() as { nome: string }).nome]),
    );
    for (const venda of vendas) {
      if (!venda.equipeId) continue;
      const entry = map.get(venda.equipeId) ?? {
        nome: nomeMap.get(venda.equipeId) ?? "Equipe",
        vendas: [],
      };
      entry.vendas.push(venda);
      map.set(venda.equipeId, entry);
    }
  }

  return map;
}

export async function getRankingPeriodo(
  periodo: string,
  tipo: MetaTipo,
): Promise<ActionResult<RankingPeriodoItem[]>> {
  try {
    await requireServerSessionUser();
    if (!isPeriodoValido(periodo)) return fail("Período inválido.");

    const [realizacoesSnap, metasSnap, agregados] = await Promise.all([
      db()
        .collection(COLLECTIONS.realizacoes)
        .where("periodo", "==", periodo)
        .where("tipo", "==", tipo)
        .get(),
      db()
        .collection(COLLECTIONS.metas)
        .where("periodo", "==", periodo)
        .where("tipo", "==", tipo)
        .get(),
      aggregateVendasPeriodo(periodo, tipo),
    ]);

    const metaMap = new Map(
      metasSnap.docs.map((doc) => {
        const meta = toMeta(doc.id, doc.data() as MetaDoc);
        return [meta.referenciaId, meta] as const;
      }),
    );

    const realizacaoMap = new Map(
      realizacoesSnap.docs.map((doc) => {
        const r = toRealizacao(doc.id, doc.data() as RealizacaoDoc);
        return [r.referenciaId, r] as const;
      }),
    );

    const referenciaIds = new Set<string>([
      ...metaMap.keys(),
      ...agregados.keys(),
    ]);

    const items: RankingPeriodoItem[] = [];

    for (const referenciaId of referenciaIds) {
      const meta = metaMap.get(referenciaId);
      const realizacao = realizacaoMap.get(referenciaId);
      const agregado = agregados.get(referenciaId);

      if (realizacao) {
        items.push({
          posicao: 0,
          referenciaId,
          referenciaNome: realizacao.referenciaNome,
          realizadoVendas: realizacao.realizadoVendas,
          realizadoCreditoCentavos: realizacao.realizadoCreditoCentavos,
          percentualVendas: realizacao.percentualVendas,
          percentualCredito: realizacao.percentualCredito,
          percentualAtivacao: realizacao.percentualAtivacao,
          metaVendas: meta?.metaVendas ?? null,
          metaCreditoCentavos: meta?.metaCreditoCentavos ?? null,
          metaAtivacao: meta?.metaAtivacao ?? null,
          conquistasDesbloqueadas: realizacao.conquistasDesbloqueadas,
          temMeta: Boolean(meta),
        });
        continue;
      }

      const vendas = agregado?.vendas ?? [];
      const { realizadoVendas, realizadoCreditoCentavos, realizadoAtivacao } =
        calcularRealizados(vendas);
      const percentuais = meta
        ? calcularPercentuais({
            realizadoVendas,
            realizadoCreditoCentavos,
            realizadoAtivacao,
            metaVendas: meta.metaVendas,
            metaCreditoCentavos: meta.metaCreditoCentavos,
            metaAtivacao: meta.metaAtivacao,
          })
        : { percentualVendas: 0, percentualCredito: 0, percentualAtivacao: 0 };

      items.push({
        posicao: 0,
        referenciaId,
        referenciaNome:
          agregado?.nome ?? meta?.referenciaNome ?? referenciaId,
        realizadoVendas,
        realizadoCreditoCentavos,
        percentualVendas: percentuais.percentualVendas,
        percentualCredito: percentuais.percentualCredito,
        percentualAtivacao: realizadoAtivacao,
        metaVendas: meta?.metaVendas ?? null,
        metaCreditoCentavos: meta?.metaCreditoCentavos ?? null,
        metaAtivacao: meta?.metaAtivacao ?? null,
        conquistasDesbloqueadas: [],
        temMeta: Boolean(meta),
      });
    }

    items.sort((a, b) => {
      const byPercent = b.percentualVendas - a.percentualVendas;
      if (byPercent !== 0) return byPercent;
      return b.realizadoCreditoCentavos - a.realizadoCreditoCentavos;
    });

    return ok(
      items.map((item, index) => ({
        ...item,
        posicao: index + 1,
      })),
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao carregar ranking.");
  }
}

export async function listarConquistas(): Promise<ActionResult<Conquista[]>> {
  try {
    await requireServerSessionUser();
    const snap = await db().collection(COLLECTIONS.conquistas).get();
    if (snap.empty) return ok(CONQUISTAS_SEED_WITH_IDS);
    return ok(snap.docs.map((doc) => toConquista(doc.id, doc.data() as ConquistaDoc)));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao listar conquistas.");
  }
}

export async function getMinhaMetaPeriodo(
  periodo: string,
  vendedorIdOverride?: string,
): Promise<
  ActionResult<{
    meta: Meta | null;
    realizacao: Realizacao | null;
    ranking: RankingPeriodoItem[];
    conquistas: Conquista[];
  }>
> {
  try {
    const user = await requireServerSessionUser();
    if (!isPeriodoValido(periodo)) return fail("Período inválido.");

    let vendedorId = vendedorIdOverride;
    if (!vendedorId) {
      if (user.role === "vendedor") {
        vendedorId = (await resolveVendedorIdForUser(user.uid, user.email)) ?? undefined;
      }
    }

    if (!vendedorId) {
      return ok({ meta: null, realizacao: null, ranking: [], conquistas: [] });
    }

    const [metasResult, rankingResult, conquistasResult] = await Promise.all([
      listarMetas({ periodo, tipo: "VENDEDOR", referenciaId: vendedorId }),
      getRankingPeriodo(periodo, "VENDEDOR"),
      listarConquistas(),
    ]);

    if (!metasResult.success) return fail(metasResult.error);
    if (!rankingResult.success) return fail(rankingResult.error);
    if (!conquistasResult.success) return fail(conquistasResult.error);

    const meta = metasResult.data[0] ?? null;
    let realizacao: Realizacao | null = null;

    if (meta) {
      const realizacaoId = buildRealizacaoId("VENDEDOR", vendedorId, periodo);
      const snap = await db().collection(COLLECTIONS.realizacoes).doc(realizacaoId).get();
      if (snap.exists) {
        realizacao = toRealizacao(snap.id, snap.data() as RealizacaoDoc);
      }
    }

    return ok({
      meta,
      realizacao,
      ranking: rankingResult.data,
      conquistas: conquistasResult.data,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao carregar metas.");
  }
}

export async function seedConquistas(): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const batch = db().batch();
    for (const conquista of CONQUISTAS_SEED_WITH_IDS) {
      const ref = db().collection(COLLECTIONS.conquistas).doc(conquista.id);
      batch.set(ref, conquista, { merge: true });
    }
    await batch.commit();
    return ok(undefined);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao criar conquistas.");
  }
}

export async function getMetasDashboardWidgetData(): Promise<
  ActionResult<{
    periodo: string;
    role: "admin" | "gerente" | "vendedor";
    minhaMeta: Meta | null;
    minhaRealizacao: Realizacao | null;
    rankingTop: RankingPeriodoItem[];
    conquistas: Conquista[];
  }>
> {
  try {
    const user = await requireServerSessionUser();
    const periodo = periodoAtual();
    const [rankingResult, conquistasResult] = await Promise.all([
      getRankingPeriodo(periodo, "VENDEDOR"),
      listarConquistas(),
    ]);

    if (!rankingResult.success) return fail(rankingResult.error);
    if (!conquistasResult.success) return fail(conquistasResult.error);

    let minhaMeta: Meta | null = null;
    let minhaRealizacao: Realizacao | null = null;

    if (user.role === "vendedor") {
      const minha = await getMinhaMetaPeriodo(periodo);
      if (minha.success) {
        minhaMeta = minha.data.meta;
        minhaRealizacao = minha.data.realizacao;
      }
    }

    return ok({
      periodo,
      role: user.role,
      minhaMeta,
      minhaRealizacao,
      rankingTop: rankingResult.data.slice(0, 3),
      conquistas: conquistasResult.data,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao carregar widget.");
  }
}
