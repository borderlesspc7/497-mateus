"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  createConsorciado,
  type ConsorciadoInput,
} from "@/lib/firestore/consorciados-client";
import { formControlClass, panelClass } from "@/components/ui/list-panel-classes";

type FormState = {
  nome: string;
  documento: string;
  telefone: string;
  email: string;
  endereco: string;
};

const initialState: FormState = {
  nome: "",
  documento: "",
  telefone: "",
  email: "",
  endereco: "",
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

function validateForm(form: FormState): string | null {
  if (!form.nome.trim()) return "Informe o nome.";
  if (!form.documento.trim()) return "Informe o CPF ou CNPJ.";
  if (!form.telefone.trim()) return "Informe o telefone.";
  if (!form.email.trim()) return "Informe o e-mail.";
  if (!form.endereco.trim()) return "Informe o endereço.";
  return null;
}

function toInput(form: FormState): ConsorciadoInput {
  return {
    nome: form.nome.trim(),
    documento: form.documento.trim(),
    telefone: form.telefone.trim(),
    email: form.email.trim(),
    endereco: form.endereco.trim(),
  };
}

export default function NovaConsorciadoForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const validationError = useMemo(() => {
    if (!submitted) return null;
    return validateForm(form);
  }, [form, submitted]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setError(null);

    const validation = validateForm(form);
    if (validation) {
      setError(validation);
      return;
    }

    setSaving(true);
    try {
      await createConsorciado(toInput(form));
      router.push("/consorciados");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className={`${panelClass()} p-6`}>
      <div className="text-sm font-medium">Dados do consorciado</div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field
          label="Nome"
          required
          value={form.nome}
          onChange={(v) => setForm((p) => ({ ...p, nome: v }))}
          placeholder="Nome completo ou razão social"
        />
        <Field
          label="CPF / CNPJ"
          required
          value={form.documento}
          onChange={(v) => setForm((p) => ({ ...p, documento: v }))}
          placeholder="000.000.000-00 ou 00.000.000/0000-00"
        />
        <Field
          label="Telefone"
          required
          value={form.telefone}
          onChange={(v) => setForm((p) => ({ ...p, telefone: v }))}
          placeholder="(00) 00000-0000"
        />
        <Field
          label="E-mail"
          required
          type="email"
          value={form.email}
          onChange={(v) => setForm((p) => ({ ...p, email: v }))}
          placeholder="contato@email.com"
        />
        <label className="block md:col-span-2">
          <div className="mb-1 text-xs font-medium text-zinc-600">
            Endereço <span className="text-red-600"> *</span>
          </div>
          <textarea
            value={form.endereco}
            onChange={(e) => setForm((p) => ({ ...p, endereco: e.target.value }))}
            placeholder="Rua, número, bairro, cidade — UF"
            className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-900 shadow-sm outline-none focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-300/50"
          />
        </label>
      </div>

      {validationError || error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {validationError ?? error}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push("/consorciados")}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          disabled={saving}
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}
