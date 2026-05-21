import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  COLLECTIONS,
  newId,
  nowIso,
  sortByCreatedAtDesc,
  type AdministradoraDoc,
  type DocWithId,
  type PlanoDoc,
  type VendaDoc,
} from "@/lib/firestore/types";
import {
  toAdministradoraRow,
  toPlanoMini,
  toPlanoRow,
  toVendaRow,
} from "@/lib/mappers";
import type {
  AdministradoraRow,
  PlanoMini,
  PlanoRow,
  VendaRow,
} from "@/lib/types/domain";
import type { VendaStatus } from "@/lib/types/domain";

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
  const doc: PlanoDoc = { ...data, createdAt: ts, updatedAt: ts };
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
    createdAt: current.createdAt,
    updatedAt: nowIso(),
  };
  await db().collection(COLLECTIONS.planos).doc(id).set(next);
  return toPlanoRow({ id, ...next }, adm);
}

export async function deletePlano(id: string): Promise<void> {
  await db().collection(COLLECTIONS.planos).doc(id).delete();
}

export async function listVendas(): Promise<VendaRow[]> {
  const [vendas, administradoras, planos] = await Promise.all([
    listVendaDocs(),
    listAdministradoraDocs(),
    listPlanoDocs(),
  ]);
  const admMap = new Map(administradoras.map((a) => [a.id, a]));
  const planoMap = new Map(planos.map((p) => [p.id, p]));

  return sortByCreatedAtDesc(vendas)
    .map((v) => {
      const adm = admMap.get(v.administradoraId);
      if (!adm) return null;
      const plano = v.planoId ? (planoMap.get(v.planoId) ?? null) : null;
      return toVendaRow(v, adm, plano);
    })
    .filter((x): x is VendaRow => x !== null);
}

export async function getVenda(id: string): Promise<VendaRow | null> {
  const snap = await db().collection(COLLECTIONS.vendas).doc(id).get();
  if (!snap.exists) return null;
  const venda = { id: snap.id, ...(snap.data() as VendaDoc) };
  const adm = await getAdministradoraDoc(venda.administradoraId);
  if (!adm) return null;
  const plano = venda.planoId ? await getPlanoDoc(venda.planoId) : null;
  return toVendaRow(venda, adm, plano);
}

export async function createVenda(
  data: Omit<VendaDoc, "createdAt" | "updatedAt">,
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
  const ts = nowIso();
  const id = newId();
  const doc: VendaDoc = { ...data, createdAt: ts, updatedAt: ts };
  await db().collection(COLLECTIONS.vendas).doc(id).set(doc);
  return toVendaRow({ id, ...doc }, adm, plano);
}

export async function updateVenda(
  id: string,
  patch: Partial<Omit<VendaDoc, "createdAt" | "updatedAt">>,
): Promise<VendaRow> {
  const snap = await db().collection(COLLECTIONS.vendas).doc(id).get();
  if (!snap.exists) throw new Error("Venda não encontrada.");
  const current = { id: snap.id, ...(snap.data() as VendaDoc) };
  const nextAdmId = patch.administradoraId ?? current.administradoraId;
  const nextPlanoId = patch.planoId !== undefined ? patch.planoId : current.planoId;

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

  const { id: _id, ...currentData } = current;
  const next: VendaDoc = {
    ...currentData,
    ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)),
    createdAt: current.createdAt,
    updatedAt: nowIso(),
  };
  await db().collection(COLLECTIONS.vendas).doc(id).set(next);
  return toVendaRow({ id, ...next }, adm, plano);
}

export async function deleteVenda(id: string): Promise<void> {
  await db().collection(COLLECTIONS.vendas).doc(id).delete();
}

export async function getDashboardCounts(): Promise<{
  nAdministradoras: number;
  nPlanos: number;
  nVendas: number;
  nVendasFechadas: number;
}> {
  const [administradoras, planos, vendas] = await Promise.all([
    listAdministradoraDocs(),
    listPlanoDocs(),
    listVendaDocs(),
  ]);
  return {
    nAdministradoras: administradoras.length,
    nPlanos: planos.length,
    nVendas: vendas.length,
    nVendasFechadas: vendas.filter((v) => v.status === "FECHADA").length,
  };
}
