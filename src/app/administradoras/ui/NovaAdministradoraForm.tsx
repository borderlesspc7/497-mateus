"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createAdministradora } from "@/actions/administradoras";
import { CnpjInput } from "@/components/form/MaskedInputs";
import { formControlClass, panelClass } from "@/components/ui/list-panel-classes";
import { isValidCnpj, stripCnpjDigits } from "@/lib/validators/cnpj";

type FormState = {
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  contatoPrincipal: string;
  enderecoLogradouro: string;
  enderecoNumero: string;
  enderecoComplemento: string;
  enderecoBairro: string;
  enderecoCidade: string;
  enderecoUf: string;
  enderecoCep: string;
  regrasOperacionaisJson: string;
};

const initialState: FormState = {
  nome: "",
  cnpj: "",
  telefone: "",
  email: "",
  contatoPrincipal: "",
  enderecoLogradouro: "",
  enderecoNumero: "",
  enderecoComplemento: "",
  enderecoBairro: "",
  enderecoCidade: "",
  enderecoUf: "",
  enderecoCep: "",
  regrasOperacionaisJson: "",
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

export default function NovaAdministradoraForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cnpjTouched, setCnpjTouched] = useState(false);

  const cnpjError = useMemo(() => {
    if (!cnpjTouched && !form.cnpj) return null;
    const digits = stripCnpjDigits(form.cnpj);
    if (digits.length === 0) return "Informe o CNPJ.";
    if (digits.length < 14) return "CNPJ incompleto.";
    if (!isValidCnpj(digits)) return "CNPJ inválido.";
    return null;
  }, [form.cnpj, cnpjTouched]);

  const payload = useMemo(() => {
    const trimOrNull = (s: string) => {
      const t = s.trim();
      return t ? t : null;
    };

    return {
      nome: form.nome.trim(),
      cnpj: form.cnpj,
      telefone: trimOrNull(form.telefone),
      email: trimOrNull(form.email),
      contatoPrincipal: trimOrNull(form.contatoPrincipal),
      enderecoLogradouro: trimOrNull(form.enderecoLogradouro),
      enderecoNumero: trimOrNull(form.enderecoNumero),
      enderecoComplemento: trimOrNull(form.enderecoComplemento),
      enderecoBairro: trimOrNull(form.enderecoBairro),
      enderecoCidade: trimOrNull(form.enderecoCidade),
      enderecoUf: trimOrNull(form.enderecoUf),
      enderecoCep: trimOrNull(form.enderecoCep),
      regrasOperacionaisJson: trimOrNull(form.regrasOperacionaisJson),
    };
  }, [form]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCnpjTouched(true);
    setError(null);

    if (!payload.nome) {
      setError("Informe o nome da administradora.");
      return;
    }
    if (cnpjError) {
      setError(cnpjError);
      return;
    }

    setSaving(true);
    try {
      await createAdministradora(payload);
      router.push("/administradoras");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className={`${panelClass()} p-6`}>
      <div className="text-sm font-medium">Dados cadastrais</div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field
          label="Nome"
          required
          value={form.nome}
          onChange={(v) => setForm((p) => ({ ...p, nome: v }))}
          placeholder="Ex.: Administradora XYZ"
        />
        <CnpjInput
          value={form.cnpj}
          onChange={(v) => setForm((p) => ({ ...p, cnpj: v }))}
          required
          error={cnpjTouched ? cnpjError : null}
        />
        <Field
          label="Telefone"
          value={form.telefone}
          onChange={(v) => setForm((p) => ({ ...p, telefone: v }))}
          placeholder="(00) 00000-0000"
        />
        <Field
          label="E-mail"
          value={form.email}
          onChange={(v) => setForm((p) => ({ ...p, email: v }))}
          placeholder="contato@empresa.com"
        />
        <Field
          label="Contato principal"
          value={form.contatoPrincipal}
          onChange={(v) => setForm((p) => ({ ...p, contatoPrincipal: v }))}
          placeholder="Nome do responsável"
        />
      </div>

      <div className="mt-8 text-sm font-medium">Endereço</div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field
          label="Logradouro"
          value={form.enderecoLogradouro}
          onChange={(v) => setForm((p) => ({ ...p, enderecoLogradouro: v }))}
          placeholder="Rua / Av."
        />
        <Field
          label="Número"
          value={form.enderecoNumero}
          onChange={(v) => setForm((p) => ({ ...p, enderecoNumero: v }))}
          placeholder="123"
        />
        <Field
          label="Complemento"
          value={form.enderecoComplemento}
          onChange={(v) => setForm((p) => ({ ...p, enderecoComplemento: v }))}
          placeholder="Sala, Andar..."
        />
        <Field
          label="Bairro"
          value={form.enderecoBairro}
          onChange={(v) => setForm((p) => ({ ...p, enderecoBairro: v }))}
          placeholder="Centro"
        />
        <Field
          label="Cidade"
          value={form.enderecoCidade}
          onChange={(v) => setForm((p) => ({ ...p, enderecoCidade: v }))}
          placeholder="São Paulo"
        />
        <Field
          label="UF"
          value={form.enderecoUf}
          onChange={(v) => setForm((p) => ({ ...p, enderecoUf: v.toUpperCase().slice(0, 2) }))}
          placeholder="SP"
        />
        <Field
          label="CEP"
          value={form.enderecoCep}
          onChange={(v) => setForm((p) => ({ ...p, enderecoCep: v }))}
          placeholder="00000-000"
        />
      </div>

      <div className="mt-8 text-sm font-medium">Regras operacionais</div>
      <div className="mt-2 text-xs text-zinc-500">
        Por enquanto é um campo livre (texto/JSON). Depois a gente transforma em regras
        estruturadas.
      </div>
      <textarea
        value={form.regrasOperacionaisJson}
        onChange={(e) => setForm((p) => ({ ...p, regrasOperacionaisJson: e.target.value }))}
        placeholder='Ex.: {"comissaoPadrao": 0.02}'
        className="mt-3 min-h-28 w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-900 shadow-sm outline-none focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-300/50"
      />

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push("/administradoras")}
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
