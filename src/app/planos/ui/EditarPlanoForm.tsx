"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { updatePlano } from "@/actions/planos";
import { CurrencyInput } from "@/components/form/MaskedInputs";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { formControlClass, panelClass } from "@/components/ui/list-panel-classes";
import type { AdministradoraMini, PlanoRow } from "@/lib/types/domain";
import {
  formatCentavosToCurrencyInput,
  parseCurrencyToCentavos,
} from "@/lib/validators/currency";

type EditarPlanoFormProps = {
  item: PlanoRow;
  administradoras: AdministradoraMini[];
};

export default function EditarPlanoForm({ item, administradoras }: EditarPlanoFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [valorTouched, setValorTouched] = useState(false);

  const [form, setForm] = useState({
    administradoraId: item.administradoraId,
    nome: item.nome,
    tipoBem: item.tipoBem,
    valorCredito: formatCentavosToCurrencyInput(item.valorCreditoCentavos),
    regrasComissaoJson: item.regrasComissaoJson ?? "",
    regrasRecebimentoJson: item.regrasRecebimentoJson ?? "",
    regrasEstornoJson: item.regrasEstornoJson ?? "",
  });

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

    let valorCreditoCentavos: number | null = null;
    try {
      valorCreditoCentavos = form.valorCredito.trim()
        ? parseCurrencyToCentavos(form.valorCredito)
        : null;
    } catch {
      setError("Valor do crédito inválido.");
      setSaving(false);
      return;
    }

    const trimOrNull = (s: string) => {
      const t = s.trim();
      return t ? t : null;
    };

    try {
      await updatePlano(item.id, {
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
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Planos", href: "/planos" },
          { label: "Editar" },
        ]}
        title={item.nome}
        description="Ajuste administradora, dados do plano e regras em JSON."
        actions={
          <Link href="/planos" className={backLinkClass()}>
            Voltar à lista
          </Link>
        }
      />

      <form onSubmit={(e) => void onSave(e)} className={`${panelClass()} p-6`}>
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
            >
              {administradoras.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome} ({a.cnpj})
                </option>
              ))}
            </select>
          </label>
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
              Tipo de bem <span className="text-red-600">*</span>
            </div>
            <input
              value={form.tipoBem}
              onChange={(e) => setForm((p) => ({ ...p, tipoBem: e.target.value }))}
              className={formControlClass()}
            />
          </label>
          <div className="md:col-span-2">
            <CurrencyInput
              label="Valor do crédito"
              value={form.valorCredito}
              onChange={(v) => setForm((p) => ({ ...p, valorCredito: v }))}
              error={valorTouched ? valorError : null}
            />
          </div>
        </div>

        <div className="mt-8 text-sm font-medium">Regras (JSON)</div>
        <div className="mt-4 grid gap-4">
          {(
            [
              ["Comissão", "regrasComissaoJson"],
              ["Recebimento", "regrasRecebimentoJson"],
              ["Estorno", "regrasEstornoJson"],
            ] as const
          ).map(([label, key]) => (
            <label className="block" key={key}>
              <div className="mb-1 text-xs font-medium text-zinc-600">{label}</div>
              <textarea
                value={form[key]}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
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
