"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPlano } from "@/actions/planos";
import { CurrencyInput } from "@/components/form/MaskedInputs";
import { formControlClass, panelClass } from "@/components/ui/list-panel-classes";
import type { AdministradoraMini } from "@/lib/types/domain";
import { parseCurrencyToCentavos } from "@/lib/validators/currency";

type FormState = {
  administradoraId: string;
  nome: string;
  tipoBem: string;
  valorCredito: string;
  regrasComissaoJson: string;
  regrasRecebimentoJson: string;
  regrasEstornoJson: string;
};

type NovoPlanoFormProps = {
  administradoras: AdministradoraMini[];
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-zinc-600">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={formControlClass()}
      />
    </label>
  );
}

export default function NovoPlanoForm({ administradoras }: NovoPlanoFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<FormState>({
    administradoraId: administradoras[0]?.id ?? "",
    nome: "",
    tipoBem: "",
    valorCredito: "",
    regrasComissaoJson: "",
    regrasRecebimentoJson: "",
    regrasEstornoJson: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [valorTouched, setValorTouched] = useState(false);

  useEffect(() => {
    const urlAdm = searchParams.get("administradoraId");
    if (!urlAdm || !administradoras.some((a) => a.id === urlAdm)) return;
    setForm((p) => (p.administradoraId === urlAdm ? p : { ...p, administradoraId: urlAdm }));
  }, [searchParams, administradoras]);

  const valorError = useMemo(() => {
    if (!valorTouched && !form.valorCredito) return null;
    if (!form.valorCredito.trim()) return null;
    try {
      parseCurrencyToCentavos(form.valorCredito);
      return null;
    } catch {
      return "Valor do crédito inválido.";
    }
  }, [form.valorCredito, valorTouched]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValorTouched(true);
    setError(null);

    if (valorError) {
      setError(valorError);
      return;
    }

    let valorCreditoCentavos: number | null = null;
    try {
      valorCreditoCentavos = form.valorCredito.trim()
        ? parseCurrencyToCentavos(form.valorCredito)
        : null;
    } catch {
      setError("Valor do crédito inválido.");
      return;
    }

    const trimOrNull = (s: string) => {
      const t = s.trim();
      return t ? t : null;
    };

    setSaving(true);
    try {
      await createPlano({
        administradoraId: form.administradoraId,
        nome: form.nome.trim(),
        tipoBem: form.tipoBem.trim(),
        valorCreditoCentavos,
        regrasComissaoJson: trimOrNull(form.regrasComissaoJson),
        regrasRecebimentoJson: trimOrNull(form.regrasRecebimentoJson),
        regrasEstornoJson: trimOrNull(form.regrasEstornoJson),
      });
      router.push("/planos");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className={`${panelClass()} p-6`}>
      <div className="text-sm font-medium">Dados do plano</div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <div className="mb-1 text-xs font-medium text-zinc-600">
            Administradora <span className="text-red-600"> *</span>
          </div>
          <select
            value={form.administradoraId}
            onChange={(e) => setForm((p) => ({ ...p, administradoraId: e.target.value }))}
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
              Cadastre uma administradora antes de criar um plano.{" "}
              <Link
                href="/administradoras/nova"
                className="font-medium text-zinc-800 underline-offset-2 hover:underline"
              >
                Nova administradora
              </Link>
            </div>
          ) : null}
        </label>

        <Field
          label="Nome do plano"
          required
          value={form.nome}
          onChange={(v) => setForm((p) => ({ ...p, nome: v }))}
          placeholder="Ex.: Consórcio Imóvel 120x"
        />
        <Field
          label="Tipo de bem"
          required
          value={form.tipoBem}
          onChange={(v) => setForm((p) => ({ ...p, tipoBem: v }))}
          placeholder="Ex.: Imóvel, Veículo, Serviço"
        />
        <div className="md:col-span-2">
          <CurrencyInput
            label="Valor do crédito"
            value={form.valorCredito}
            onChange={(v) => setForm((p) => ({ ...p, valorCredito: v }))}
            placeholder="0,00"
            error={valorTouched ? valorError : null}
          />
        </div>
      </div>

      <div className="mt-8 text-sm font-medium">Regras (JSON)</div>
      <p className="mt-2 text-xs text-zinc-500">
        Por enquanto use JSON livre; depois viramos em campos e validações específicas.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-1">
        {(
          [
            ["Comissão", "regrasComissaoJson", '{"percentual": 0.02}'],
            ["Recebimento", "regrasRecebimentoJson", '{"parcelas": 12}'],
            ["Estorno", "regrasEstornoJson", '{"prazoDias": 7}'],
          ] as const
        ).map(([label, key, placeholder]) => (
          <label className="block" key={key}>
            <div className="mb-1 text-xs font-medium text-zinc-600">{label}</div>
            <textarea
              value={form[key]}
              onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
              placeholder={placeholder}
              className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-900 shadow-sm outline-none focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-300/50"
            />
          </label>
        ))}
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push("/planos")}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          disabled={saving || administradoras.length === 0}
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}
