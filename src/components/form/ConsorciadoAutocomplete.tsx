"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { getConsorciado, searchConsorciadosMini } from "@/actions/consorciados";
import { formControlClass } from "@/components/ui/list-panel-classes";
import type { ConsorciadoMini } from "@/lib/types/domain";

type ConsorciadoAutocompleteProps = {
  value: string;
  onChange: (consorciadoId: string) => void;
  onSelect?: (consorciado: ConsorciadoMini) => void;
  disabled?: boolean;
  required?: boolean;
  /** Lista estática local — omita quando `remoteSearch` estiver ativo. */
  consorciados?: ConsorciadoMini[];
  /** Consulta o Firestore com debounce (recomendado em Nova Venda). */
  remoteSearch?: boolean;
};

const SEARCH_DEBOUNCE_MS = 300;

export function ConsorciadoAutocomplete({
  consorciados = [],
  value,
  onChange,
  onSelect,
  disabled = false,
  required = false,
  remoteSearch = false,
}: ConsorciadoAutocompleteProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [remoteResults, setRemoteResults] = useState<ConsorciadoMini[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [resolvedSelected, setResolvedSelected] = useState<ConsorciadoMini | null>(null);

  const selected = useMemo(() => {
    if (remoteSearch) {
      return (
        remoteResults.find((c) => c.id === value) ??
        consorciados.find((c) => c.id === value) ??
        resolvedSelected
      );
    }
    return consorciados.find((c) => c.id === value) ?? null;
  }, [consorciados, remoteResults, remoteSearch, resolvedSelected, value]);

  const filtered = useMemo(() => {
    if (remoteSearch) return remoteResults;
    const q = query.trim().toLowerCase();
    if (!q) return consorciados.slice(0, 12);
    return consorciados
      .filter((c) => {
        const hay = `${c.nome} ${c.cpf_cnpj}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 12);
  }, [consorciados, query, remoteResults, remoteSearch]);

  const runRemoteSearch = useCallback(async (searchQuery: string) => {
    setRemoteLoading(true);
    try {
      const results = await searchConsorciadosMini(searchQuery);
      setRemoteResults(results);
    } catch {
      setRemoteResults([]);
    } finally {
      setRemoteLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!remoteSearch || !value || selected) return;
    let alive = true;
    void getConsorciado(value)
      .then((row) => {
        if (!alive || !row) return;
        setResolvedSelected({
          id: row.id,
          nome: row.nome,
          cpf_cnpj: row.cpf_cnpj,
          telefone: row.telefone,
        });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [remoteSearch, selected, value]);

  useEffect(() => {
    if (selected) {
      setQuery(`${selected.nome} (${selected.cpf_cnpj})`);
    } else if (!value) {
      setQuery("");
    }
  }, [selected, value]);

  useEffect(() => {
    if (!remoteSearch) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runRemoteSearch(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, remoteSearch, runRemoteSearch]);

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
    onSelect?.(item);
    setResolvedSelected(item);
    setQuery(`${item.nome} (${item.cpf_cnpj})`);
    setIsOpen(false);
  }

  function onInputChange(next: string) {
    setQuery(next);
    setIsOpen(true);
    if (!next.trim()) {
      onChange("");
      setResolvedSelected(null);
    }
  }

  function onFocus() {
    setIsOpen(true);
    if (remoteSearch && remoteResults.length === 0 && !remoteLoading) {
      void runRemoteSearch(query);
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen && (event.key === "ArrowDown" || event.key === "Enter")) {
      setIsOpen(true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
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

  const inputDisabled = disabled || (!remoteSearch && consorciados.length === 0);

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
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        placeholder="Buscar por nome ou CPF/CNPJ..."
        className={formControlClass()}
        disabled={inputDisabled}
        required={required}
        autoComplete="off"
      />
      {remoteSearch && remoteLoading ? (
        <p className="mt-1 text-xs text-zinc-500">Consultando base de consorciados...</p>
      ) : null}
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
      {isOpen && !remoteLoading && query.trim() && filtered.length === 0 ? (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500 shadow-lg">
          Nenhum consorciado encontrado. Use &quot;Criar Novo Consorciado&quot; se for um cadastro inédito.
        </div>
      ) : null}
    </div>
  );
}