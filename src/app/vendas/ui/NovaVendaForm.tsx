"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { listPlanosMiniByAdministradora } from "@/actions/planos";
import { createVenda } from "@/actions/vendas";
import { CurrencyInput } from "@/components/form/MaskedInputs";
import { formControlClass, panelClass } from "@/components/ui/list-panel-classes";
import type { AdministradoraMini, ConsorciadoMini, PlanoMini } from "@/lib/types/domain";
import { parseCurrencyToCentavos } from "@/lib/validators/currency";

type FormState = {
  consorciadoId: string;
  administradoraId: string;
  planoId: string;
  titulo: string;
  status: "RASCUNHO" | "ENVIADA" | "FECHADA" | "CANCELADA";
  valor: string;
  dataVenda: string;
  descricao: string;
  observacoes: string;
};

type NovaVendaFormProps = {
  administradoras: AdministradoraMini[];
  consorciados: ConsorciadoMini[];
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-zinc-600">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </div>
      <input
        type={type ?? "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={formControlClass()}
      />
    </label>
  );
}

export default function NovaVendaForm({ administradoras, consorciados }: NovaVendaFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    consorciadoId: consorciados[0]?.id ?? "",
    administradoraId: administradoras[0]?.id ?? "",
    planoId: "",
    titulo: "",
    status: "RASCUNHO",
    valor: "",
    dataVenda: "",
    descricao: "",
    observacoes: "",
  });
  const [planos, setPlanos] = useState<PlanoMini[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [valorTouched, setValorTouched] = useState(false);

  useEffect(() => {
    if (!form.administradoraId) {
      setPlanos([]);
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
  }, [form.administradoraId]);

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValorTouched(true);
    setError(null);

    if (valorError) {
      setError(valorError);
      return;
    }

    let valorCentavos: number | null = null;
    try {
      valorCentavos = form.valor.trim() ? parseCurrencyToCentavos(form.valor) : null;
    } catch {
      setError("Valor inválido.");
      return;
    }

    const trimOrNull = (s: string) => {
      const t = s.trim();
      return t ? t : null;
    };

    if (!form.titulo.trim()) {
      setError("Informe o título da venda.");
      return;
    }
    if (!form.consorciadoId.trim()) {
      setError("Selecione um consorciado.");
      return;
    }

    setSaving(true);
    try {
      await createVenda({
        consorciadoId: form.consorciadoId,
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
    <form onSubmit={(e) => void onSubmit(e)} className={`${panelClass()} p-6`}>
      <div className="text-sm font-medium">Dados da venda</div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <div className="mb-1 text-xs font-medium text-zinc-600">
            Consorciado <span className="text-red-600"> *</span>
          </div>
          <select
            value={form.consorciadoId}
            onChange={(e) => setForm((p) => ({ ...p, consorciadoId: e.target.value }))}
            className={formControlClass()}
            disabled={consorciados.length === 0}
          >
            {consorciados.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} ({c.documento})
              </option>
            ))}
          </select>
          {consorciados.length === 0 ? (
            <div className="mt-2 text-xs text-zinc-500">
              Você precisa cadastrar um consorciado antes.{" "}
              <Link
                href="/consorciados/nova"
                className="font-medium text-zinc-800 underline-offset-2 hover:underline"
              >
                Novo consorciado
              </Link>
            </div>
          ) : null}
        </label>

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
            disabled={administradoras.length === 0}
          >
            {administradoras.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome} ({a.cnpj})
              </option>
            ))}
          </select>
          {administradoras.length === 0 ? (
            <div className="mt-2 text-xs text-zinc-500">
              Você precisa cadastrar uma administradora antes.{" "}
              <Link
                href="/administradoras/nova"
                className="font-medium text-zinc-800 underline-offset-2 hover:underline"
              >
                Nova administradora
              </Link>
            </div>
          ) : null}
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
          {form.administradoraId && planos.length === 0 ? (
            <div className="mt-2 text-xs text-zinc-500">
              Nenhum plano para esta administradora.{" "}
              <Link
                href={`/planos/nova?administradoraId=${encodeURIComponent(form.administradoraId)}`}
                className="font-medium text-zinc-800 underline-offset-2 hover:underline"
              >
                Cadastrar plano
              </Link>
            </div>
          ) : null}
        </label>

        <Field
          label="Título"
          required
          value={form.titulo}
          onChange={(v) => setForm((p) => ({ ...p, titulo: v }))}
          placeholder="Ex.: Venda consórcio Auto"
        />

        <label className="block">
          <div className="mb-1 text-xs font-medium text-zinc-600">Status</div>
          <select
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as FormState["status"] }))}
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

        <Field
          label="Data da venda"
          type="date"
          value={form.dataVenda}
          onChange={(v) => setForm((p) => ({ ...p, dataVenda: v }))}
        />
      </div>

      <div className="mt-8 text-sm font-medium">Detalhes</div>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <div className="mb-1 text-xs font-medium text-zinc-600">Descrição</div>
          <textarea
            value={form.descricao}
            onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
            className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-900 shadow-sm outline-none focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-300/50"
          />
        </label>
        <label className="block md:col-span-2">
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
          type="button"
          onClick={() => router.push("/vendas")}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          disabled={saving || administradoras.length === 0 || consorciados.length === 0}
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}
