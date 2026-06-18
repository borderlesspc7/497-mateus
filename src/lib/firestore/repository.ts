import { getAdminFirestore } from "@/lib/firebase/admin";
import { handleFirestoreIndexError } from "@/lib/firestore/firestore-errors";
import {
  buildDashboardRanking,
  getCurrentMonthBounds,
  isIsoInRange,
  vendaRankingReferenceDate,
} from "@/lib/dashboard/ranking";
import { buildDashboardStats } from "@/lib/dashboard/stats";
import { DEFAULT_CHECKLIST_ATIVACAO, DEFAULT_STATUS_POS_VENDA } from "@/lib/vendas/pos-venda";
import { withNumeroContratoFields, normalizeNumeroContrato } from "@/lib/firestore/contrato-matriz";
import {
  normalizeVendaFields,
  resolveDataContrato,
  STATUS_OPERACIONAL_FIELD,
  STATUS_OPERACIONAL_LEGACY_FIELD,
  withStatusOperacionalFields,
} from "@/lib/firestore/legacy";
import { resolvePlanoRegrasFinanceiras } from "@/lib/planos/regras-financeiras";
import {
  COLLECTIONS,
  newId,
  nowIso,
  sortByCreatedAtDesc,
  sortByCriadoEmDesc,
  type AdministradoraDoc,
  type ConsorciadoDoc,
  type DocWithId,
  type EquipeDoc,
  type ExtratoDoc,
  type ExtratoStatus,
  type PlanoDoc,
  type VendaDoc,
  type VendedorDoc,
} from "@/lib/firestore/types";
import {
  calcularParcelasComissao,
  extratoDeveSerEstornado,
  extratoDocId,
  resolverCreditoCentavos,
  vendaGeraExtratosComissao,
} from "@/utils/financeiro";
import {
  toAdministradoraRow,
  toConsorciadoMini,
  toConsorciadoRow,
  toEquipeMini,
  toEquipeRow,
  toPlanoMini,
  toPlanoRow,
  toVendaRow,
  toVendedorMini,
  toVendedorRow,
} from "@/lib/mappers";
import type {
  AdministradoraRow,
  ChecklistAtivacao,
  ConsorciadoMini,
  ConsorciadoRow,
  EquipeMini,
  EquipeRow,
  ExtratoRow,
  PlanoMini,
  PlanoRow,
  StatusInconsistencia,
  VendaRow,
  StatusOperacionalCota,
  VendedorMini,
  VendedorRow,
} from "@/lib/types/domain";

function db() {
  return getAdminFirestore();
}

async function getAdministradoraDoc(id: string): Promise<DocWithId<AdministradoraDoc> | null> {
  const snap = await db().collection(COLLECTIONS.administradoras).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as AdministradoraDoc) };
}

async function getPlanoDoc(id: string): Promise<DocWithId<PlanoDoc> | null> {
  const snap = await db().collection(COLLECTIONS.planos).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as PlanoDoc) };
}

async function listAdministradoraDocs(): Promise<DocWithId<AdministradoraDoc>[]> {
  const snap = await db().collection(COLLECTIONS.administradoras).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as AdministradoraDoc) }));
}

async function listPlanoDocs(): Promise<DocWithId<PlanoDoc>[]> {
  const snap = await db().collection(COLLECTIONS.planos).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as PlanoDoc) }));
}

async function getConsorciadoDoc(id: string): Promise<DocWithId<ConsorciadoDoc> | null> {
  const snap = await db().collection(COLLECTIONS.consorciados).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as ConsorciadoDoc) };
}

async function listConsorciadoDocs(): Promise<DocWithId<ConsorciadoDoc>[]> {
  const snap = await db().collection(COLLECTIONS.consorciados).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as ConsorciadoDoc) }));
}

async function getEquipeDoc(id: string): Promise<DocWithId<EquipeDoc> | null> {
  const snap = await db().collection(COLLECTIONS.equipes).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as EquipeDoc) };
}

async function listEquipeDocs(): Promise<DocWithId<EquipeDoc>[]> {
  const snap = await db().collection(COLLECTIONS.equipes).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as EquipeDoc) }));
}

async function getVendedorDoc(id: string): Promise<DocWithId<VendedorDoc> | null> {
  const snap = await db().collection(COLLECTIONS.vendedores).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as VendedorDoc) };
}

async function listVendedorDocs(): Promise<DocWithId<VendedorDoc>[]> {
  const snap = await db().collection(COLLECTIONS.vendedores).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as VendedorDoc) }));
}

function resolveVendaRelations(
  v: DocWithId<VendaDoc>,
  maps: {
    admMap: Map<string, DocWithId<AdministradoraDoc>>;
    planoMap: Map<string, DocWithId<PlanoDoc>>;
    consorciadoMap: Map<string, DocWithId<ConsorciadoDoc>>;
    equipeMap: Map<string, DocWithId<EquipeDoc>>;
    vendedorMap: Map<string, DocWithId<VendedorDoc>>;
  },
): VendaRow | null {
  const adm = maps.admMap.get(v.administradoraId);
  if (!adm) return null;
  const plano = v.planoId ? (maps.planoMap.get(v.planoId) ?? null) : null;
  const consorciado = v.consorciadoId ? (maps.consorciadoMap.get(v.consorciadoId) ?? null) : null;
  const equipe = v.equipeId ? (maps.equipeMap.get(v.equipeId) ?? null) : null;
  const vendedor = v.vendedorId ? (maps.vendedorMap.get(v.vendedorId) ?? null) : null;
  return toVendaRow(v, adm, plano, consorciado, equipe, vendedor);
}

async function listVendaDocs(): Promise<DocWithId<VendaDoc>[]> {
  const snap = await db().collection(COLLECTIONS.vendas).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as VendaDoc) }));
}

export async function findAdministradoraByCnpj(
  cnpjDigits: string,
  excludeId?: string,
): Promise<DocWithId<AdministradoraDoc> | null> {
  const snap = await db()
    .collection(COLLECTIONS.administradoras)
    .where("cnpj", "==", cnpjDigits)
    .limit(1)
    .get();
  const doc = snap.docs[0];
  if (!doc) return null;
  if (excludeId && doc.id === excludeId) return null;
  return { id: doc.id, ...(doc.data() as AdministradoraDoc) };
}

export async function countPlanosByAdministradora(administradoraId: string): Promise<number> {
  const snap = await db()
    .collection(COLLECTIONS.planos)
    .where("administradoraId", "==", administradoraId)
    .get();
  return snap.size;
}

export async function countVendasByAdministradora(administradoraId: string): Promise<number> {
  const snap = await db()
    .collection(COLLECTIONS.vendas)
    .where("administradoraId", "==", administradoraId)
    .get();
  return snap.size;
}

export async function countVendasByPlano(planoId: string): Promise<number> {
  const snap = await db().collection(COLLECTIONS.vendas).where("planoId", "==", planoId).get();
  return snap.size;
}

export async function listAdministradoras(): Promise<AdministradoraRow[]> {
  const rows = sortByCreatedAtDesc(await listAdministradoraDocs());
  return rows.map(toAdministradoraRow);
}

export async function getAdministradora(id: string): Promise<AdministradoraRow | null> {
  const doc = await getAdministradoraDoc(id);
  return doc ? toAdministradoraRow(doc) : null;
}

export async function createAdministradora(
  data: Omit<AdministradoraDoc, "createdAt" | "updatedAt">,
): Promise<AdministradoraRow> {
  const ts = nowIso();
  const id = newId();
  const doc: AdministradoraDoc = { ...data, createdAt: ts, updatedAt: ts };
  await db().collection(COLLECTIONS.administradoras).doc(id).set(doc);
  return toAdministradoraRow({ id, ...doc });
}

export async function updateAdministradora(
  id: string,
  patch: Partial<Omit<AdministradoraDoc, "createdAt" | "updatedAt">>,
): Promise<AdministradoraRow> {
  const current = await getAdministradoraDoc(id);
  if (!current) throw new Error("Administradora não encontrada.");
  const { id: _id, ...currentData } = current;
  const next: AdministradoraDoc = {
    ...currentData,
    ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)),
    createdAt: current.createdAt,
    updatedAt: nowIso(),
  };
  await db().collection(COLLECTIONS.administradoras).doc(id).set(next);
  return toAdministradoraRow({ id, ...next });
}

export async function deleteAdministradora(id: string): Promise<void> {
  await db().collection(COLLECTIONS.administradoras).doc(id).delete();
}

export async function listPlanos(): Promise<PlanoRow[]> {
  const [planos, administradoras] = await Promise.all([listPlanoDocs(), listAdministradoraDocs()]);
  const admMap = new Map(administradoras.map((a) => [a.id, a]));
  const rows = sortByCreatedAtDesc(planos)
    .map((p) => {
      const adm = admMap.get(p.administradoraId);
      if (!adm) return null;
      return toPlanoRow(p, adm);
    })
    .filter((x): x is PlanoRow => x !== null);
  return rows;
}

export async function listPlanosMiniByAdministradora(
  administradoraId: string,
): Promise<PlanoMini[]> {
  const snap = await db()
    .collection(COLLECTIONS.planos)
    .where("administradoraId", "==", administradoraId)
    .get();
  return snap.docs
    .map((doc) => toPlanoMini({ id: doc.id, ...(doc.data() as PlanoDoc) }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function getPlano(id: string): Promise<PlanoRow | null> {
  const plano = await getPlanoDoc(id);
  if (!plano) return null;
  const adm = await getAdministradoraDoc(plano.administradoraId);
  if (!adm) return null;
  return toPlanoRow(plano, adm);
}

export async function createPlano(
  data: Omit<PlanoDoc, "createdAt" | "updatedAt">,
): Promise<PlanoRow> {
  const adm = await getAdministradoraDoc(data.administradoraId);
  if (!adm) throw new Error("Administradora não encontrada.");
  const ts = nowIso();
  const id = newId();
  const doc: PlanoDoc = {
    ...data,
    regrasComissaoJson: null,
    regrasRecebimentoJson: null,
    regrasEstornoJson: null,
    createdAt: ts,
    updatedAt: ts,
  };
  await db().collection(COLLECTIONS.planos).doc(id).set(doc);
  return toPlanoRow({ id, ...doc }, adm);
}

export async function updatePlano(
  id: string,
  patch: Partial<Omit<PlanoDoc, "createdAt" | "updatedAt">>,
): Promise<PlanoRow> {
  const current = await getPlanoDoc(id);
  if (!current) throw new Error("Plano não encontrado.");
  const nextAdmId = patch.administradoraId ?? current.administradoraId;
  const adm = await getAdministradoraDoc(nextAdmId);
  if (!adm) throw new Error("Administradora não encontrada.");
  const { id: _id, ...currentData } = current;
  const next: PlanoDoc = {
    ...currentData,
    ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)),
    regrasComissaoJson: null,
    regrasRecebimentoJson: null,
    regrasEstornoJson: null,
    createdAt: current.createdAt,
    updatedAt: nowIso(),
  };
  await db().collection(COLLECTIONS.planos).doc(id).set(next);
  return toPlanoRow({ id, ...next }, adm);
}

export async function deletePlano(id: string): Promise<void> {
  await db().collection(COLLECTIONS.planos).doc(id).delete();
}

export async function listConsorciados(): Promise<ConsorciadoRow[]> {
  const rows = sortByCriadoEmDesc(await listConsorciadoDocs());
  return rows.map(toConsorciadoRow);
}

export async function listConsorciadosMini(): Promise<ConsorciadoMini[]> {
  const rows = sortByCriadoEmDesc(await listConsorciadoDocs());
  return rows.map(toConsorciadoMini);
}

function normalizeConsorciadoSearchDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Busca consorciados por nome ou CPF/CNPJ (consulta Firestore + filtro em memória). */
export async function searchConsorciadosMini(
  query: string,
  limit = 12,
): Promise<ConsorciadoMini[]> {
  const rows = sortByCriadoEmDesc(await listConsorciadoDocs());
  const all = rows.map(toConsorciadoMini);
  const q = query.trim().toLowerCase();
  const qDigits = normalizeConsorciadoSearchDigits(query);

  if (!q && !qDigits) return all.slice(0, limit);

  return all
    .filter((item) => {
      const hay = `${item.nome} ${item.cpf_cnpj}`.toLowerCase();
      if (q && hay.includes(q)) return true;
      if (qDigits) {
        const docDigits = normalizeConsorciadoSearchDigits(item.cpf_cnpj);
        return docDigits.includes(qDigits);
      }
      return false;
    })
    .slice(0, limit);
}

/** Verifica duplicidade de CPF/CNPJ antes de criar consorciado na nova venda. */
export async function findConsorciadoMiniByCpfCnpj(
  cpfCnpj: string,
): Promise<ConsorciadoMini | null> {
  const digits = normalizeConsorciadoSearchDigits(cpfCnpj);
  if (!digits) return null;
  const rows = await listConsorciadoDocs();
  for (const doc of rows) {
    const mini = toConsorciadoMini(doc);
    if (normalizeConsorciadoSearchDigits(mini.cpf_cnpj) === digits) return mini;
  }
  return null;
}

export async function getConsorciado(id: string): Promise<ConsorciadoRow | null> {
  const doc = await getConsorciadoDoc(id);
  return doc ? toConsorciadoRow(doc) : null;
}

export async function listEquipes(): Promise<EquipeRow[]> {
  return sortByCreatedAtDesc(await listEquipeDocs()).map(toEquipeRow);
}

export async function listEquipesMini(): Promise<EquipeMini[]> {
  return sortByCreatedAtDesc(await listEquipeDocs()).map(toEquipeMini);
}

export async function getEquipe(id: string): Promise<EquipeRow | null> {
  const doc = await getEquipeDoc(id);
  return doc ? toEquipeRow(doc) : null;
}

export async function createEquipe(
  data: Omit<EquipeDoc, "createdAt" | "updatedAt">,
): Promise<EquipeRow> {
  const ts = nowIso();
  const id = newId();
  const doc: EquipeDoc = { ...data, createdAt: ts, updatedAt: ts };
  await db().collection(COLLECTIONS.equipes).doc(id).set(doc);
  return toEquipeRow({ id, ...doc });
}

export async function updateEquipe(
  id: string,
  patch: Partial<Omit<EquipeDoc, "createdAt" | "updatedAt">>,
): Promise<EquipeRow> {
  const current = await getEquipeDoc(id);
  if (!current) throw new Error("Equipe não encontrada.");
  const { id: _id, ...currentData } = current;
  const next: EquipeDoc = {
    ...currentData,
    ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)),
    createdAt: current.createdAt,
    updatedAt: nowIso(),
  };
  await db().collection(COLLECTIONS.equipes).doc(id).set(next);
  return toEquipeRow({ id, ...next });
}

export async function countVendedoresByEquipe(equipeId: string): Promise<number> {
  const snap = await db()
    .collection(COLLECTIONS.vendedores)
    .where("equipeId", "==", equipeId)
    .get();
  return snap.size;
}

export async function countVendasByEquipe(equipeId: string): Promise<number> {
  const snap = await db().collection(COLLECTIONS.vendas).where("equipeId", "==", equipeId).get();
  return snap.size;
}

export async function deleteEquipe(id: string): Promise<void> {
  const nVendedores = await countVendedoresByEquipe(id);
  if (nVendedores > 0) {
    throw new Error("Não é possível excluir: existem vendedores vinculados a esta equipe.");
  }
  const nVendas = await countVendasByEquipe(id);
  if (nVendas > 0) {
    throw new Error("Não é possível excluir: existem vendas vinculadas a esta equipe.");
  }
  await db().collection(COLLECTIONS.equipes).doc(id).delete();
}

export async function listVendedores(): Promise<VendedorRow[]> {
  const [vendedores, equipes] = await Promise.all([listVendedorDocs(), listEquipeDocs()]);
  const equipeMap = new Map(equipes.map((e) => [e.id, e]));
  return sortByCreatedAtDesc(vendedores)
    .map((v) => {
      const equipe = equipeMap.get(v.equipeId);
      if (!equipe) return null;
      return toVendedorRow(v, equipe);
    })
    .filter((x): x is VendedorRow => x !== null);
}

export async function listVendedoresMini(): Promise<VendedorMini[]> {
  return sortByCreatedAtDesc(await listVendedorDocs()).map(toVendedorMini);
}

export async function listVendedoresMiniByEquipe(equipeId: string): Promise<VendedorMini[]> {
  const snap = await db()
    .collection(COLLECTIONS.vendedores)
    .where("equipeId", "==", equipeId)
    .get();
  return snap.docs
    .map((doc) => toVendedorMini({ id: doc.id, ...(doc.data() as VendedorDoc) }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function getVendedor(id: string): Promise<VendedorRow | null> {
  const vendedor = await getVendedorDoc(id);
  if (!vendedor) return null;
  const equipe = await getEquipeDoc(vendedor.equipeId);
  if (!equipe) return null;
  return toVendedorRow(vendedor, equipe);
}

export async function createVendedor(
  data: Omit<VendedorDoc, "createdAt" | "updatedAt">,
): Promise<VendedorRow> {
  const equipe = await getEquipeDoc(data.equipeId);
  if (!equipe) throw new Error("Equipe não encontrada.");
  const ts = nowIso();
  const id = newId();
  const doc: VendedorDoc = { ...data, createdAt: ts, updatedAt: ts };
  await db().collection(COLLECTIONS.vendedores).doc(id).set(doc);
  return toVendedorRow({ id, ...doc }, equipe);
}

export async function updateVendedor(
  id: string,
  patch: Partial<Omit<VendedorDoc, "createdAt" | "updatedAt">>,
): Promise<VendedorRow> {
  const current = await getVendedorDoc(id);
  if (!current) throw new Error("Vendedor não encontrado.");
  const nextEquipeId = patch.equipeId ?? current.equipeId;
  const equipe = await getEquipeDoc(nextEquipeId);
  if (!equipe) throw new Error("Equipe não encontrada.");
  const { id: _id, ...currentData } = current;
  const next: VendedorDoc = {
    ...currentData,
    ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)),
    createdAt: current.createdAt,
    updatedAt: nowIso(),
  };
  await db().collection(COLLECTIONS.vendedores).doc(id).set(next);
  return toVendedorRow({ id, ...next }, equipe);
}

export async function countVendasByVendedor(vendedorId: string): Promise<number> {
  const snap = await db()
    .collection(COLLECTIONS.vendas)
    .where("vendedorId", "==", vendedorId)
    .get();
  return snap.size;
}

export async function deleteVendedor(id: string): Promise<void> {
  const nVendas = await countVendasByVendedor(id);
  if (nVendas > 0) {
    throw new Error("Não é possível excluir: existem vendas vinculadas a este vendedor.");
  }
  await db().collection(COLLECTIONS.vendedores).doc(id).delete();
}

export async function listVendasByConsorciado(consorciadoId: string): Promise<VendaRow[]> {
  const snap = await db()
    .collection(COLLECTIONS.vendas)
    .where("consorciadoId", "==", consorciadoId)
    .get();
  const vendas = snap.docs.map((item) =>
    normalizeVendaDoc({ id: item.id, ...(item.data() as VendaDoc) }),
  );
  if (vendas.length === 0) return [];

  const [administradoras, planos, equipes, vendedores] = await Promise.all([
    listAdministradoraDocs(),
    listPlanoDocs(),
    listEquipeDocs(),
    listVendedorDocs(),
  ]);
  const maps = {
    admMap: new Map(administradoras.map((a) => [a.id, a])),
    planoMap: new Map(planos.map((p) => [p.id, p])),
    consorciadoMap: new Map(
      (await listConsorciadoDocs()).map((c) => [c.id, c] as const),
    ),
    equipeMap: new Map(equipes.map((e) => [e.id, e])),
    vendedorMap: new Map(vendedores.map((v) => [v.id, v])),
  };

  return sortByCreatedAtDesc(vendas)
    .map((v) => resolveVendaRelations(v, maps))
    .filter((x): x is VendaRow => x !== null);
}

function normalizeVendaDoc(raw: DocWithId<VendaDoc>): DocWithId<VendaDoc> {
  const fields = normalizeVendaFields(raw);
  return {
    ...raw,
    ...fields,
    dataContrato: fields.dataContrato,
    consorciadoId: raw.consorciadoId ?? null,
    checklistAtivacao: {
      documentacaoRecebida: raw.checklistAtivacao?.documentacaoRecebida ?? false,
      taxaPaga: raw.checklistAtivacao?.taxaPaga ?? false,
      contratoAssinado: raw.checklistAtivacao?.contratoAssinado ?? false,
    },
    dataPendencia: raw.dataPendencia ?? null,
    alertaAtivo: raw.alertaAtivo ?? false,
    statusPosVenda: fields.statusPosVenda,
    parcelasPagasCancelamento: fields.parcelasPagasCancelamento,
    mesAnoFechamento: raw.mesAnoFechamento ?? null,
  };
}

function withVendaPosVendaDefaults(data: VendaCreateInput): Omit<VendaDoc, "createdAt" | "updatedAt" | "dataContrato"> {
  return {
    ...data,
    statusInconsistencia: data.statusInconsistencia ?? "CONSISTENTE",
    statusPosVenda: data.statusPosVenda ?? DEFAULT_STATUS_POS_VENDA,
    parcelasPagasCancelamento: data.parcelasPagasCancelamento ?? null,
    checklistAtivacao: data.checklistAtivacao ?? DEFAULT_CHECKLIST_ATIVACAO,
    dataPendencia: data.dataPendencia ?? null,
    alertaAtivo: data.alertaAtivo ?? false,
  };
}

export const VENDAS_PAGE_SIZE = 50;

export type VendasListFilters = {
  statusOperacional?: StatusOperacionalCota;
  statusInconsistencia?: StatusInconsistencia;
  administradoraId?: string;
};

export type VendasListPage = {
  items: VendaRow[];
  lastDocId: string | null;
  hasMore: boolean;
};

async function fetchDocsByIds<T>(
  collectionName: string,
  ids: string[],
): Promise<Map<string, DocWithId<T>>> {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, DocWithId<T>>();
  if (uniqueIds.length === 0) return map;

  const snaps = await Promise.all(
    uniqueIds.map((id) => db().collection(collectionName).doc(id).get()),
  );
  for (const snap of snaps) {
    if (snap.exists) {
      map.set(snap.id, { id: snap.id, ...(snap.data() as T) });
    }
  }
  return map;
}

async function buildRelationMapsForVendas(vendas: DocWithId<VendaDoc>[]) {
  const [admMap, planoMap, consorciadoMap, equipeMap, vendedorMap] = await Promise.all([
    fetchDocsByIds<AdministradoraDoc>(
      COLLECTIONS.administradoras,
      vendas.map((v) => v.administradoraId),
    ),
    fetchDocsByIds<PlanoDoc>(
      COLLECTIONS.planos,
      vendas.map((v) => v.planoId).filter((id): id is string => Boolean(id)),
    ),
    fetchDocsByIds<ConsorciadoDoc>(
      COLLECTIONS.consorciados,
      vendas.map((v) => v.consorciadoId).filter((id): id is string => Boolean(id)),
    ),
    fetchDocsByIds<EquipeDoc>(COLLECTIONS.equipes, vendas.map((v) => v.equipeId)),
    fetchDocsByIds<VendedorDoc>(COLLECTIONS.vendedores, vendas.map((v) => v.vendedorId)),
  ]);
  return { admMap, planoMap, consorciadoMap, equipeMap, vendedorMap };
}

function buildVendasPaginatedQuery(filters: VendasListFilters) {
  let q: FirebaseFirestore.Query = db().collection(COLLECTIONS.vendas);

  if (filters.administradoraId) {
    q = q.where("administradoraId", "==", filters.administradoraId);
  }
  if (filters.statusOperacional) {
    q = q.where(STATUS_OPERACIONAL_FIELD, "==", filters.statusOperacional);
  }
  if (filters.statusInconsistencia) {
    q = q.where("statusInconsistencia", "==", filters.statusInconsistencia);
  }

  return q.orderBy("dataContrato", "desc").limit(VENDAS_PAGE_SIZE);
}

export async function resolveVendaIdByNumeroContrato(
  numeroContrato: string,
  excludeId?: string,
): Promise<string | null> {
  return findVendaDocIdByNumeroContrato(numeroContrato, excludeId);
}

async function findVendaDocIdByNumeroContrato(
  numeroContrato: string,
  excludeId?: string,
): Promise<string | null> {
  const normalized = normalizeNumeroContrato(numeroContrato);
  if (!normalized) return null;

  for (const field of ["numeroContrato", "contrato"] as const) {
    const snap = await db()
      .collection(COLLECTIONS.vendas)
      .where(field, "==", normalized)
      .limit(2)
      .get();

    for (const doc of snap.docs) {
      if (excludeId && doc.id === excludeId) continue;
      return doc.id;
    }
  }

  return null;
}

async function assertNumeroContratoDisponivel(
  numeroContrato: string,
  excludeId?: string,
): Promise<void> {
  const existingId = await findVendaDocIdByNumeroContrato(numeroContrato, excludeId);
  if (existingId) {
    throw new Error(
      `Já existe uma venda com o contrato ${normalizeNumeroContrato(numeroContrato)}.`,
    );
  }
}

export async function listVendasPaginated(
  filters: VendasListFilters = {},
  cursorDocId?: string | null,
): Promise<VendasListPage> {
  try {
    let q = buildVendasPaginatedQuery(filters);

    if (cursorDocId) {
      const cursorSnap = await db().collection(COLLECTIONS.vendas).doc(cursorDocId).get();
      if (cursorSnap.exists) {
        q = q.startAfter(cursorSnap);
      }
    }

    const snap = await q.get();
    const vendas = snap.docs.map((doc) =>
      normalizeVendaDoc({ id: doc.id, ...(doc.data() as VendaDoc) }),
    );

    if (vendas.length === 0) {
      return { items: [], lastDocId: null, hasMore: false };
    }

    const maps = await buildRelationMapsForVendas(vendas);
    const items = vendas
      .map((v) => resolveVendaRelations(v, maps))
      .filter((x): x is VendaRow => x !== null);

    const lastDoc = snap.docs[snap.docs.length - 1];
    return {
      items,
      lastDocId: lastDoc?.id ?? null,
      hasMore: snap.docs.length === VENDAS_PAGE_SIZE,
    };
  } catch (error) {
    handleFirestoreIndexError(error);
  }
}

export async function listVendas(): Promise<VendaRow[]> {
  const [vendas, administradoras, planos, consorciados, equipes, vendedores] =
    await Promise.all([
      listVendaDocs(),
      listAdministradoraDocs(),
      listPlanoDocs(),
      listConsorciadoDocs(),
      listEquipeDocs(),
      listVendedorDocs(),
    ]);
  const maps = {
    admMap: new Map(administradoras.map((a) => [a.id, a])),
    planoMap: new Map(planos.map((p) => [p.id, p])),
    consorciadoMap: new Map(consorciados.map((c) => [c.id, c])),
    equipeMap: new Map(equipes.map((e) => [e.id, e])),
    vendedorMap: new Map(vendedores.map((v) => [v.id, v])),
  };

  return sortByCreatedAtDesc(vendas)
    .map((raw) => resolveVendaRelations(normalizeVendaDoc(raw), maps))
    .filter((x): x is VendaRow => x !== null);
}

const POS_VENDA_RECENT_DAYS = 30;

function isVendaRecentForPosVenda(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  const cutoff = Date.now() - POS_VENDA_RECENT_DAYS * 24 * 60 * 60 * 1000;
  return created >= cutoff;
}

export async function listVendasPosVendaControle(): Promise<VendaRow[]> {
  const all = await listVendas();
  return all.filter(
    (v) => v.statusPosVenda === "PENDENTE" || isVendaRecentForPosVenda(v.createdAt),
  );
}

export async function getVendaByNumeroContrato(numeroContrato: string): Promise<VendaRow | null> {
  const vendaId = await findVendaDocIdByNumeroContrato(numeroContrato);
  if (!vendaId) return null;
  return getVenda(vendaId);
}

export async function getVenda(id: string): Promise<VendaRow | null> {
  const snap = await db().collection(COLLECTIONS.vendas).doc(id).get();
  if (!snap.exists) return null;
  const venda = normalizeVendaDoc({ id: snap.id, ...(snap.data() as VendaDoc) });
  const adm = await getAdministradoraDoc(venda.administradoraId);
  if (!adm) return null;
  const plano = venda.planoId ? await getPlanoDoc(venda.planoId) : null;
  const consorciado = venda.consorciadoId ? await getConsorciadoDoc(venda.consorciadoId) : null;
  const equipe = venda.equipeId ? await getEquipeDoc(venda.equipeId) : null;
  const vendedor = venda.vendedorId ? await getVendedorDoc(venda.vendedorId) : null;
  return toVendaRow(venda, adm, plano, consorciado, equipe, vendedor);
}

export type VendaCreateInput = Omit<
  VendaDoc,
  | "createdAt"
  | "updatedAt"
  | "dataContrato"
  | "checklistAtivacao"
  | "dataPendencia"
  | "alertaAtivo"
  | "statusPosVenda"
  | "parcelasPagasCancelamento"
> & {
  checklistAtivacao?: ChecklistAtivacao;
  dataPendencia?: string | null;
  alertaAtivo?: boolean;
  statusPosVenda?: VendaDoc["statusPosVenda"];
  parcelasPagasCancelamento?: number | null;
};

export async function createVenda(
  data: VendaCreateInput,
): Promise<VendaRow> {
  const adm = await getAdministradoraDoc(data.administradoraId);
  if (!adm) throw new Error("Administradora não encontrada.");
  let plano: DocWithId<PlanoDoc> | null = null;
  if (data.planoId) {
    plano = await getPlanoDoc(data.planoId);
    if (!plano) throw new Error("Plano não encontrado.");
    if (plano.administradoraId !== data.administradoraId) {
      throw new Error("O plano não pertence à administradora selecionada.");
    }
  }
  let consorciado: DocWithId<ConsorciadoDoc> | null = null;
  if (data.consorciadoId) {
    consorciado = await getConsorciadoDoc(data.consorciadoId);
    if (!consorciado) throw new Error("Consorciado não encontrado.");
  }
  const equipe = await getEquipeDoc(data.equipeId);
  if (!equipe) throw new Error("Equipe não encontrada.");
  const vendedor = await getVendedorDoc(data.vendedorId);
  if (!vendedor) throw new Error("Vendedor não encontrado.");
  if (vendedor.equipeId !== data.equipeId) {
    throw new Error("O vendedor não pertence à equipe selecionada.");
  }
  await assertNumeroContratoDisponivel(data.numeroContrato);
  const ts = nowIso();
  const id = newId();
  const dataContrato = resolveDataContrato({ dataVenda: data.dataVenda, createdAt: ts });
  const matriz = withNumeroContratoFields(data.numeroContrato);
  const statusFields = withStatusOperacionalFields(data.statusOperacional);
  const doc: VendaDoc = {
    ...withVendaPosVendaDefaults(data),
    ...matriz,
    ...statusFields,
    dataContrato,
    createdAt: ts,
    updatedAt: ts,
  };
  await db().collection(COLLECTIONS.vendas).doc(id).set(doc);
  await syncExtratosComissaoForVenda(id);
  return toVendaRow({ id, ...doc }, adm, plano, consorciado, equipe, vendedor);
}

export async function updateVenda(
  id: string,
  patch: Partial<Omit<VendaDoc, "createdAt" | "updatedAt">>,
): Promise<VendaRow> {
  const snap = await db().collection(COLLECTIONS.vendas).doc(id).get();
  if (!snap.exists) throw new Error("Venda não encontrada.");
  const current = normalizeVendaDoc({ id: snap.id, ...(snap.data() as VendaDoc) });
  const nextAdmId = patch.administradoraId ?? current.administradoraId;
  const nextPlanoId = patch.planoId !== undefined ? patch.planoId : current.planoId;
  const nextConsorciadoId =
    patch.consorciadoId !== undefined ? patch.consorciadoId : current.consorciadoId;
  const nextEquipeId = patch.equipeId ?? current.equipeId;
  const nextVendedorId = patch.vendedorId ?? current.vendedorId;

  const adm = await getAdministradoraDoc(nextAdmId);
  if (!adm) throw new Error("Administradora não encontrada.");

  let plano: DocWithId<PlanoDoc> | null = null;
  if (nextPlanoId) {
    plano = await getPlanoDoc(nextPlanoId);
    if (!plano) throw new Error("Plano não encontrado.");
    if (plano.administradoraId !== nextAdmId) {
      throw new Error("O plano não pertence à administradora selecionada.");
    }
  }

  let consorciado: DocWithId<ConsorciadoDoc> | null = null;
  if (nextConsorciadoId) {
    consorciado = await getConsorciadoDoc(nextConsorciadoId);
    if (!consorciado) throw new Error("Consorciado não encontrado.");
  }

  const equipe = await getEquipeDoc(nextEquipeId);
  if (!equipe) throw new Error("Equipe não encontrada.");
  const vendedor = await getVendedorDoc(nextVendedorId);
  if (!vendedor) throw new Error("Vendedor não encontrado.");
  if (vendedor.equipeId !== nextEquipeId) {
    throw new Error("O vendedor não pertence à equipe selecionada.");
  }

  const { id: _id, ...currentData } = current;
  const nextDataVenda =
    patch.dataVenda !== undefined ? patch.dataVenda : currentData.dataVenda;
  const patchEntries = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined),
  ) as Partial<VendaDoc>;
  const nextNumeroContrato = patch.numeroContrato ?? current.numeroContrato;
  const nextStatusOperacional = patch.statusOperacional ?? current.statusOperacional;
  if (patch.numeroContrato !== undefined) {
    await assertNumeroContratoDisponivel(nextNumeroContrato, id);
  }
  const next: VendaDoc = {
    ...currentData,
    ...patchEntries,
    ...withNumeroContratoFields(nextNumeroContrato),
    ...withStatusOperacionalFields(nextStatusOperacional),
    dataContrato: resolveDataContrato({
      dataVenda: nextDataVenda,
      createdAt: current.createdAt,
    }),
    createdAt: current.createdAt,
    updatedAt: nowIso(),
  };
  await db().collection(COLLECTIONS.vendas).doc(id).set(next);
  await syncExtratosComissaoForVenda(id);
  return toVendaRow({ id, ...next }, adm, plano, consorciado, equipe, vendedor);
}

export async function deleteVenda(id: string): Promise<void> {
  await db().collection(COLLECTIONS.vendas).doc(id).delete();
}

export async function getDashboardCounts(): Promise<{
  nAdministradoras: number;
  nPlanos: number;
  nVendas: number;
  nVendasAtivas: number;
}> {
  const stats = await getDashboardStats();
  return {
    nAdministradoras: stats.nAdministradoras,
    nPlanos: stats.nPlanos,
    nVendas: stats.nVendas,
    nVendasAtivas: stats.nVendasAtivas,
  };
}

export async function getDashboardStats(): Promise<import("@/lib/types/domain").DashboardStats> {
  const [vendas, administradoras, planos, consorciados, extratos] = await Promise.all([
    listVendas(),
    listAdministradoraDocs(),
    listPlanoDocs(),
    listConsorciadoDocs(),
    listExtratoDocs(),
  ]);
  return buildDashboardStats(
    vendas,
    consorciados.length,
    administradoras.length,
    planos.length,
    extratos,
  );
}

export async function listVendaDocsByStatusOperacional(
  statusOperacional: StatusOperacionalCota,
): Promise<DocWithId<VendaDoc>[]> {
  const [canonicalSnap, legacySnap] = await Promise.all([
    db()
      .collection(COLLECTIONS.vendas)
      .where(STATUS_OPERACIONAL_FIELD, "==", statusOperacional)
      .get(),
    db()
      .collection(COLLECTIONS.vendas)
      .where(STATUS_OPERACIONAL_LEGACY_FIELD, "==", statusOperacional)
      .get(),
  ]);

  const merged = new Map<string, DocWithId<VendaDoc>>();
  for (const doc of [...canonicalSnap.docs, ...legacySnap.docs]) {
    if (!merged.has(doc.id)) {
      merged.set(doc.id, { id: doc.id, ...(doc.data() as VendaDoc) });
    }
  }
  return [...merged.values()];
}

/**
 * Vendas ATIVO do mês corrente.
 * Consulta statusOperacional (canônico) e status (legado), restringe o mês em memória.
 */
async function listVendasAtivasNoMesAtual(): Promise<DocWithId<VendaDoc>[]> {
  const { start, end } = getCurrentMonthBounds();
  const vendas = await listVendaDocsByStatusOperacional("ATIVO");

  return vendas.filter((venda) =>
    isIsoInRange(vendaRankingReferenceDate(venda), start, end),
  );
}

export async function getDashboardRanking(): Promise<
  import("@/lib/types/domain").DashboardRanking
> {
  const [vendas, planos, vendedores, equipes] = await Promise.all([
    listVendasAtivasNoMesAtual(),
    listPlanoDocs(),
    listVendedorDocs(),
    listEquipeDocs(),
  ]);

  const planoMap = new Map(planos.map((p) => [p.id, p]));
  const vendedorNomes = new Map(
    vendedores.map((v) => [v.id, { nome: v.nome, equipeId: v.equipeId }]),
  );
  const equipeNomes = new Map(equipes.map((e) => [e.id, e.nome]));

  return buildDashboardRanking(vendas, { planoMap, vendedorNomes, equipeNomes });
}

async function listExtratoDocs(): Promise<DocWithId<ExtratoDoc>[]> {
  const snap = await db().collection(COLLECTIONS.extratos).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as ExtratoDoc) }));
}

async function listExtratoDocsByVendaId(vendaId: string): Promise<DocWithId<ExtratoDoc>[]> {
  const snap = await db()
    .collection(COLLECTIONS.extratos)
    .where("vendaId", "==", vendaId)
    .get();
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as ExtratoDoc) }));
}

/** Gera/atualiza/remove extratos de comissão de uma única venda. */
async function applyExtratosComissaoForVenda(
  venda: DocWithId<VendaDoc>,
  plano: DocWithId<PlanoDoc> | null,
  existingExtratos: DocWithId<ExtratoDoc>[],
  ts: string,
): Promise<number> {
  let changed = 0;
  const existingMap = new Map(existingExtratos.map((e) => [e.id, e]));
  const regras = plano ? resolvePlanoRegrasFinanceiras(plano) : null;

  if (
    vendaGeraExtratosComissao(venda.statusOperacional) &&
    venda.planoId &&
    plano &&
    regras
  ) {
    const creditoCentavos = resolverCreditoCentavos(
      venda.valorCentavos,
      plano.valorCreditoCentavos,
    );

    if (creditoCentavos !== null) {
      const parcelas = calcularParcelasComissao(creditoCentavos, regras);

      for (const parcela of parcelas) {
        const id = extratoDocId(venda.id, parcela.numero);
        const prev = existingMap.get(id);

        if (prev && prev.status !== "PENDENTE") continue;

        const doc: ExtratoDoc = {
          vendaId: venda.id,
          numeroContrato: venda.numeroContrato,
          planoId: plano.id,
          parcelaNumero: parcela.numero,
          parcelaTotal: regras.parcelasRecebimento,
          parcelaLabel: parcela.label,
          valorCentavos: parcela.valorCentavos,
          status: prev?.status ?? "PENDENTE",
          tipo: prev?.tipo ?? "COMISSAO",
          vendedorId: venda.vendedorId,
          equipeId: venda.equipeId,
          createdAt: prev?.createdAt ?? ts,
          updatedAt: ts,
        };

        const docChanged =
          !prev ||
          prev.valorCentavos !== doc.valorCentavos ||
          prev.parcelaTotal !== doc.parcelaTotal ||
          prev.vendedorId !== doc.vendedorId ||
          prev.equipeId !== doc.equipeId ||
          prev.numeroContrato !== doc.numeroContrato ||
          prev.planoId !== doc.planoId;

        if (docChanged) {
          await db().collection(COLLECTIONS.extratos).doc(id).set(doc);
          changed += 1;
        }
      }
    }
  }

  const dataReferencia = venda.dataVenda ?? venda.updatedAt;

  for (const extrato of existingExtratos) {
    if ((extrato.tipo ?? "COMISSAO") === "ESTORNO") continue;

    const deveEstornar =
      !vendaGeraExtratosComissao(venda.statusOperacional) &&
      regras &&
      extratoDeveSerEstornado(
        venda.statusOperacional,
        dataReferencia,
        regras.diasParaEstorno,
        extrato.status,
      );

    if (deveEstornar) {
      await db().collection(COLLECTIONS.extratos).doc(extrato.id).delete();
      changed += 1;
    }
  }

  return changed;
}

/** Sincroniza extratos de comissão apenas da venda informada (uso em create/update). */
export async function syncExtratosComissaoForVenda(vendaId: string): Promise<number> {
  const vendaSnap = await db().collection(COLLECTIONS.vendas).doc(vendaId).get();
  if (!vendaSnap.exists) return 0;

  const venda = normalizeVendaDoc({ id: vendaSnap.id, ...(vendaSnap.data() as VendaDoc) });
  const plano = venda.planoId ? await getPlanoDoc(venda.planoId) : null;
  const existing = await listExtratoDocsByVendaId(vendaId);
  return applyExtratosComissaoForVenda(venda, plano, existing, nowIso());
}

export async function syncExtratosComissao(): Promise<number> {
  const [vendas, planos] = await Promise.all([listVendaDocs(), listPlanoDocs()]);
  const planoMap = new Map(planos.map((p) => [p.id, p]));
  const existing = await listExtratoDocs();
  const extratosByVenda = new Map<string, DocWithId<ExtratoDoc>[]>();
  for (const extrato of existing) {
    const list = extratosByVenda.get(extrato.vendaId) ?? [];
    list.push(extrato);
    extratosByVenda.set(extrato.vendaId, list);
  }
  const ts = nowIso();
  let changed = 0;

  for (const raw of vendas) {
    const venda = normalizeVendaDoc(raw);
    const plano = venda.planoId ? (planoMap.get(venda.planoId) ?? null) : null;
    changed += await applyExtratosComissaoForVenda(
      venda,
      plano,
      extratosByVenda.get(venda.id) ?? [],
      ts,
    );
  }

  const vendaIds = new Set(vendas.map((v) => v.id));
  for (const extrato of existing) {
    if ((extrato.tipo ?? "COMISSAO") === "ESTORNO") continue;
    if (vendaIds.has(extrato.vendaId)) continue;
    await db().collection(COLLECTIONS.extratos).doc(extrato.id).delete();
    changed += 1;
  }

  return changed;
}

export async function listExtratosComissao(): Promise<ExtratoRow[]> {
  const [extratos, vendas, planos] = await Promise.all([
    listExtratoDocs(),
    listVendas(),
    listPlanoDocs(),
  ]);

  const vendaMap = new Map(vendas.map((v) => [v.id, v]));
  const planoMap = new Map(planos.map((p) => [p.id, p]));

  const rows: ExtratoRow[] = [];

  for (const extrato of sortByCreatedAtDesc(extratos)) {
    const venda = vendaMap.get(extrato.vendaId);
    const plano = planoMap.get(extrato.planoId);
    if (!venda || !plano) continue;

    const regras = resolvePlanoRegrasFinanceiras(plano);
    if (!regras) continue;

    const creditoCentavos = resolverCreditoCentavos(
      venda.valorCentavos,
      plano.valorCreditoCentavos,
    );
    if (creditoCentavos === null) continue;

    rows.push({
      id: extrato.id,
      vendaId: extrato.vendaId,
      planoId: extrato.planoId,
      parcelaNumero: extrato.parcelaNumero,
      parcelaTotal: extrato.parcelaTotal,
      parcelaLabel: extrato.parcelaLabel,
      valorCentavos: extrato.valorCentavos,
      status: extrato.status,
      tipo: extrato.tipo ?? "COMISSAO",
      vendedorId: extrato.vendedorId,
      equipeId: extrato.equipeId,
      vendaTitulo: venda.titulo,
      numeroContrato: extrato.numeroContrato || venda.numeroContrato,
      consorciadoNome: venda.consorciado?.nome ?? null,
      planoNome: plano.nome,
      vendedorNome: venda.vendedor?.nome ?? null,
      equipeNome: venda.equipe?.nome ?? null,
      percentualComissao: regras.percentualComissao,
      creditoCentavos,
      createdAt: extrato.createdAt,
      updatedAt: extrato.updatedAt,
    });
  }

  return rows.sort(
    (a, b) =>
      b.updatedAt.localeCompare(a.updatedAt) ||
      a.numeroContrato.localeCompare(b.numeroContrato) ||
      a.parcelaNumero - b.parcelaNumero,
  );
}

export async function updateExtratoStatus(
  id: string,
  status: ExtratoStatus,
): Promise<void> {
  const ref = db().collection(COLLECTIONS.extratos).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Extrato não encontrado.");

  const current = snap.data() as ExtratoDoc;
  const allowed: Record<ExtratoStatus, ExtratoStatus[]> = {
    PENDENTE: ["LIBERADO"],
    LIBERADO: ["PAGO"],
    PAGO: [],
  };

  if (!allowed[current.status].includes(status)) {
    throw new Error(
      `Não é possível alterar de ${current.status} para ${status}.`,
    );
  }

  await ref.update({ status, updatedAt: nowIso() });
}
