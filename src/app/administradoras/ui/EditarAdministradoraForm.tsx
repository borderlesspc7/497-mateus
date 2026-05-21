"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { updateAdministradora } from "@/actions/administradoras";
import { CnpjInput } from "@/components/form/MaskedInputs";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { formControlClass, panelClass } from "@/components/ui/list-panel-classes";
import type { AdministradoraRow } from "@/lib/types/domain";
import { isValidCnpj, stripCnpjDigits } from "@/lib/validators/cnpj";

type EditarAdministradoraFormProps = {
  item: AdministradoraRow;
};

export default function EditarAdministradoraForm({ item }: EditarAdministradoraFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cnpjTouched, setCnpjTouched] = useState(false);

  const [form, setForm] = useState({
    nome: item.nome ?? "",
    cnpj: item.cnpj ?? "",
    telefone: item.telefone ?? "",
    email: item.email ?? "",
    contatoPrincipal: item.contatoPrincipal ?? "",
    enderecoLogradouro: item.enderecoLogradouro ?? "",
    enderecoNumero: item.enderecoNumero ?? "",
    enderecoComplemento: item.enderecoComplemento ?? "",
    enderecoBairro: item.enderecoBairro ?? "",
    enderecoCidade: item.enderecoCidade ?? "",
    enderecoUf: item.enderecoUf ?? "",
    enderecoCep: item.enderecoCep ?? "",
    regrasOperacionaisJson: item.regrasOperacionaisJson ?? "",
  });

  const cnpjError = useMemo(() => {
    if (!cnpjTouched && form.cnpj === item.cnpj) return null;
    const digits = stripCnpjDigits(form.cnpj);
    if (digits.length === 0) return "Informe o CNPJ.";
    if (digits.length < 14) return "CNPJ incompleto.";
    if (!isValidCnpj(digits)) return "CNPJ inválido.";
    return null;
  }, [form.cnpj, cnpjTouched, item.cnpj]);

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

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setCnpjTouched(true);
    setSaving(true);
    setError(null);

    if (!payload.nome) {
      setError("Informe o nome da administradora.");
      setSaving(false);
      return;
    }
    if (cnpjError) {
      setError(cnpjError);
      setSaving(false);
      return;
    }

    try {
      await updateAdministradora(item.id, payload);
      router.push("/administradoras");
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
          { label: "Administradoras", href: "/administradoras" },
          { label: "Editar" },
        ]}
        title={item.nome}
        description="Atualize dados cadastrais, contato, endereço e regras operacionais (JSON)."
        actions={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/planos?administradoraId=${encodeURIComponent(item.id)}`}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
            >
              Ver planos
            </Link>
            <Link href="/administradoras" className={backLinkClass()}>
              Voltar à lista
            </Link>
          </div>
        }
      />

      <form onSubmit={(e) => void onSave(e)} className={`${panelClass()} p-6`}>
        <div className="text-sm font-medium">Dados cadastrais</div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <div className="mb-1 text-xs font-medium text-zinc-600">
              Nome <span className="text-red-600">*</span>
            </div>
            <input
              value={form.nome}
              onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
              className={formControlClass()}
            />
          </label>

          <CnpjInput
            value={form.cnpj}
            onChange={(v) => setForm((p) => ({ ...p, cnpj: v }))}
            required
            error={cnpjTouched ? cnpjError : null}
          />

          {(
            [
              ["Telefone", "telefone"],
              ["E-mail", "email"],
              ["Contato principal", "contatoPrincipal"],
            ] as const
          ).map(([label, key]) => (
            <label className="block" key={key}>
              <div className="mb-1 text-xs font-medium text-zinc-600">{label}</div>
              <input
                value={form[key]}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                className={formControlClass()}
              />
            </label>
          ))}
        </div>

        <div className="mt-8 text-sm font-medium">Endereço</div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {(
            [
              ["Logradouro", "enderecoLogradouro"],
              ["Número", "enderecoNumero"],
              ["Complemento", "enderecoComplemento"],
              ["Bairro", "enderecoBairro"],
              ["Cidade", "enderecoCidade"],
              ["UF", "enderecoUf"],
              ["CEP", "enderecoCep"],
            ] as const
          ).map(([label, key]) => (
            <label className="block" key={key}>
              <div className="mb-1 text-xs font-medium text-zinc-600">{label}</div>
              <input
                value={form[key]}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    [key]: key === "enderecoUf" ? e.target.value.toUpperCase().slice(0, 2) : e.target.value,
                  }))
                }
                className={formControlClass()}
              />
            </label>
          ))}
        </div>

        <div className="mt-8 text-sm font-medium">Regras operacionais</div>
        <textarea
          value={form.regrasOperacionaisJson}
          onChange={(e) => setForm((p) => ({ ...p, regrasOperacionaisJson: e.target.value }))}
          className="mt-3 min-h-28 w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-900 shadow-sm outline-none focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-300/50"
        />

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
