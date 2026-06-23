const MESES_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

const PERIODO_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isPeriodoValido(periodo: string): boolean {
  return PERIODO_REGEX.test(periodo);
}

/** Converte "YYYY-MM" em intervalo UTC-local do mês (início inclusive, fim inclusive). */
export function parsePeriodo(periodo: string): { inicio: Date; fim: Date } {
  if (!isPeriodoValido(periodo)) {
    throw new Error("Período inválido. Use o formato YYYY-MM.");
  }
  const [yearStr, monthStr] = periodo.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const inicio = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const fim = new Date(year, month, 0, 23, 59, 59, 999);
  return { inicio, fim };
}

export function periodoAtual(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function periodoLabel(periodo: string): string {
  if (!isPeriodoValido(periodo)) return periodo;
  const [yearStr, monthStr] = periodo.split("-");
  const monthIndex = Number(monthStr) - 1;
  return `${MESES_PT[monthIndex]} ${yearStr}`;
}

export function periodoLabelCurto(periodo: string): string {
  if (!isPeriodoValido(periodo)) return periodo;
  const [, monthStr] = periodo.split("-");
  const monthIndex = Number(monthStr) - 1;
  const abrev = MESES_PT[monthIndex].slice(0, 3);
  const year = periodo.slice(2, 4);
  return `${abrev}/${year}`;
}

export function periodosRecentes(n: number): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i < n; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    result.push(`${year}-${month}`);
  }
  return result;
}

export function shiftPeriodo(periodo: string, delta: number): string {
  const { inicio } = parsePeriodo(periodo);
  const d = new Date(inicio.getFullYear(), inicio.getMonth() + delta, 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/** Limite superior: mês atual + 1 (para navegação). */
export function periodoMaximoNavegacao(): string {
  return shiftPeriodo(periodoAtual(), 1);
}

export function podeNavegarPeriodo(periodo: string): boolean {
  if (!isPeriodoValido(periodo)) return false;
  return periodo <= periodoMaximoNavegacao();
}
