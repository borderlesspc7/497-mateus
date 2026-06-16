import { getAdminFirestore } from "@/lib/firebase/admin";
import type { VendaContratoLookup } from "@/lib/firestore/contrato-matriz";
import {
  buildContratoLookupFromVendas,
  normalizeNumeroContrato,
} from "@/lib/firestore/contrato-matriz";
import { aplicarEstornoCancelamentoVenda } from "@/lib/firestore/estorno-cancelamento";
import { normalizeVendaFields } from "@/lib/firestore/legacy";
import { listVendaDocsByStatusOperacional } from "@/lib/firestore/repository";
import { COLLECTIONS, nowIso, type ConsorciadoDoc, type VendaDoc } from "@/lib/firestore/types";
import type {
  ImportConfirmItem,
  ImportConfirmResult,
  ImportReconciliationItem,
} from "@/lib/importacao/types";

export type { VendaContratoLookup };

export async function buildVendaContratoLookupMap(): Promise<Map<string, VendaContratoLookup>> {
  const snap = await getAdminFirestore().collection(COLLECTIONS.vendas).get();
  const entries: VendaContratoLookup[] = [];

  for (const doc of snap.docs) {
    const data = doc.data() as VendaDoc;
    const normalized = normalizeVendaFields(data);
    const numeroContrato = normalized.numeroContrato;
    if (!numeroContrato) continue;
    entries.push({
      id: doc.id,
      numeroContrato,
      statusOperacional: normalized.statusOperacional,
    });
  }

  return buildContratoLookupFromVendas(entries);
}

export async function listInadimplentesMissingFromSpreadsheet(
  spreadsheetContractNumbers: string[],
): Promise<{
  missingFromSpreadsheet: ImportReconciliationItem[];
  totalInadimplentesNoSistema: number;
}> {
  const spreadsheetSet = new Set(
    spreadsheetContractNumbers.map((item) => normalizeNumeroContrato(item)).filter(Boolean),
  );

  const db = getAdminFirestore();
  const vendas = await listVendaDocsByStatusOperacional("INADIMPLENTE");

  const inadimplentes: Array<{
    vendaId: string;
    numeroContrato: string;
    grupo: string;
    cota: string;
    consorciadoId: string | null;
  }> = [];

  let totalInadimplentesNoSistema = 0;

  for (const data of vendas) {
    const normalized = normalizeVendaFields(data);
    if (normalized.statusOperacional !== "INADIMPLENTE") continue;

    totalInadimplentesNoSistema += 1;

    const numeroContrato = normalized.numeroContrato;
    if (!numeroContrato || spreadsheetSet.has(numeroContrato)) continue;

    inadimplentes.push({
      vendaId: data.id,
      numeroContrato,
      grupo: normalized.grupo,
      cota: normalized.cota,
      consorciadoId: data.consorciadoId ?? null,
    });
  }

  const consorciadoIds = [
    ...new Set(inadimplentes.map((item) => item.consorciadoId).filter((id): id is string => Boolean(id))),
  ];

  const consorciadoNomeMap = new Map<string, string>();
  await Promise.all(
    consorciadoIds.map(async (id) => {
      const consorciadoSnap = await db.collection(COLLECTIONS.consorciados).doc(id).get();
      if (!consorciadoSnap.exists) return;
      const consorciado = consorciadoSnap.data() as ConsorciadoDoc;
      consorciadoNomeMap.set(id, consorciado.nome);
    }),
  );

  const missingFromSpreadsheet = inadimplentes
    .map((item) => ({
      vendaId: item.vendaId,
      numeroContrato: item.numeroContrato,
      grupo: item.grupo,
      cota: item.cota,
      consorciadoNome: item.consorciadoId
        ? (consorciadoNomeMap.get(item.consorciadoId) ?? null)
        : null,
    }))
    .sort((a, b) => a.numeroContrato.localeCompare(b.numeroContrato));

  return {
    missingFromSpreadsheet,
    totalInadimplentesNoSistema: inadimplentes.length,
  };
}

export async function batchUpdateVendaStatus(
  updates: ImportConfirmItem[],
): Promise<ImportConfirmResult> {
  if (updates.length === 0) {
    return { updated: 0, skipped: 0 };
  }

  const db = getAdminFirestore();
  let updated = 0;
  let skipped = 0;
  const ts = nowIso();

  for (const item of updates) {
    const ref = db.collection(COLLECTIONS.vendas).doc(item.vendaId);
    const snap = await ref.get();
    if (!snap.exists) {
      skipped += 1;
      continue;
    }

    const current = normalizeVendaFields(snap.data() as VendaDoc);
    if (current.statusOperacional === item.statusOperacional) {
      skipped += 1;
      continue;
    }

    const isNovoCancelamento =
      item.statusOperacional === "CANCELADO" && current.statusOperacional !== "CANCELADO";
    if (isNovoCancelamento) {
      if (
        item.parcelasPagasCancelamento === undefined ||
        item.parcelasPagasCancelamento === null
      ) {
        throw new Error(
          `Venda ${current.numeroContrato}: informe PARCELAS_PAGAS para cancelamentos importados.`,
        );
      }
      if (
        !Number.isInteger(item.parcelasPagasCancelamento) ||
        item.parcelasPagasCancelamento < 0
      ) {
        throw new Error(
          `Venda ${current.numeroContrato}: PARCELAS_PAGAS inválido.`,
        );
      }
    }

    await ref.update({
      statusOperacional: item.statusOperacional,
      status: item.statusOperacional,
      updatedAt: ts,
      ...(isNovoCancelamento
        ? { parcelasPagasCancelamento: item.parcelasPagasCancelamento }
        : {}),
    });
    updated += 1;

    if (isNovoCancelamento && item.parcelasPagasCancelamento !== undefined) {
      await aplicarEstornoCancelamentoVenda(item.vendaId, item.parcelasPagasCancelamento);
    }
  }

  return { updated, skipped };
}
