import type { StatusOperacionalCota } from "@/lib/types/domain";

const STATUS_CONFIG: Record<
  StatusOperacionalCota,
  { label: string; className: string }
> = {
  ATIVO: {
    label: "Ativo",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  INADIMPLENTE: {
    label: "Inadimplente",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  CANCELADO: {
    label: "Cancelado",
    className: "border-red-200 bg-red-50 text-red-800",
  },
};

type StatusBadgeProps = {
  status: StatusOperacionalCota;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={[
        "inline-flex h-7 items-center rounded-full border px-3 text-xs font-semibold tracking-wide",
        config.className,
      ].join(" ")}
    >
      {config.label}
    </span>
  );
}
