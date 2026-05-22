import { formatCnpj } from "@/lib/validators/cnpj";
import type {
  AdministradoraDoc,
  ConsorciadoDoc,
  DocWithId,
  PlanoDoc,
  VendaDoc,
} from "@/lib/firestore/types";
import type {
  AdministradoraMini,
  AdministradoraRow,
  ConsorciadoMini,
  ConsorciadoRow,
  PlanoMini,
  PlanoRow,
  VendaRow,
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
  return {
    id: plano.id,
    administradoraId: plano.administradoraId,
    administradora: toAdmMini(administradora),
    nome: plano.nome,
    tipoBem: plano.tipoBem,
    valorCreditoCentavos: plano.valorCreditoCentavos,
    regrasComissaoJson: plano.regrasComissaoJson,
    regrasRecebimentoJson: plano.regrasRecebimentoJson,
    regrasEstornoJson: plano.regrasEstornoJson,
    createdAt: plano.createdAt,
    updatedAt: plano.updatedAt,
  };
}

export function toPlanoMini(plano: DocWithId<PlanoDoc>): PlanoMini {
  return { id: plano.id, nome: plano.nome, tipoBem: plano.tipoBem };
}

export function toConsorciadoRow(item: DocWithId<ConsorciadoDoc>): ConsorciadoRow {
  return {
    id: item.id,
    nome: item.nome,
    documento: item.documento,
    telefone: item.telefone,
    email: item.email,
    endereco: item.endereco,
    criadoEm: item.criadoEm,
  };
}

export function toConsorciadoMini(item: DocWithId<ConsorciadoDoc>): ConsorciadoMini {
  return {
    id: item.id,
    nome: item.nome,
    documento: item.documento,
  };
}

export function toVendaRow(
  venda: DocWithId<VendaDoc>,
  administradora: DocWithId<AdministradoraDoc>,
  plano: DocWithId<PlanoDoc> | null,
  consorciado: DocWithId<ConsorciadoDoc> | null,
): VendaRow {
  return {
    id: venda.id,
    administradoraId: venda.administradoraId,
    planoId: venda.planoId,
    consorciadoId: venda.consorciadoId,
    administradora: toAdmMini(administradora),
    plano: plano ? toPlanoMini(plano) : null,
    consorciado: consorciado ? toConsorciadoMini(consorciado) : null,
    status: venda.status,
    titulo: venda.titulo,
    descricao: venda.descricao,
    valorCentavos: venda.valorCentavos,
    dataVenda: venda.dataVenda,
    observacoes: venda.observacoes,
    createdAt: venda.createdAt,
    updatedAt: venda.updatedAt,
  };
}
