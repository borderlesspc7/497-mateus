"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { listPlanosMiniByAdministradora } from "@/actions/planos";
import { updateVenda } from "@/actions/vendas";
import { CurrencyInput } from "@/components/form/MaskedInputs";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { formControlClass, panelClass } from "@/components/ui/list-panel-classes";
import type { AdministradoraMini, PlanoMini, VendaRow } from "@/lib/types/domain";
import {
  formatCentavosToCurrencyInput,
  parseCurrencyToCentavos,
} from "@/lib/validators/currency";

type EditarVendaFormProps = {
  item: VendaRow;
  administradoras: AdministradoraMini[];
  initialPlanos: PlanoMini[];
};

function dateToInputValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = String(d.getUTCFullYear());
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function EditarVendaForm({
  item,
  administradoras,
  initialPlanos,
}: EditarVendaFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [valorTouched, setValorTouched] = useState(false);
  const [planos, setPlanos] = useState<PlanoMini[]>(initialPlanos);

  const [form, setForm] = useState({
    administradoraId: item.administradoraId,
    planoId: item.planoId ?? "",
    titulo: item.titulo,
    status: item.status,
    valor: formatCentavosToCurrencyInput(item.valorCentavos),
    dataVenda: dateToInputValue(item.dataVenda),
    descricao: item.descricao ?? "",
    observacoes: item.observacoes ?? "",
  });

  useEffect(() => {
    if (!form.administradoraId) {
      setPlanos([]);
      return;
    }
    if (form.administradoraId === item.administradoraId) {
      setPlanos(initialPlanos);
      return;
    }
    let alive = true;
    void listPlanosMiniByAdministradora(form.administradoraId)
      .then((data) => {
        if (!alive) return;
        setPlanos(data);
        setForm((p) => {
          if (!p.planoId) return p;
          return data.some((x) => x.id === p.planoId) ? p : { ...p, planoId: "" };
        });
      })
      .catch(() => {
        if (!alive) return;
        setPlanos([]);
      });
    return () => {
      alive = false;
    };
  }, [form.administradoraId, item.administradoraId, initialPlanos]);

  const valorError = useMemo(() => {
    if (!valorTouched && !form.valor) return null;
    if (!form.valor.trim()) return null;
    try {
      parseCurrencyToCentavos(form.valor);
      return null;
    } catch {
      return "Valor inválido.";
    }
  }, [form.valor, valorTouched]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setValorTouched(true);
    setSaving(true);
    setError(null);

    if (valorError) {
      setError(valorError);
      setSaving(false);
      return;
    }

    let valorCentavos: number | null = null;
    try {
      valorCentavos = form.valor.trim() ? parseCurrencyToCentavos(form.valor) : null;
    } catch {
      setError("Valor inválido.");
      setSaving(false);
      return;
    }

    const trimOrNull = (s: string) => {
      const t = s.trim();
      return t ? t : null;
    };

    try {
      await updateVenda(item.id, {
        administradoraId: form.administradoraId,
        planoId: form.planoId.trim() ? form.planoId.trim() : null,
        titulo: form.titulo.trim(),
        status: form.status,
        valorCentavos,
        dataVenda: form.dataVenda ? new Date(`${form.dataVenda}T00:00:00.000Z`) : null,
        descricao: trimOrNull(form.descricao),
        observacoes: trimOrNull(form.observacoes),
      });
      router.push("/vendas");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Vendas", href: "/vendas" },
          { label: "Editar" },
        ]}
        title={item.titulo}
        description="Atualize administradora, plano, status, valores e detalhes da venda."
        actions={
          <Link href="/vendas" className={backLinkClass()}>
            Voltar à lista
          </Link>
        }
      />

      <form onSubmit={(e) => void onSave(e)} className={`${panelClass()} p-6`}>
        <div className="text-sm font-medium">Dados da venda</div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <div className="mb-1 text-xs font-medium text-zinc-600">
              Administradora <span className="text-red-600"> *</span>
            </div>
            <select
              value={form.administradoraId}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  administradoraId: e.target.value,
                  planoId: "",
                }))
              }
              className={formControlClass()}
            >
              {administradoras.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome} ({a.cnpj})
                </option>
              ))}
            </select>
          </label>

          <label className="block md:col-span-2">
            <div className="mb-1 text-xs font-medium text-zinc-600">Plano (opcional)</div>
            <select
              value={form.planoId}
              onChange={(e) => setForm((p) => ({ ...p, planoId: e.target.value }))}
              className={formControlClass()}
              disabled={!form.administradoraId || planos.length === 0}
            >
              <option value="">Nenhum</option>
              {planos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} — {p.tipoBem}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="mb-1 text-xs font-medium text-zinc-600">
              Título <span className="text-red-600">*</span>
            </div>
            <input
              value={form.titulo}
              onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
              className={formControlClass()}
            />
          </label>

          <label className="block">
            <div className="mb-1 text-xs font-medium text-zinc-600">Status</div>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({ ...p, status: e.target.value as VendaRow["status"] }))
              }
              className={formControlClass()}
            >
              <option value="RASCUNHO">Rascunho</option>
              <option value="ENVIADA">Enviada</option>
              <option value="FECHADA">Fechada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </label>

          <CurrencyInput
            label="Valor"
            value={form.valor}
            onChange={(v) => setForm((p) => ({ ...p, valor: v }))}
            error={valorTouched ? valorError : null}
          />

          <label className="block">
            <div className="mb-1 text-xs font-medium text-zinc-600">Data da venda</div>
            <input
              type="date"
              value={form.dataVenda}
              onChange={(e) => setForm((p) => ({ ...p, dataVenda: e.target.value }))}
              className={formControlClass()}
            />
          </label>
        </div>

        <div className="mt-8 text-sm font-medium">Detalhes</div>
        <div className="mt-3 grid gap-4">
          <label className="block">
            <div className="mb-1 text-xs font-medium text-zinc-600">Descrição</div>
            <textarea
              value={form.descricao}
              onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
              className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-900 shadow-sm outline-none focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-300/50"
            />
          </label>
          <label className="block">
            <div className="mb-1 text-xs font-medium text-zinc-600">Observações</div>
            <textarea
              value={form.observacoes}
              onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
              className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-900 shadow-sm outline-none focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-300/50"
            />
          </label>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>
    </>
  );
}
