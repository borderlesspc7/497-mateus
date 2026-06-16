"use client";

import {
  EMPTY_CONSORCIADO_SEARCH_FILTERS,
  hasActiveConsorciadoSearchFilters,
  type ConsorciadoSearchFilters,
} from "@/lib/consorciados/filter-consorciados";
import { SummaryChip } from "@/components/ui/SummaryChip";
import { formControlClass, panelInsetClass, secondaryActionClass } from "@/components/ui/list-panel-classes";

type ConsorciadoAdvancedSearchProps = {
  filters: ConsorciadoSearchFilters;
  onChange: (filters: ConsorciadoSearchFilters) => void;
  resultCount: number;
  totalCount: number;
};

function SearchField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  hint?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-medium text-zinc-600">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={formControlClass()}
      />
      {hint ? <span className="mt-1 block text-[11px] text-zinc-400">{hint}</span> : null}
    </label>
  );
}

export function ConsorciadoAdvancedSearch({
  filters,
  onChange,
  resultCount,
  totalCount,
}: ConsorciadoAdvancedSearchProps) {
  const hasFilters = hasActiveConsorciadoSearchFilters(filters);

  function update<K extends keyof ConsorciadoSearchFilters>(key: K, value: string) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className={`rounded-2xl border border-zinc-200 bg-zinc-50/60 ${panelInsetClass()}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200/80 px-4 py-3.5 sm:px-5">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Busca avançada</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Filtre por dados do consorciado ou pelos contratos/cotas vinculados.
          </p>
        </div>
        {hasFilters ? (
          <button
            type="button"
            onClick={() => onChange(EMPTY_CONSORCIADO_SEARCH_FILTERS)}
            className={secondaryActionClass()}
          >
            Limpar filtros
          </button>
        ) : null}
      </div>

      <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-3">
        <SearchField
          label="Nome do consorciado"
          value={filters.nome}
          onChange={(value) => update("nome", value)}
          placeholder="Ex.: Maria Silva"
        />
        <SearchField
          label="CPF / CNPJ"
          value={filters.cpf}
          onChange={(value) => update("cpf", value)}
          placeholder="000.000.000-00"
          hint="Busca parcial — aceita com ou sem pontuação."
        />
        <SearchField
          label="Número do contrato"
          value={filters.contrato}
          onChange={(value) => update("contrato", value)}
          placeholder="Ex.: 123456"
          hint="Chave matriz do produto/cota."
        />
        <SearchField
          label="Grupo"
          value={filters.grupo}
          onChange={(value) => update("grupo", value)}
          placeholder="Ex.: A100"
        />
        <SearchField
          label="Cota"
          value={filters.cota}
          onChange={(value) => update("cota", value)}
          placeholder="Ex.: 025"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-zinc-200/80 px-4 py-3 sm:px-5">
        <SummaryChip
          label={hasFilters ? "Resultados" : "Consorciados"}
          value={hasFilters ? resultCount : totalCount}
        />
        {hasFilters && resultCount !== totalCount ? (
          <SummaryChip label="Total na base" value={totalCount} tone="neutral" />
        ) : null}
      </div>
    </div>
  );
}
