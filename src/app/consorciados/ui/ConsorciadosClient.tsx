"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  deleteConsorciado,
  listConsorciados,
} from "@/lib/firestore/consorciados-client";
import { DataListPanel } from "@/components/ui/DataListPanel";
import {
  dangerActionClass,
  dataTableClass,
  formControlClass,
  primaryActionClass,
  secondaryActionClass,
  tableCellClass,
  tableEmptyCellClass,
  tableHeadCellClass,
  tableWrapClass,
} from "@/components/ui/list-panel-classes";
import type { ConsorciadoRow } from "@/lib/types/domain";

export default function ConsorciadosClient() {
  const router = useRouter();
  const [items, setItems] = useState<ConsorciadoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    void listConsorciados()
      .then((data) => {
        if (!alive) return;
        setItems(data);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Erro ao carregar consorciados.");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const hay = `${item.nome} ${item.documento} ${item.email} ${item.telefone}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  async function onDelete(id: string) {
    if (!confirm("Excluir consorciado?")) return;
    setError(null);
    setDeletingId(id);
    try {
      await deleteConsorciado(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
        Carregando consorciados...
      </div>
    );
  }

  return (
    <DataListPanel
      toolbar={
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou documento..."
            className={formControlClass("lg")}
          />
          <Link href="/consorciados/nova" className={primaryActionClass()}>
            Novo consorciado
          </Link>
        </>
      }
      error={
        error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null
      }
    >
      <div className={tableWrapClass()}>
        <table className={dataTableClass()}>
          <thead>
            <tr>
              <th className={tableHeadCellClass()}>Nome</th>
              <th className={tableHeadCellClass()}>Documento</th>
              <th className={tableHeadCellClass()}>Telefone</th>
              <th className={tableHeadCellClass()}>E-mail</th>
              <th className={tableHeadCellClass()}>Cadastrado em</th>
              <th className={`${tableHeadCellClass()} pr-0 text-right`}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td className={tableEmptyCellClass()} colSpan={6}>
                  {items.length === 0
                    ? "Nenhum consorciado cadastrado."
                    : "Nenhum resultado para a busca atual."}
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id}>
                  <td className={`${tableCellClass()} font-medium text-zinc-900`}>{item.nome}</td>
                  <td className={tableCellClass()}>{item.documento}</td>
                  <td className={tableCellClass()}>{item.telefone}</td>
                  <td className={tableCellClass()}>{item.email}</td>
                  <td className={`${tableCellClass()} whitespace-nowrap`}>
                    {new Date(item.criadoEm).toLocaleDateString("pt-BR")}
                  </td>
                  <td className={`${tableCellClass()} pr-0 text-right`}>
                    <div className="flex justify-end gap-2">
                      <Link href={`/consorciados/${item.id}`} className={secondaryActionClass()}>
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => void onDelete(item.id)}
                        disabled={deletingId === item.id}
                        className={dangerActionClass()}
                      >
                        {deletingId === item.id ? "Excluindo..." : "Excluir"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DataListPanel>
  );
}
