"use server";

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requireGerenteOrAdmin } from "@/lib/auth/server";
import {
  batchUpdateVendaStatus,
  buildVendaContratoLookupMap,
} from "@/lib/firestore/vendas-import";
import { newId } from "@/lib/firestore/types";
import type {
  ImportConfirmItem,
  ImportConfirmResult,
  ImportPreviewInvalid,
  ImportPreviewMatched,
  ImportPreviewNotFound,
  ImportPreviewResult,
  ImportRowInput,
} from "@/lib/importacao/types";
import { normalizeContrato, parseImportStatus } from "@/lib/importacao/status";
import type { StatusOperacionalCota } from "@/lib/types/domain";

const MAX_IMPORT_ROWS = 10_000;

function revalidateImportacaoPaths() {
  revalidatePath("/");
  revalidatePath("/vendas");
  revalidatePath("/controle/inadimplencia");
  revalidatePath("/controle/inconsistencia");
  revalidatePath("/importacao");
  revalidatePath("/comissoes");
}

function assertValidStatus(status: string): asserts status is StatusOperacionalCota {
  if (!parseImportStatus(status)) {
    throw new Error(`Status inválido: ${status}`);
  }
}

export async function previewImportacaoStatus(
  rows: ImportRowInput[],
): Promise<ImportPreviewResult> {
  await requireGerenteOrAdmin();

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("Nenhum registro enviado para pré-visualização.");
  }
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new Error(`Limite de ${MAX_IMPORT_ROWS.toLocaleString("pt-BR")} linhas por importação.`);
  }

  const lookup = await buildVendaContratoLookupMap();
  const matched: ImportPreviewMatched[] = [];
  const notFound: ImportPreviewNotFound[] = [];
  const invalid: ImportPreviewInvalid[] = [];

  for (const row of rows) {
    const numeroContrato = normalizeContrato(row.numeroContrato);
    const statusOperacional = parseImportStatus(row.statusOperacional);

    if (!numeroContrato) {
      invalid.push({
        kind: "invalid",
        linha: row.linha,
        numeroContrato: null,
        error: "Número do contrato vazio ou inválido.",
      });
      continue;
    }

    if (!statusOperacional) {
      invalid.push({
        kind: "invalid",
        linha: row.linha,
        numeroContrato,
        error: `Status inválido: ${String(row.statusOperacional)}`,
      });
      continue;
    }

    const venda = lookup.get(numeroContrato);
    if (!venda) {
      notFound.push({
        kind: "not_found",
        linha: row.linha,
        numeroContrato,
        statusNovo: statusOperacional,
      });
      continue;
    }

    if (
      statusOperacional === "CANCELADO" &&
      (row.parcelasPagasCancelamento === undefined || row.parcelasPagasCancelamento === null)
    ) {
      invalid.push({
        kind: "invalid",
        linha: row.linha,
        numeroContrato,
        error: "Informe PARCELAS_PAGAS para vendas canceladas.",
      });
      continue;
    }

    matched.push({
      kind: "matched",
      linha: row.linha,
      numeroContrato,
      statusAtual: venda.statusOperacional,
      statusNovo: statusOperacional,
      vendaId: venda.id,
      willUpdate: venda.statusOperacional !== statusOperacional,
      parcelasPagasCancelamento: row.parcelasPagasCancelamento,
    });
  }

  const toUpdate = matched.filter((item) => item.willUpdate).length;
  const unchanged = matched.length - toUpdate;

  return {
    matched,
    notFound,
    invalid,
    summary: {
      total: rows.length,
      toUpdate,
      notFound: notFound.length,
      unchanged,
      invalid: invalid.length,
    },
  };
}

export async function confirmImportacaoStatus(
  updates: ImportConfirmItem[],
): Promise<ImportConfirmResult> {
  const sessionUser = await requireGerenteOrAdmin();

  if (!Array.isArray(updates) || updates.length === 0) {
    throw new Error("Nenhuma alteração selecionada para importação.");
  }
  if (updates.length > MAX_IMPORT_ROWS) {
    throw new Error(`Limite de ${MAX_IMPORT_ROWS.toLocaleString("pt-BR")} atualizações por importação.`);
  }

  for (const item of updates) {
    if (!item.vendaId?.trim()) {
      throw new Error("Identificador de venda inválido na confirmação.");
    }
    assertValidStatus(item.statusOperacional);
    if (item.statusOperacional === "CANCELADO" && item.parcelasPagasCancelamento === undefined) {
      throw new Error("Cancelamentos importados exigem PARCELAS_PAGAS.");
    }
  }

  const result = await batchUpdateVendaStatus(updates);

  if (result.updated > 0) {
    await writeAuditLog({
      userId: sessionUser.uid,
      acao: `importacao.status.lote_${result.updated}`,
      documentoId: newId(),
    });
  }

  revalidateImportacaoPaths();
  return result;
}
