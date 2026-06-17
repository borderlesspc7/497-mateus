"use server";

import {
  findConsorciadoMiniByCpfCnpj,
  getConsorciado as getConsorciadoDoc,
  listConsorciadosMini as listConsorciadosMiniDocs,
  listVendasByConsorciado as listVendasByConsorciadoDocs,
  searchConsorciadosMini as searchConsorciadosMiniDocs,
} from "@/lib/firestore/repository";
import type { ConsorciadoMini, ConsorciadoRow, VendaRow } from "@/lib/types/domain";

export async function listConsorciadosMini(): Promise<ConsorciadoMini[]> {
  return listConsorciadosMiniDocs();
}

export async function searchConsorciadosMini(query: string): Promise<ConsorciadoMini[]> {
  return searchConsorciadosMiniDocs(query);
}

export async function findConsorciadoByCpfCnpj(
  cpfCnpj: string,
): Promise<ConsorciadoMini | null> {
  return findConsorciadoMiniByCpfCnpj(cpfCnpj);
}

export async function getConsorciado(id: string): Promise<ConsorciadoRow | null> {
  return getConsorciadoDoc(id);
}

export async function listVendasByConsorciado(consorciadoId: string): Promise<VendaRow[]> {
  return listVendasByConsorciadoDocs(consorciadoId);
}
