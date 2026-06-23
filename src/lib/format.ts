import {
  formatCentavosToCurrencyInput,
  formatMoneyPtBrFromCentavos,
} from "@/lib/validators/currency";

/** Exibe valor monetário a partir de centavos (R$ 1.234,56). */
export function formatarMoeda(centavos: number): string {
  return formatMoneyPtBrFromCentavos(centavos);
}

/** Formata centavos para campo de input monetário (1.234,56). */
export function formatarMoedaInput(centavos: number): string {
  return formatCentavosToCurrencyInput(centavos);
}

/** Formata percentual com uma casa decimal. */
export function formatarPercentual(valor: number): string {
  return `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 0 })}%`;
}
