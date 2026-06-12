"use server";

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requireServerSessionUser } from "@/lib/auth/server";
import {
  createVenda as createVendaDoc,
  deleteVenda as deleteVendaDoc,
  getAdministradora,
  getConsorciado,
  getEquipe,
  getPlano,
  getVenda as getVendaDoc,
  getVendedor,
  listVendas as listVendasDocs,
  listVendasPaginated as listVendasPaginatedDocs,
  listVendasPosVendaControle as listVendasPosVendaControleDocs,
  updateVenda as updateVendaDoc,
} from "@/lib/firestore/repository";
import { aplicarEstornoCancelamentoVenda } from "@/lib/firestore/estorno-cancelamento";
import type { StatusInconsistencia, StatusOperacionalCota, StatusPosVenda, VendaRow } from "@/lib/types/domain";
import type { VendasListFilters, VendasListPage } from "@/lib/firestore/repository";

export type VendaInput = {
  administradoraId: string;
  planoId: string | null;
  consorciadoId: string;
  equipeId: string;
  vendedorId: string;
  statusOperacional: StatusOperacionalCota;
  numeroContrato: string;
  grupo: string;
  cota: string;
  dataVencimento: number;
  titulo: string;
  descricao: string | null;
  valorCentavos: number | null;
  dataVenda: Date | null;
  mesAnoFechamento: string | null;
  observacoes: string | null;
  statusInconsistencia?: StatusInconsistencia;
  parcelasPagasCancelamento?: number | null;
};

function assertNovaVendaRequiredFields(data: {
  planoId: string | null;
  valorCentavos: number | null;
  dataVenda: Date | null;
  mesAnoFechamento: string | null;
}): void {
  if (!data.planoId?.trim()) throw new Error("Selecione o plano.");
  if (data.valorCentavos === null || data.valorCentavos <= 0) {
    throw new Error("Informe o valor do crédito.");
  }
  if (!data.dataVenda) throw new Error("Informe a data de fechamento.");
  if (!data.mesAnoFechamento?.trim()) throw new Error("Informe o mês/ano de fechamento.");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(data.mesAnoFechamento.trim())) {
    throw new Error("Mês/ano de fechamento inválido.");
  }
}

function assertVendaMatrizFields(data: {
  numeroContrato: string;
  grupo: string;
  cota: string;
  dataVencimento: number;
}): void {
  if (!data.numeroContrato.trim()) throw new Error("Informe o número do contrato.");
  if (!data.grupo.trim()) throw new Error("Informe o grupo.");
  if (!data.cota.trim()) throw new Error("Informe a cota.");
  if (!Number.isInteger(data.dataVencimento) || data.dataVencimento < 1 || data.dataVencimento > 31) {
    throw new Error("Informe o dia de vencimento entre 1 e 31.");
  }
}

function revalidateVendas() {
  revalidatePath("/");
  revalidatePath("/vendas");
  revalidatePath("/controle/inadimplencia");
  revalidatePath("/controle/inconsistencia");
  revalidatePath("/controle/pos-venda");
  revalidatePath("/comissoes");
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

async function assertEquipeAndVendedor(equipeId: string, vendedorId: string): Promise<void> {
  if (!equipeId.trim()) throw new Error("Selecione uma equipe.");
  if (!vendedorId.trim()) throw new Error("Selecione um vendedor.");
  const equipe = await getEquipe(equipeId);
  if (!equipe) throw new Error("Equipe não encontrada.");
  const vendedor = await getVendedor(vendedorId);
  if (!vendedor) throw new Error("Vendedor não encontrado.");
  if (vendedor.equipeId !== equipeId) {
    throw new Error("O vendedor não pertence à equipe selecionada.");
  }
}

export async function listVendas(): Promise<VendaRow[]> {
  await requireServerSessionUser();
  return listVendasDocs();
}

export async function listVendasPaginated(
  filters: VendasListFilters = {},
  cursorDocId?: string | null,
): Promise<VendasListPage> {
  await requireServerSessionUser();
  return listVendasPaginatedDocs(filters, cursorDocId);
}

export async function listVendasPosVendaControle(): Promise<VendaRow[]> {
  await requireServerSessionUser();
  return listVendasPosVendaControleDocs();
}

export async function getVenda(id: string): Promise<VendaRow | null> {
  return getVendaDoc(id);
}

export async function createVenda(data: VendaInput): Promise<VendaRow> {
  await requireServerSessionUser();
  const titulo = data.titulo.trim();
  if (!titulo) throw new Error("Informe o título da venda.");
  if (!data.consorciadoId.trim()) throw new Error("Selecione um consorciado.");
  assertVendaMatrizFields(data);
  assertNovaVendaRequiredFields(data);

  await assertAdministradoraExists(data.administradoraId);
  await assertPlanoBelongs(data.planoId, data.administradoraId);
  await assertConsorciadoExists(data.consorciadoId);
  await assertEquipeAndVendedor(data.equipeId, data.vendedorId);

  const row = await createVendaDoc({
    administradoraId: data.administradoraId,
    planoId: data.planoId,
    consorciadoId: data.consorciadoId,
    equipeId: data.equipeId,
    vendedorId: data.vendedorId,
    statusOperacional: data.statusOperacional,
    numeroContrato: data.numeroContrato.trim(),
    grupo: data.grupo.trim(),
    cota: data.cota.trim(),
    dataVencimento: data.dataVencimento,
    titulo,
    descricao: data.descricao,
    valorCentavos: data.valorCentavos,
    dataVenda: data.dataVenda ? data.dataVenda.toISOString() : null,
    mesAnoFechamento: data.mesAnoFechamento?.trim() ?? null,
    observacoes: data.observacoes,
    statusInconsistencia: data.statusInconsistencia ?? "CONSISTENTE",
  });

  revalidateVendas();
  return row;
}

export async function updateVendaStatusInconsistencia(
  id: string,
  statusInconsistencia: StatusInconsistencia,
): Promise<VendaRow> {
  return updateVenda(id, { statusInconsistencia });
}

export async function updateVendaStatusPosVenda(
  id: string,
  statusPosVenda: StatusPosVenda,
): Promise<VendaRow> {
  const sessionUser = await requireServerSessionUser();
  const current = await getVendaDoc(id);
  if (!current) throw new Error("Venda não encontrada.");

  const row = await updateVendaDoc(id, { statusPosVenda });

  if (statusPosVenda !== current.statusPosVenda) {
    await writeAuditLog({
      userId: sessionUser.uid,
      acao: `venda.status_pos_venda.${current.statusPosVenda.toLowerCase()}_para_${statusPosVenda.toLowerCase()}`,
      documentoId: id,
    });
  }

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

  const nextEquipe = patch.equipeId ?? current.equipeId;
  const nextVendedor = patch.vendedorId ?? current.vendedorId;
  if (patch.equipeId !== undefined || patch.vendedorId !== undefined) {
    await assertEquipeAndVendedor(nextEquipe, nextVendedor);
  } else if (!nextEquipe.trim() || !nextVendedor.trim()) {
    throw new Error("Selecione equipe e vendedor responsáveis.");
  }

  const data: Partial<VendaInput> = { ...patch };
  if (patch.titulo !== undefined) {
    const titulo = patch.titulo.trim();
    if (!titulo) throw new Error("Informe o título da venda.");
    data.titulo = titulo;
  }

  if (
    patch.numeroContrato !== undefined ||
    patch.grupo !== undefined ||
    patch.cota !== undefined ||
    patch.dataVencimento !== undefined
  ) {
    assertVendaMatrizFields({
      numeroContrato: patch.numeroContrato ?? current.numeroContrato,
      grupo: patch.grupo ?? current.grupo,
      cota: patch.cota ?? current.cota,
      dataVencimento: patch.dataVencimento ?? current.dataVencimento,
    });
  }

  const sessionUser = await requireServerSessionUser();
  const statusAnterior = current.statusOperacional;
  const statusNovo = data.statusOperacional ?? current.statusOperacional;
  const isNovoCancelamento = statusNovo === "CANCELADO" && statusAnterior !== "CANCELADO";

  if (isNovoCancelamento) {
    if (
      patch.parcelasPagasCancelamento === undefined ||
      patch.parcelasPagasCancelamento === null
    ) {
      throw new Error("Informe quantas parcelas foram pagas antes do cancelamento.");
    }
    if (
      !Number.isInteger(patch.parcelasPagasCancelamento) ||
      patch.parcelasPagasCancelamento < 0
    ) {
      throw new Error("Parcelas pagas deve ser um número inteiro maior ou igual a zero.");
    }
  }

  const row = await updateVendaDoc(id, {
    administradoraId: data.administradoraId,
    planoId: data.planoId,
    consorciadoId: data.consorciadoId,
    equipeId: data.equipeId,
    vendedorId: data.vendedorId,
    statusOperacional: data.statusOperacional,
    numeroContrato: patch.numeroContrato?.trim(),
    grupo: patch.grupo?.trim(),
    cota: patch.cota?.trim(),
    dataVencimento: patch.dataVencimento,
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
    statusInconsistencia: data.statusInconsistencia,
    parcelasPagasCancelamento: patch.parcelasPagasCancelamento,
  });

  if (patch.statusOperacional !== undefined && statusNovo !== statusAnterior) {
    await writeAuditLog({
      userId: sessionUser.uid,
      acao: `venda.status.${statusAnterior.toLowerCase()}_para_${statusNovo.toLowerCase()}`,
      documentoId: id,
    });
  }

  if (isNovoCancelamento && patch.parcelasPagasCancelamento !== undefined && patch.parcelasPagasCancelamento !== null) {
    const estorno = await aplicarEstornoCancelamentoVenda(id, patch.parcelasPagasCancelamento);
    if (estorno.estornoGerado) {
      await writeAuditLog({
        userId: sessionUser.uid,
        acao: `venda.estorno.gerado_${estorno.valorEstornoCentavos}`,
        documentoId: id,
      });
    }
  }

  revalidateVendas();
  return row;
}

export async function deleteVenda(id: string): Promise<void> {
  await deleteVendaDoc(id);
  revalidateVendas();
}
