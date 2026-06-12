import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { ImportRowInput } from "@/lib/importacao/types";
import {
  CONTRATO_COLUMN_CANDIDATES,
  PARCELAS_PAGAS_COLUMN_CANDIDATES,
  STATUS_COLUMN_CANDIDATES,
  findColumnKey,
  normalizeContrato,
  parseImportStatus,
  parseParcelasPagas,
} from "@/lib/importacao/status";

export type ParseImportFileResult = {
  rows: ImportRowInput[];
  errors: string[];
  warnings: string[];
};

type RawRow = Record<string, unknown>;

function parseRawRows(rawRows: RawRow[]): ParseImportFileResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (rawRows.length === 0) {
    return { rows: [], errors: ["O arquivo está vazio ou não contém linhas de dados."], warnings };
  }

  const headers = Object.keys(rawRows[0] ?? {});
  const contratoKey = findColumnKey(headers, CONTRATO_COLUMN_CANDIDATES);
  const statusKey = findColumnKey(headers, STATUS_COLUMN_CANDIDATES);
  const parcelasKey = findColumnKey(headers, PARCELAS_PAGAS_COLUMN_CANDIDATES);

  if (!contratoKey) {
    errors.push('Coluna "CONTRATO" não encontrada. Verifique o cabeçalho do arquivo.');
  }
  if (!statusKey) {
    errors.push('Coluna "STATUS" não encontrada. Verifique o cabeçalho do arquivo.');
  }
  if (errors.length > 0) {
    return { rows: [], errors, warnings };
  }

  const rows: ImportRowInput[] = [];
  const seenContratos = new Map<string, number>();

  rawRows.forEach((raw, index) => {
    const linha = index + 2;
    const contrato = normalizeContrato(raw[contratoKey!]);
    const status = parseImportStatus(raw[statusKey!]);

    if (!contrato) {
      errors.push(`Linha ${linha}: contrato vazio ou inválido.`);
      return;
    }
    if (!status) {
      errors.push(
        `Linha ${linha}: status inválido "${String(raw[statusKey!] ?? "")}". Use ATIVO, INADIMPLENTE ou CANCELADO.`,
      );
      return;
    }

    const parcelasPagas = parcelasKey ? parseParcelasPagas(raw[parcelasKey]) : null;
    if (status === "CANCELADO" && parcelasPagas === null) {
      errors.push(
        `Linha ${linha}: informe PARCELAS_PAGAS para vendas canceladas.`,
      );
      return;
    }

    const previousLine = seenContratos.get(contrato);
    if (previousLine !== undefined) {
      warnings.push(
        `Contrato "${contrato}" duplicado (linhas ${previousLine} e ${linha}). Será usado o valor da última ocorrência.`,
      );
    }
    seenContratos.set(contrato, linha);

    rows.push({
      numeroContrato: contrato,
      statusOperacional: status,
      linha,
      parcelasPagasCancelamento: status === "CANCELADO" ? parcelasPagas ?? undefined : undefined,
    });
  });

  if (rows.length === 0 && errors.length === 0) {
    errors.push("Nenhuma linha válida encontrada no arquivo.");
  }

  return { rows, errors, warnings };
}

function rowsFromCsvText(text: string): Promise<RawRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawRow>(text, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.trim(),
      complete: (result) => {
        if (result.errors.length > 0) {
          const message = result.errors.map((e) => e.message).join("; ");
          reject(new Error(`Erro ao ler CSV: ${message}`));
          return;
        }
        resolve(result.data);
      },
      error: (error: Error) => reject(error),
    });
  });
}

function rowsFromXlsxBuffer(buffer: ArrayBuffer): RawRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "" });
}

function isCsvFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".csv") || file.type === "text/csv";
}

function isXlsxFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.type === "application/vnd.ms-excel"
  );
}

export async function parseImportFile(file: File): Promise<ParseImportFileResult> {
  if (isCsvFile(file)) {
    const text = await file.text();
    const rawRows = await rowsFromCsvText(text);
    return parseRawRows(rawRows);
  }

  if (isXlsxFile(file)) {
    const buffer = await file.arrayBuffer();
    const rawRows = rowsFromXlsxBuffer(buffer);
    return parseRawRows(rawRows);
  }

  return {
    rows: [],
    errors: ["Formato não suportado. Envie um arquivo .csv ou .xlsx."],
    warnings: [],
  };
}
