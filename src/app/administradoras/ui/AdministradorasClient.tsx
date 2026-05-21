"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { deleteAdministradora } from "@/actions/administradoras";
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
import type { AdministradoraRow } from "@/lib/types/domain";

type AdministradorasClientProps = {
  initialItems: AdministradoraRow[];
};

export default function AdministradorasClient({ initialItems }: AdministradorasClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((a) => {
      const hay = `${a.nome} ${a.cnpj} ${a.email ?? ""} ${a.telefone ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  async function onDelete(id: string) {
    if (!confirm("Excluir administradora?")) return;
    setError(null);
    setDeletingId(id);
    try {
      await deleteAdministradora(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <DataListPanel
      toolbar={
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, CNPJ, e-mail..."
            className={formControlClass("lg")}
          />
          <Link href="/administradoras/nova" className={primaryActionClass()}>
            Nova administradora
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
              <th className={tableHeadCellClass()}>CNPJ</th>
              <th className={tableHeadCellClass()}>Contato</th>
              <th className={tableHeadCellClass()}>Cidade/UF</th>
              <th className={tableHeadCellClass()}>Criado em</th>
              <th className={`${tableHeadCellClass()} pr-0 text-right`}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td className={tableEmptyCellClass()} colSpan={6}>
                  {items.length === 0
                    ? "Nenhuma administradora cadastrada."
                    : "Nenhum resultado para a busca atual."}
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.id}>
                  <td className={`${tableCellClass()} font-medium text-zinc-900`}>{a.nome}</td>
                  <td className={`${tableCellClass()} whitespace-nowrap`}>{a.cnpj}</td>
                  <td className={tableCellClass()}>
                    <div className="leading-5">
                      <div className="text-zinc-800">{a.contatoPrincipal || "—"}</div>
                      <div className="text-xs text-zinc-500">{a.email || "—"}</div>
                    </div>
                  </td>
                  <td className={tableCellClass()}>
                    {a.enderecoCidade || "—"}
                    {a.enderecoUf ? `/${a.enderecoUf}` : ""}
                  </td>
                  <td className={`${tableCellClass()} whitespace-nowrap`}>
                    {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className={`${tableCellClass()} pr-0 text-right`}>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link
                        href={`/planos?administradoraId=${encodeURIComponent(a.id)}`}
                        className={secondaryActionClass()}
                      >
                        Planos
                      </Link>
                      <Link href={`/administradoras/${a.id}`} className={secondaryActionClass()}>
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => void onDelete(a.id)}
                        disabled={deletingId === a.id}
                        className={dangerActionClass()}
                      >
                        {deletingId === a.id ? "Excluindo..." : "Excluir"}
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
