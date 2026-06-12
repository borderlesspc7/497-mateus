import { normalizeVendaFields, readConsorciadoCpfCnpj, sanitizeConsorciadoDoc } from "@/lib/firestore/legacy";
import { resolvePlanoRegrasFinanceiras } from "@/lib/planos/regras-financeiras";
import { DEFAULT_CHECKLIST_ATIVACAO } from "@/lib/vendas/pos-venda";
import { formatCnpj } from "@/lib/validators/cnpj";
import type {
  AdministradoraDoc,
  ConsorciadoDoc,
  DocWithId,
  EquipeDoc,
  PlanoDoc,
  VendaDoc,
  VendedorDoc,
} from "@/lib/firestore/types";
import type {
  AdministradoraMini,
  AdministradoraRow,
  ConsorciadoMini,
  ConsorciadoRow,
  EquipeMini,
  EquipeRow,
  PlanoMini,
  PlanoRow,
  VendaRow,
  VendedorMini,
  VendedorRow,
} from "@/lib/types/domain";

function toAdmMini(adm: DocWithId<AdministradoraDoc>): AdministradoraMini {
  return {
    id: adm.id,
    nome: adm.nome,
    cnpj: formatCnpj(adm.cnpj),
  };
}

export function toAdministradoraRow(adm: DocWithId<AdministradoraDoc>): AdministradoraRow {
  return {
    id: adm.id,
    nome: adm.nome,
    cnpj: formatCnpj(adm.cnpj),
    telefone: adm.telefone,
    email: adm.email,
    contatoPrincipal: adm.contatoPrincipal,
    enderecoLogradouro: adm.enderecoLogradouro,
    enderecoNumero: adm.enderecoNumero,
    enderecoComplemento: adm.enderecoComplemento,
    enderecoBairro: adm.enderecoBairro,
    enderecoCidade: adm.enderecoCidade,
    enderecoUf: adm.enderecoUf,
    enderecoCep: adm.enderecoCep,
    regrasOperacionaisJson: adm.regrasOperacionaisJson,
    createdAt: adm.createdAt,
    updatedAt: adm.updatedAt,
  };
}

export function toPlanoRow(
  plano: DocWithId<PlanoDoc>,
  administradora: DocWithId<AdministradoraDoc>,
): PlanoRow {
  const regras = resolvePlanoRegrasFinanceiras(plano);
  return {
    id: plano.id,
    administradoraId: plano.administradoraId,
    administradora: toAdmMini(administradora),
    nome: plano.nome,
    tipoBem: plano.tipoBem,
    valorCreditoCentavos: plano.valorCreditoCentavos,
    percentualComissao: plano.percentualComissao ?? regras?.percentualComissao ?? null,
    parcelasRecebimento: plano.parcelasRecebimento ?? regras?.parcelasRecebimento ?? null,
    diasParaEstorno: plano.diasParaEstorno ?? regras?.diasParaEstorno ?? null,
    createdAt: plano.createdAt,
    updatedAt: plano.updatedAt,
  };
}

export function toPlanoMini(plano: DocWithId<PlanoDoc>): PlanoMini {
  return { id: plano.id, nome: plano.nome, tipoBem: plano.tipoBem };
}

export function toConsorciadoRow(item: DocWithId<ConsorciadoDoc>): ConsorciadoRow {
  const sanitized = sanitizeConsorciadoDoc(item);
  return {
    id: item.id,
    nome: sanitized.nome,
    cpf_cnpj: sanitized.cpf_cnpj,
    telefone: sanitized.telefone,
    email: sanitized.email,
    criadoEm: sanitized.criadoEm,
  };
}

export function toConsorciadoMini(item: DocWithId<ConsorciadoDoc>): ConsorciadoMini {
  const sanitized = sanitizeConsorciadoDoc(item);
  return {
    id: item.id,
    nome: sanitized.nome,
    cpf_cnpj: sanitized.cpf_cnpj,
    telefone: sanitized.telefone,
  };
}

export function toEquipeRow(item: DocWithId<EquipeDoc>): EquipeRow {
  return {
    id: item.id,
    nome: item.nome,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export function toEquipeMini(item: DocWithId<EquipeDoc>): EquipeMini {
  return { id: item.id, nome: item.nome };
}

export function toVendedorRow(
  item: DocWithId<VendedorDoc>,
  equipe: DocWithId<EquipeDoc>,
): VendedorRow {
  return {
    id: item.id,
    nome: item.nome,
    email: item.email,
    telefone: item.telefone,
    equipeId: item.equipeId,
    equipe: toEquipeMini(equipe),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export function toVendedorMini(item: DocWithId<VendedorDoc>): VendedorMini {
  return { id: item.id, nome: item.nome, equipeId: item.equipeId };
}

export function toVendaRow(
  venda: DocWithId<VendaDoc>,
  administradora: DocWithId<AdministradoraDoc>,
  plano: DocWithId<PlanoDoc> | null,
  consorciado: DocWithId<ConsorciadoDoc> | null,
  equipe: DocWithId<EquipeDoc> | null,
  vendedor: DocWithId<VendedorDoc> | null,
): VendaRow {
  const normalized = normalizeVendaFields(venda);
  return {
    id: venda.id,
    administradoraId: venda.administradoraId,
    planoId: venda.planoId,
    consorciadoId: venda.consorciadoId,
    equipeId: normalized.equipeId,
    vendedorId: normalized.vendedorId,
    administradora: toAdmMini(administradora),
    plano: plano ? toPlanoMini(plano) : null,
    consorciado: consorciado ? toConsorciadoMini(consorciado) : null,
    equipe: equipe ? toEquipeMini(equipe) : null,
    vendedor: vendedor ? toVendedorMini(vendedor) : null,
    statusOperacional: normalized.statusOperacional,
    statusInconsistencia: normalized.statusInconsistencia,
    statusPosVenda: normalized.statusPosVenda,
    parcelasPagasCancelamento: normalized.parcelasPagasCancelamento,
    numeroContrato: normalized.numeroContrato,
    grupo: normalized.grupo,
    cota: normalized.cota,
    dataVencimento: normalized.dataVencimento,
    titulo: venda.titulo,
    descricao: venda.descricao,
    valorCentavos: venda.valorCentavos,
    dataVenda: venda.dataVenda,
    mesAnoFechamento: venda.mesAnoFechamento ?? null,
    observacoes: venda.observacoes,
    checklistAtivacao: venda.checklistAtivacao ?? DEFAULT_CHECKLIST_ATIVACAO,
    dataPendencia: venda.dataPendencia ?? null,
    alertaAtivo: venda.alertaAtivo ?? false,
    createdAt: venda.createdAt,
    updatedAt: venda.updatedAt,
  };
}
