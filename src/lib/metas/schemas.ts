import { z } from "zod";

export const periodoSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Período inválido (YYYY-MM).");

export const criarMetaSchema = z.object({
  periodo: periodoSchema,
  tipo: z.enum(["VENDEDOR", "EQUIPE"]),
  referenciaId: z.string().min(1, "Selecione a referência."),
  metaVendas: z.number().int().positive("Meta de vendas deve ser maior que zero."),
  metaCreditoCentavos: z.number().int().positive("Meta de crédito deve ser maior que zero."),
  metaAtivacao: z.number().min(0).max(100, "Meta de ativação deve estar entre 0 e 100."),
});

export const editarMetaSchema = z.object({
  metaVendas: z.number().int().positive("Meta de vendas deve ser maior que zero."),
  metaCreditoCentavos: z.number().int().positive("Meta de crédito deve ser maior que zero."),
  metaAtivacao: z.number().min(0).max(100, "Meta de ativação deve estar entre 0 e 100."),
});
