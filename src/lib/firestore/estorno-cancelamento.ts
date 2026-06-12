import { getAdminFirestore } from "@/lib/firebase/admin";
import { resolvePlanoRegrasFinanceiras } from "@/lib/planos/regras-financeiras";
import { normalizeVendaFields } from "@/lib/firestore/legacy";
import { COLLECTIONS, nowIso, type ExtratoDoc, type PlanoDoc, type VendaDoc } from "@/lib/firestore/types";
import {
  calcularEstorno,
  extratoDeveSerEstornado,
  extratoEstornoDocId,
  resolverCreditoCentavos,
  vendaGeraExtratosComissao,
} from "@/utils/financeiro";

function db() {
  return getAdminFirestore();
}

export type EstornoCancelamentoResult = {
  estornoGerado: boolean;
  valorEstornoCentavos: number;
  motivo: string | null;
};

export async function aplicarEstornoCancelamentoVenda(
  vendaId: string,
  parcelasPagasCancelamento: number,
): Promise<EstornoCancelamentoResult> {
  const vendaRef = db().collection(COLLECTIONS.vendas).doc(vendaId);
  const vendaSnap = await vendaRef.get();
  if (!vendaSnap.exists) {
    throw new Error("Venda não encontrada.");
  }

  const vendaRaw = { id: vendaSnap.id, ...(vendaSnap.data() as VendaDoc) };
  const venda = { ...vendaRaw, ...normalizeVendaFields(vendaRaw) };
  if (venda.statusOperacional !== "CANCELADO") {
    throw new Error("Estorno só pode ser aplicado em vendas canceladas.");
  }

  if (!Number.isInteger(parcelasPagasCancelamento) || parcelasPagasCancelamento < 0) {
    throw new Error("Informe um número válido de parcelas pagas antes do cancelamento.");
  }

  if (!venda.planoId) {
    await vendaRef.update({
      parcelasPagasCancelamento,
      updatedAt: nowIso(),
    });
    return { estornoGerado: false, valorEstornoCentavos: 0, motivo: null };
  }

  const planoSnap = await db().collection(COLLECTIONS.planos).doc(venda.planoId).get();
  if (!planoSnap.exists) {
    throw new Error("Plano da venda não encontrado.");
  }

  const regras = resolvePlanoRegrasFinanceiras(planoSnap.data() as PlanoDoc);
  if (!regras) {
    await vendaRef.update({
      parcelasPagasCancelamento,
      updatedAt: nowIso(),
    });
    return { estornoGerado: false, valorEstornoCentavos: 0, motivo: null };
  }

  const creditoCentavos = resolverCreditoCentavos(
    venda.valorCentavos,
    (planoSnap.data() as PlanoDoc).valorCreditoCentavos,
  );

  if (creditoCentavos === null) {
    await vendaRef.update({
      parcelasPagasCancelamento,
      updatedAt: nowIso(),
    });
    return { estornoGerado: false, valorEstornoCentavos: 0, motivo: null };
  }

  const estorno = calcularEstorno(creditoCentavos, regras, parcelasPagasCancelamento);
  const ts = nowIso();

  await vendaRef.update({
    parcelasPagasCancelamento,
    updatedAt: ts,
  });

  const extratosSnap = await db()
    .collection(COLLECTIONS.extratos)
    .where("vendaId", "==", vendaId)
    .get();

  const dataReferencia = venda.dataVenda ?? venda.updatedAt;

  for (const extratoDoc of extratosSnap.docs) {
    const extrato = extratoDoc.data() as ExtratoDoc;
    if (extrato.tipo === "ESTORNO") continue;

    const deveEstornar =
      !vendaGeraExtratosComissao(venda.statusOperacional) &&
      extratoDeveSerEstornado(
        venda.statusOperacional,
        dataReferencia,
        regras.diasParaEstorno,
        extrato.status,
      );

    if (deveEstornar) {
      await extratoDoc.ref.delete();
    }
  }

  if (!estorno.aplicaEstorno) {
    return {
      estornoGerado: false,
      valorEstornoCentavos: 0,
      motivo: estorno.motivo,
    };
  }

  const estornoId = extratoEstornoDocId(vendaId);
  const estornoRef = db().collection(COLLECTIONS.extratos).doc(estornoId);
  const prevEstorno = await estornoRef.get();

  const doc: ExtratoDoc = {
    vendaId,
    numeroContrato: venda.numeroContrato,
    planoId: venda.planoId,
    parcelaNumero: 0,
    parcelaTotal: regras.parcelasRecebimento,
    parcelaLabel: "ESTORNO",
    valorCentavos: -estorno.valorEstornoCentavos,
    status: "LIBERADO",
    tipo: "ESTORNO",
    vendedorId: venda.vendedorId,
    equipeId: venda.equipeId,
    createdAt: prevEstorno.exists ? (prevEstorno.data() as ExtratoDoc).createdAt : ts,
    updatedAt: ts,
  };

  await estornoRef.set(doc);

  return {
    estornoGerado: true,
    valorEstornoCentavos: estorno.valorEstornoCentavos,
    motivo: estorno.motivo,
  };
}

