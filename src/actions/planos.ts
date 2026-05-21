"use server";

import { revalidatePath } from "next/cache";
import {
  countVendasByPlano,
  createPlano as createPlanoDoc,
  deletePlano as deletePlanoDoc,
  getAdministradora,
  getPlano as getPlanoDoc,
  listPlanos as listPlanosDocs,
  listPlanosMiniByAdministradora as listPlanosMiniByAdministradoraDocs,
  updatePlano as updatePlanoDoc,
} from "@/lib/firestore/repository";
import type { PlanoMini, PlanoRow } from "@/lib/types/domain";

export type PlanoInput = {
  administradoraId: string;
  nome: string;
  tipoBem: string;
  valorCreditoCentavos: number | null;
  regrasComissaoJson: string | null;
  regrasRecebimentoJson: string | null;
  regrasEstornoJson: string | null;
};

function revalidatePlanos() {
  revalidatePath("/");
  revalidatePath("/planos");
  revalidatePath("/vendas");
}

async function assertAdministradoraExists(administradoraId: string): Promise<void> {
  const adm = await getAdministradora(administradoraId);
  if (!adm) throw new Error("Administradora não encontrada.");
}

export async function listPlanos(): Promise<PlanoRow[]> {
  return listPlanosDocs();
}

export async function listPlanosMiniByAdministradora(
  administradoraId: string,
): Promise<PlanoMini[]> {
  return listPlanosMiniByAdministradoraDocs(administradoraId);
}

export async function getPlano(id: string): Promise<PlanoRow | null> {
  return getPlanoDoc(id);
}

export async function createPlano(data: PlanoInput): Promise<PlanoRow> {
  const nome = data.nome.trim();
  const tipoBem = data.tipoBem.trim();
  if (!nome) throw new Error("Informe o nome do plano.");
  if (!tipoBem) throw new Error("Informe o tipo de bem.");
  await assertAdministradoraExists(data.administradoraId);

  const row = await createPlanoDoc({ ...data, nome, tipoBem });
  revalidatePlanos();
  return row;
}

export async function updatePlano(id: string, patch: Partial<PlanoInput>): Promise<PlanoRow> {
  const current = await getPlanoDoc(id);
  if (!current) throw new Error("Plano não encontrado.");

  const data: Partial<PlanoInput> = { ...patch };
  if (patch.nome !== undefined) {
    const nome = patch.nome.trim();
    if (!nome) throw new Error("Informe o nome do plano.");
    data.nome = nome;
  }
  if (patch.tipoBem !== undefined) {
    const tipoBem = patch.tipoBem.trim();
    if (!tipoBem) throw new Error("Informe o tipo de bem.");
    data.tipoBem = tipoBem;
  }
  if (patch.administradoraId) {
    await assertAdministradoraExists(patch.administradoraId);
  }

  const row = await updatePlanoDoc(id, data);
  revalidatePlanos();
  return row;
}

export async function deletePlano(id: string): Promise<void> {
  const vendas = await countVendasByPlano(id);
  if (vendas > 0) throw new Error("Existem vendas vinculadas a este plano.");

  await deletePlanoDoc(id);
  revalidatePlanos();
}
