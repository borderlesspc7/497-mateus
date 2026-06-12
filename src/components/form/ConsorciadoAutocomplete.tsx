"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { formControlClass } from "@/components/ui/list-panel-classes";
import type { ConsorciadoMini } from "@/lib/types/domain";

type ConsorciadoAutocompleteProps = {
  consorciados: ConsorciadoMini[];
  value: string;
  onChange: (consorciadoId: string) => void;
  disabled?: boolean;
  required?: boolean;
};

export function ConsorciadoAutocomplete({
  consorciados,
  value,
  onChange,
  disabled = false,
  required = false,
}: ConsorciadoAutocompleteProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const selected = useMemo(
    () => consorciados.find((c) => c.id === value) ?? null,
    [consorciados, value],
  );

  useEffect(() => {
    if (selected) {
      setQuery(`${selected.nome} (${selected.cpf_cnpj})`);
    } else if (!value) {
      setQuery("");
    }
  }, [selected, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return consorciados.slice(0, 12);
    return consorciados
      .filter((c) => {
        const hay = `${c.nome} ${c.cpf_cnpj}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 12);
  }, [consorciados, query]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [filtered.length, query]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function selectItem(item: ConsorciadoMini) {
    onChange(item.id);
    setQuery(`${item.nome} (${item.cpf_cnpj})`);
    setIsOpen(false);
  }

  function onInputChange(next: string) {
    setQuery(next);
    setIsOpen(true);
    if (!next.trim()) onChange("");
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen && (event.key === "ArrowDown" || event.key === "Enter")) {
      setIsOpen(true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && filtered[highlightIndex]) {
      event.preventDefault();
      selectItem(filtered[highlightIndex]);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-autocomplete="list"
        value={query}
        onChange={(e) => onInputChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Buscar por nome ou CPF/CNPJ..."
        className={formControlClass()}
        disabled={disabled || consorciados.length === 0}
        required={required}
        autoComplete="off"
      />
      {isOpen && filtered.length > 0 ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-xl"
        >
          {filtered.map((item, index) => (
            <li key={item.id} role="option" aria-selected={item.id === value}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectItem(item)}
                className={[
                  "flex w-full flex-col px-3 py-2 text-left text-sm transition-colors",
                  index === highlightIndex ? "bg-zinc-100" : "hover:bg-zinc-50",
                  item.id === value ? "font-medium text-zinc-900" : "text-zinc-700",
                ].join(" ")}
              >
                <span>{item.nome}</span>
                <span className="text-xs text-zinc-500">{item.cpf_cnpj}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {isOpen && query.trim() && filtered.length === 0 ? (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500 shadow-lg">
          Nenhum consorciado encontrado.
        </div>
      ) : null}
    </div>
  );
}
