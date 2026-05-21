"use server";

import { revalidatePath } from "next/cache";
import {
  countPlanosByAdministradora,
  countVendasByAdministradora,
  createAdministradora as createAdministradoraDoc,
  deleteAdministradora as deleteAdministradoraDoc,
  findAdministradoraByCnpj,
  getAdministradora as getAdministradoraDoc,
  listAdministradoras as listAdministradorasDocs,
  updateAdministradora as updateAdministradoraDoc,
} from "@/lib/firestore/repository";
import type { AdministradoraRow } from "@/lib/types/domain";
import { validateCnpjOrThrow } from "@/lib/validators/cnpj";

export type AdministradoraInput = {
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
};

function revalidateAdministradoras() {
  revalidatePath("/");
  revalidatePath("/administradoras");
  revalidatePath("/planos");
  revalidatePath("/vendas");
}

async function assertCnpjAvailable(cnpjDigits: string, excludeId?: string): Promise<void> {
  const existing = await findAdministradoraByCnpj(cnpjDigits, excludeId);
  if (existing) throw new Error("CNPJ já cadastrado.");
}

export async function listAdministradoras(): Promise<AdministradoraRow[]> {
  return listAdministradorasDocs();
}

export async function getAdministradora(id: string): Promise<AdministradoraRow | null> {
  return getAdministradoraDoc(id);
}

export async function createAdministradora(data: AdministradoraInput): Promise<AdministradoraRow> {
  const nome = data.nome.trim();
  if (!nome) throw new Error("Informe o nome da administradora.");

  const cnpj = validateCnpjOrThrow(data.cnpj);
  await assertCnpjAvailable(cnpj);

  const row = await createAdministradoraDoc({ ...data, nome, cnpj });
  revalidateAdministradoras();
  return row;
}

export async function updateAdministradora(
  id: string,
  patch: Partial<AdministradoraInput>,
): Promise<AdministradoraRow> {
  const current = await getAdministradoraDoc(id);
  if (!current) throw new Error("Administradora não encontrada.");

  const data: Partial<AdministradoraInput> = { ...patch };
  if (patch.nome !== undefined) {
    const nome = patch.nome.trim();
    if (!nome) throw new Error("Informe o nome da administradora.");
    data.nome = nome;
  }
  if (patch.cnpj !== undefined) {
    const cnpj = validateCnpjOrThrow(patch.cnpj);
    await assertCnpjAvailable(cnpj, id);
    data.cnpj = cnpj;
  }

  const row = await updateAdministradoraDoc(id, data);
  revalidateAdministradoras();
  return row;
}

export async function deleteAdministradora(id: string): Promise<void> {
  const [planos, vendas] = await Promise.all([
    countPlanosByAdministradora(id),
    countVendasByAdministradora(id),
  ]);

  if (planos > 0) throw new Error("Existem planos vinculados a esta administradora.");
  if (vendas > 0) throw new Error("Existem vendas vinculadas a esta administradora.");

  await deleteAdministradoraDoc(id);
  revalidateAdministradoras();
}
