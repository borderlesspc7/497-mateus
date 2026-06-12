import type { StatusOperacionalCota } from "@/lib/types/domain";

type WhatsAppTemplateInput = {
  nomeCliente: string;
  numeroContrato: string;
  statusOperacional: StatusOperacionalCota;
};

const STATUS_LABELS: Record<StatusOperacionalCota, string> = {
  ATIVO: "ativo",
  INADIMPLENTE: "inadimplente",
  CANCELADO: "cancelado",
};

export function buildWhatsAppMessage({
  nomeCliente,
  numeroContrato,
  statusOperacional,
}: WhatsAppTemplateInput): string {
  const nome = nomeCliente.trim() || "cliente";
  const contratoRef = numeroContrato.trim() || "seu contrato";

  if (statusOperacional === "INADIMPLENTE") {
    return `Olá ${nome}, vimos que a sua cota referente ao contrato ${contratoRef} possui uma pendência de pagamento. Podemos ajudá-lo(a) a regularizar a situação?`;
  }

  if (statusOperacional === "CANCELADO") {
    return `Olá ${nome}, entramos em contato sobre a cota do contrato ${contratoRef}, que consta como cancelada. Caso precise de esclarecimentos, estamos à disposição.`;
  }

  return `Olá ${nome}, entramos em contato sobre a sua cota referente ao contrato ${contratoRef} (status: ${STATUS_LABELS[statusOperacional]}). Podemos conversar?`;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const params = new URLSearchParams({
    phone,
    text: message,
  });
  return `https://api.whatsapp.com/send?${params.toString()}`;
}
