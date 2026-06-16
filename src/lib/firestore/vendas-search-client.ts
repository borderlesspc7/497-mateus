"use client";

import { collection, getDocs } from "firebase/firestore";
import { ensureFirebaseAuth, getClientFirestore } from "@/lib/firebase/client";
import { readNumeroContrato } from "@/lib/firestore/contrato-matriz";
import { normalizeVendaFields } from "@/lib/firestore/legacy";
import { COLLECTIONS, type VendaDoc } from "@/lib/firestore/types";

import type { StatusInconsistencia, StatusOperacionalCota } from "@/lib/types/domain";

export type VendaSearchIndexRow = {
  id: string;
  consorciadoId: string | null;
  numeroContrato: string;
  grupo: string;
  cota: string;
  statusOperacional: StatusOperacionalCota;
  statusInconsistencia: StatusInconsistencia;
};

async function getDb() {
  await ensureFirebaseAuth();
  const db = getClientFirestore();
  if (!db) {
    throw new Error("Firestore indisponível. Verifique a configuração do Firebase.");
  }
  return db;
}

export async function listVendasSearchIndex(): Promise<VendaSearchIndexRow[]> {
  const db = await getDb();
  const snap = await getDocs(collection(db, COLLECTIONS.vendas));
  return snap.docs.map((item) => {
    const data = item.data() as VendaDoc;
    const normalized = normalizeVendaFields(data);
    return {
      id: item.id,
      consorciadoId: data.consorciadoId ?? null,
      numeroContrato: readNumeroContrato(normalized),
      grupo: normalized.grupo,
      cota: normalized.cota,
      statusOperacional: normalized.statusOperacional,
      statusInconsistencia: normalized.statusInconsistencia,
    };
  });
}
