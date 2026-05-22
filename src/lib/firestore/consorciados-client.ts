"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { ensureFirebaseAuth, getClientFirestore } from "@/lib/firebase/client";
import {
  COLLECTIONS,
  newId,
  nowIso,
  sortByCriadoEmDesc,
  type ConsorciadoDoc,
  type DocWithId,
} from "@/lib/firestore/types";
import type { ConsorciadoMini, ConsorciadoRow } from "@/lib/types/domain";

function toConsorciadoRow(doc: DocWithId<ConsorciadoDoc>): ConsorciadoRow {
  return {
    id: doc.id,
    nome: doc.nome,
    documento: doc.documento,
    telefone: doc.telefone,
    email: doc.email,
    endereco: doc.endereco,
    criadoEm: doc.criadoEm,
  };
}

function toConsorciadoMini(doc: DocWithId<ConsorciadoDoc>): ConsorciadoMini {
  return {
    id: doc.id,
    nome: doc.nome,
    documento: doc.documento,
  };
}

async function getDb() {
  await ensureFirebaseAuth();
  const db = getClientFirestore();
  if (!db) {
    throw new Error("Firestore indisponível. Verifique a configuração do Firebase.");
  }
  return db;
}

export async function listConsorciados(): Promise<ConsorciadoRow[]> {
  const db = await getDb();
  const snap = await getDocs(collection(db, COLLECTIONS.consorciados));
  const rows = snap.docs.map((item) => ({
    id: item.id,
    ...(item.data() as ConsorciadoDoc),
  }));
  return sortByCriadoEmDesc(rows).map(toConsorciadoRow);
}

export async function listConsorciadosMiniClient(): Promise<ConsorciadoMini[]> {
  const db = await getDb();
  const snap = await getDocs(collection(db, COLLECTIONS.consorciados));
  const rows = snap.docs.map((item) => ({
    id: item.id,
    ...(item.data() as ConsorciadoDoc),
  }));
  return sortByCriadoEmDesc(rows).map(toConsorciadoMini);
}

export async function getConsorciado(id: string): Promise<ConsorciadoRow | null> {
  const db = await getDb();
  const snap = await getDoc(doc(db, COLLECTIONS.consorciados, id));
  if (!snap.exists()) return null;
  return toConsorciadoRow({ id: snap.id, ...(snap.data() as ConsorciadoDoc) });
}

export type ConsorciadoInput = {
  nome: string;
  documento: string;
  telefone: string;
  email: string;
  endereco: string;
};

export async function createConsorciado(data: ConsorciadoInput): Promise<ConsorciadoRow> {
  const db = await getDb();
  const id = newId();
  const docData: ConsorciadoDoc = {
    nome: data.nome,
    documento: data.documento,
    telefone: data.telefone,
    email: data.email,
    endereco: data.endereco,
    criadoEm: nowIso(),
  };
  await setDoc(doc(db, COLLECTIONS.consorciados, id), docData);
  return toConsorciadoRow({ id, ...docData });
}

export async function updateConsorciado(
  id: string,
  data: ConsorciadoInput,
): Promise<ConsorciadoRow> {
  const db = await getDb();
  const ref = doc(db, COLLECTIONS.consorciados, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Consorciado não encontrado.");

  const current = snap.data() as ConsorciadoDoc;
  const next: ConsorciadoDoc = {
    ...current,
    nome: data.nome,
    documento: data.documento,
    telefone: data.telefone,
    email: data.email,
    endereco: data.endereco,
  };
  await setDoc(ref, next);
  return toConsorciadoRow({ id, ...next });
}

export async function deleteConsorciado(id: string): Promise<void> {
  const db = await getDb();
  const ref = doc(db, COLLECTIONS.consorciados, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Consorciado não encontrado.");
  await deleteDoc(ref);
}
