"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  getConsorciado,
  updateConsorciado,
  type ConsorciadoInput,
} from "@/lib/firestore/consorciados-client";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { formControlClass, panelClass } from "@/components/ui/list-panel-classes";

type EditarConsorciadoFormProps = {
  id: string;
};

type FormState = {
  nome: string;
  documento: string;
  telefone: string;
  email: string;
  endereco: string;
};

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

export default function EditarConsorciadoForm({ id }: EditarConsorciadoFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState<FormState>({
    nome: "",
    documento: "",
    telefone: "",
    email: "",
    endereco: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    void getConsorciado(id)
      .then((item) => {
        if (!alive) return;
        if (!item) {
          setNotFound(true);
          return;
        }
        setForm({
          nome: item.nome,
          documento: item.documento,
          telefone: item.telefone,
          email: item.email,
          endereco: item.endereco,
        });
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Erro ao carregar consorciado.");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const validationError = useMemo(() => {
    if (!submitted) return null;
    return validateForm(form);
  }, [form, submitted]);

  async function onSave(e: React.FormEvent) {
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
      await updateConsorciado(id, toInput(form));
      router.push("/consorciados");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
        Carregando consorciado...
      </div>
    );
  }

  if (notFound) {
    return (
      <>
        <PageFlowHeader
          crumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Consorciados", href: "/consorciados" },
            { label: "Erro" },
          ]}
          title="Consorciado não encontrado"
          description="Não foi possível carregar este registro."
          actions={
            <Link href="/consorciados" className={backLinkClass()}>
              Voltar à lista
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Consorciados", href: "/consorciados" },
          { label: "Editar" },
        ]}
        title={form.nome || "Editar consorciado"}
        description="Atualize os dados cadastrais do consorciado."
        actions={
          <Link href="/consorciados" className={backLinkClass()}>
            Voltar à lista
          </Link>
        }
      />

      <form onSubmit={(e) => void onSave(e)} className={`${panelClass()} p-6`}>
        <div className="text-sm font-medium">Dados do consorciado</div>

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
          <label className="block">
            <div className="mb-1 text-xs font-medium text-zinc-600">
              CPF / CNPJ <span className="text-red-600">*</span>
            </div>
            <input
              value={form.documento}
              onChange={(e) => setForm((p) => ({ ...p, documento: e.target.value }))}
              className={formControlClass()}
            />
          </label>
          <label className="block">
            <div className="mb-1 text-xs font-medium text-zinc-600">
              Telefone <span className="text-red-600">*</span>
            </div>
            <input
              value={form.telefone}
              onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))}
              className={formControlClass()}
            />
          </label>
          <label className="block">
            <div className="mb-1 text-xs font-medium text-zinc-600">
              E-mail <span className="text-red-600">*</span>
            </div>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className={formControlClass()}
            />
          </label>
          <label className="block md:col-span-2">
            <div className="mb-1 text-xs font-medium text-zinc-600">
              Endereço <span className="text-red-600">*</span>
            </div>
            <textarea
              value={form.endereco}
              onChange={(e) => setForm((p) => ({ ...p, endereco: e.target.value }))}
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
