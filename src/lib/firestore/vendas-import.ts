import { getAdminFirestore } from "@/lib/firebase/admin";
import type { VendaContratoLookup } from "@/lib/firestore/contrato-matriz";
import { aplicarEstornoCancelamentoVenda } from "@/lib/firestore/estorno-cancelamento";
import { normalizeVendaFields } from "@/lib/firestore/legacy";
import { COLLECTIONS, nowIso, type VendaDoc } from "@/lib/firestore/types";
import type { ImportConfirmItem, ImportConfirmResult } from "@/lib/importacao/types";

export type { VendaContratoLookup };

export async function buildVendaContratoLookupMap(): Promise<Map<string, VendaContratoLookup>> {
  const snap = await getAdminFirestore().collection(COLLECTIONS.vendas).get();
  const map = new Map<string, VendaContratoLookup>();

  for (const doc of snap.docs) {
    const data = doc.data() as VendaDoc;
    const normalized = normalizeVendaFields(data);
    const numeroContrato = normalized.numeroContrato;
    if (!numeroContrato) continue;
    map.set(numeroContrato, {
      id: doc.id,
      numeroContrato,
      statusOperacional: normalized.statusOperacional,
    });
  }

  return map;
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
