import { z } from "zod";
import { parseCurrencyToCentavos } from "@/lib/validators/currency";

const statusOperacionalSchema = z.enum(["ATIVO", "INADIMPLENTE", "CANCELADO"]);

export const novoConsorciadoSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do consorciado."),
  cpf_cnpj: z.string().trim().min(1, "Informe o CPF ou CNPJ."),
  telefone: z.string().trim().min(1, "Informe o telefone."),
  email: z.string().trim().email("Informe um e-mail válido."),
});

export const novaVendaOperacionalSchema = z.object({
  numeroContrato: z.string().trim().min(1, "Informe o número do contrato."),
  grupo: z.string().trim().min(1, "Informe o grupo."),
  cota: z.string().trim().min(1, "Informe a cota."),
  dataVencimento: z
    .number()
    .int("Informe o dia de vencimento entre 1 e 31.")
    .min(1, "Informe o dia de vencimento entre 1 e 31.")
    .max(31, "Informe o dia de vencimento entre 1 e 31."),
  valorCentavos: z
    .number()
    .int("Informe o valor do crédito.")
    .positive("O valor do crédito deve ser maior que zero."),
  dataFechamento: z.string().trim().min(1, "Informe a data de fechamento."),
  mesAnoFechamento: z
    .string()
    .trim()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Informe o mês/ano de fechamento."),
  administradoraId: z.string().trim().min(1, "Selecione a administradora."),
  planoId: z.string().trim().min(1, "Selecione o plano."),
  equipeId: z.string().trim().min(1, "Selecione a equipe."),
  vendedorId: z.string().trim().min(1, "Selecione o vendedor."),
  statusOperacional: statusOperacionalSchema,
});

export type NovaVendaOperacionalInput = z.infer<typeof novaVendaOperacionalSchema>;
export type NovoConsorciadoInput = z.infer<typeof novoConsorciadoSchema>;

export function parseValorCreditoToCentavos(valor: string): number {
  const centavos = parseCurrencyToCentavos(valor.trim());
  if (centavos === null || centavos <= 0) {
    throw new Error("Informe o valor do crédito.");
  }
  return centavos;
}

export function buildVendaTitulo(numeroContrato: string, grupo: string, cota: string): string {
  return `Contrato ${numeroContrato} — Grupo ${grupo} / Cota ${cota}`;
}

export function formatZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Dados inválidos.";
}
