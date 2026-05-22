"use server";

import { revalidatePath } from "next/cache";
import {
  createVenda as createVendaDoc,
  deleteVenda as deleteVendaDoc,
  getAdministradora,
  getConsorciado,
  getPlano,
  getVenda as getVendaDoc,
  listVendas as listVendasDocs,
  updateVenda as updateVendaDoc,
} from "@/lib/firestore/repository";
import type { VendaRow, VendaStatus } from "@/lib/types/domain";

export type VendaInput = {
  administradoraId: string;
  planoId: string | null;
  consorciadoId: string;
  status: VendaStatus;
  titulo: string;
  descricao: string | null;
  valorCentavos: number | null;
  dataVenda: Date | null;
  observacoes: string | null;
};

function revalidateVendas() {
  revalidatePath("/");
  revalidatePath("/vendas");
}

async function assertAdministradoraExists(administradoraId: string): Promise<void> {
  const adm = await getAdministradora(administradoraId);
  if (!adm) throw new Error("Administradora não encontrada.");
}

async function assertPlanoBelongs(
  planoId: string | null,
  administradoraId: string,
): Promise<void> {
  if (!planoId) return;
  const plano = await getPlano(planoId);
  if (!plano) throw new Error("Plano não encontrado.");
  if (plano.administradoraId !== administradoraId) {
    throw new Error("O plano não pertence à administradora selecionada.");
  }
}

async function assertConsorciadoExists(consorciadoId: string): Promise<void> {
  const consorciado = await getConsorciado(consorciadoId);
  if (!consorciado) throw new Error("Consorciado não encontrado.");
}

export async function listVendas(): Promise<VendaRow[]> {
  return listVendasDocs();
}

export async function getVenda(id: string): Promise<VendaRow | null> {
  return getVendaDoc(id);
}

export async function createVenda(data: VendaInput): Promise<VendaRow> {
  const titulo = data.titulo.trim();
  if (!titulo) throw new Error("Informe o título da venda.");
  if (!data.consorciadoId.trim()) throw new Error("Selecione um consorciado.");

  await assertAdministradoraExists(data.administradoraId);
  await assertPlanoBelongs(data.planoId, data.administradoraId);
  await assertConsorciadoExists(data.consorciadoId);

  const row = await createVendaDoc({
    administradoraId: data.administradoraId,
    planoId: data.planoId,
    consorciadoId: data.consorciadoId,
    status: data.status,
    titulo,
    descricao: data.descricao,
    valorCentavos: data.valorCentavos,
    dataVenda: data.dataVenda ? data.dataVenda.toISOString() : null,
    observacoes: data.observacoes,
  });

  revalidateVendas();
  return row;
}

export async function updateVenda(id: string, patch: Partial<VendaInput>): Promise<VendaRow> {
  const current = await getVendaDoc(id);
  if (!current) throw new Error("Venda não encontrada.");

  const nextAdm = patch.administradoraId ?? current.administradoraId;
  const nextPlano = patch.planoId !== undefined ? patch.planoId : current.planoId;
  const nextConsorciado =
    patch.consorciadoId !== undefined ? patch.consorciadoId : current.consorciadoId ?? "";

  if (patch.administradoraId) {
    await assertAdministradoraExists(patch.administradoraId);
  }
  await assertPlanoBelongs(nextPlano, nextAdm);
  if (patch.consorciadoId !== undefined) {
    if (!patch.consorciadoId.trim()) throw new Error("Selecione um consorciado.");
    await assertConsorciadoExists(patch.consorciadoId);
  } else if (!nextConsorciado.trim()) {
    throw new Error("Selecione um consorciado.");
  }

  const data: Partial<VendaInput> = { ...patch };
  if (patch.titulo !== undefined) {
    const titulo = patch.titulo.trim();
    if (!titulo) throw new Error("Informe o título da venda.");
    data.titulo = titulo;
  }

  const row = await updateVendaDoc(id, {
    administradoraId: data.administradoraId,
    planoId: data.planoId,
    consorciadoId: data.consorciadoId,
    status: data.status,
    titulo: data.titulo,
    descricao: data.descricao,
    valorCentavos: data.valorCentavos,
    dataVenda:
      data.dataVenda !== undefined
        ? data.dataVenda
          ? data.dataVenda.toISOString()
          : null
        : undefined,
    observacoes: data.observacoes,
  });

  revalidateVendas();
  return row;
}

export async function deleteVenda(id: string): Promise<void> {
  await deleteVendaDoc(id);
  revalidateVendas();
}
