"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  periodoAtual,
  periodoLabel,
  periodoMaximoNavegacao,
  shiftPeriodo,
} from "@/lib/periodo";
import { secondaryActionClass } from "@/components/ui/list-panel-classes";

export type NavegacaoPeriodoProps = {
  periodoAtualProp: string;
  onChange: (periodo: string) => void;
};

export function NavegacaoPeriodo({ periodoAtualProp, onChange }: NavegacaoPeriodoProps) {
  const maxPeriodo = periodoMaximoNavegacao();
  const anterior = shiftPeriodo(periodoAtualProp, -1);
  const proximo = shiftPeriodo(periodoAtualProp, 1);
  const podeProximo = proximo <= maxPeriodo;
  const hoje = periodoAtual();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={secondaryActionClass()}
          onClick={() => onChange(anterior)}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[10rem] text-center text-sm font-semibold text-zinc-900">
          {periodoLabel(periodoAtualProp)}
        </span>
        <button
          type="button"
          className={secondaryActionClass()}
          onClick={() => podeProximo && onChange(proximo)}
          disabled={!podeProximo}
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      {periodoAtualProp !== hoje ? (
        <button
          type="button"
          className="text-sm font-medium text-sky-700 hover:text-sky-800"
          onClick={() => onChange(hoje)}
        >
          Mês atual
        </button>
      ) : null}
    </div>
  );
}
