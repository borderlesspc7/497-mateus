"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { listPlanosMiniByAdministradora } from "@/actions/planos";
import { findConsorciadoByCpfCnpj } from "@/actions/consorciados";
import { listVendedoresMiniByEquipe } from "@/actions/vendedores";
import { createVenda } from "@/actions/vendas";
import { ConsorciadoAutocomplete } from "@/components/form/ConsorciadoAutocomplete";
import { CurrencyInput } from "@/components/form/MaskedInputs";
import { primaryCtaClass } from "@/components/page-flow/button-classes";
import {
  createConsorciado,
  type ConsorciadoInput,
} from "@/lib/firestore/consorciados-client";
import { formControlClass, formSectionClass } from "@/components/ui/list-panel-classes";
import type {
  AdministradoraMini,
  ConsorciadoMini,
  EquipeMini,
  PlanoMini,
  StatusOperacionalCota,
  VendedorMini,
} from "@/lib/types/domain";
import {
  buildVendaTitulo,
  formatZodError,
  novaVendaOperacionalSchema,
  novoConsorciadoSchema,
  parseValorCreditoToCentavos,
} from "@/lib/vendas/nova-venda-schema";

type ConsorciadoMode = "existente" | "novo" | null;

type VendaFormState = {
  equipeId: string;
  vendedorId: string;
  administradoraId: string;
  planoId: string;
  numeroContrato: string;
  grupo: string;
  cota: string;
  dataVencimento: string;
  statusOperacional: StatusOperacionalCota;
  valor: string;
  dataFechamento: string;
  mesAnoFechamento: string;
};

type NovoConsorciadoFormState = {
  nome: string;
  cpf_cnpj: string;
  telefone: string;
  email: string;
};

type NovaVendaFormProps = {
  administradoras: AdministradoraMini[];
  equipes: EquipeMini[];
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

function modeButtonClass(active: boolean) {
  return [
    "inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
    active
      ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50",
  ].join(" ");
}

function StepBadge({ number, done }: { number: number; done: boolean }) {
  return (
    <span
      className={[
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
        done ? "bg-emerald-100 text-emerald-800" : "bg-zinc-900 text-white",
      ].join(" ")}
    >
      {done ? "✓" : number}
    </span>
  );
}

export default function NovaVendaForm({
  administradoras,
  equipes,
}: NovaVendaFormProps) {
  const router = useRouter();
  const [consorciadoMode, setConsorciadoMode] = useState<ConsorciadoMode>(null);
  const [consorciadoId, setConsorciadoId] = useState("");
  const [consorciadoSelecionado, setConsorciadoSelecionado] = useState<ConsorciadoMini | null>(
    null,
  );
  const [novoConsorciado, setNovoConsorciado] = useState<NovoConsorciadoFormState>({
    nome: "",
    cpf_cnpj: "",
    telefone: "",
    email: "",
  });

  const [form, setForm] = useState<VendaFormState>({
    equipeId: equipes[0]?.id ?? "",
    vendedorId: "",
    administradoraId: administradoras[0]?.id ?? "",
    planoId: "",
    numeroContrato: "",
    grupo: "",
    cota: "",
    dataVencimento: "10",
    statusOperacional: "ATIVO",
    valor: "",
    dataFechamento: "",
    mesAnoFechamento: "",
  });

  const [planos, setPlanos] = useState<PlanoMini[]>([]);
  const [vendedores, setVendedores] = useState<VendedorMini[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [valorTouched, setValorTouched] = useState(false);

  const novoConsorciadoValido = useMemo(
    () => novoConsorciadoSchema.safeParse(novoConsorciado).success,
    [novoConsorciado],
  );

  const consorciadoPronto =
    consorciadoMode === "existente"
      ? Boolean(consorciadoId.trim())
      : consorciadoMode === "novo"
        ? novoConsorciadoValido
        : false;

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

  useEffect(() => {
    if (!form.equipeId) {
      setVendedores([]);
      setForm((p) => ({ ...p, vendedorId: "" }));
      return;
    }
    let alive = true;
    void listVendedoresMiniByEquipe(form.equipeId)
      .then((data) => {
        if (!alive) return;
        setVendedores(data);
        setForm((p) => {
          if (!p.vendedorId) return { ...p, vendedorId: data[0]?.id ?? "" };
          return data.some((v) => v.id === p.vendedorId) ? p : { ...p, vendedorId: data[0]?.id ?? "" };
        });
      })
      .catch(() => {
        if (!alive) return;
        setVendedores([]);
      });
    return () => {
      alive = false;
    };
  }, [form.equipeId]);

  const valorError = useMemo(() => {
    if (!valorTouched && !form.valor) return null;
    if (!form.valor.trim()) return "Informe o valor do crédito.";
    try {
      const centavos = parseValorCreditoToCentavos(form.valor);
      if (centavos <= 0) return "O valor do crédito deve ser maior que zero.";
      return null;
    } catch {
      return "Valor inválido.";
    }
  }, [form.valor, valorTouched]);

  function syncMesAnoFromDataFechamento(dataFechamento: string): string {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataFechamento)) return "";
    return dataFechamento.slice(0, 7);
  }

  async function resolveConsorciadoId(): Promise<string> {
    if (consorciadoMode === "existente") {
      if (!consorciadoId.trim()) throw new Error("Selecione um consorciado existente.");
      return consorciadoId;
    }

    const parsed = novoConsorciadoSchema.safeParse(novoConsorciado);
    if (!parsed.success) throw new Error(formatZodError(parsed.error));

    const duplicado = await findConsorciadoByCpfCnpj(parsed.data.cpf_cnpj);
    if (duplicado) {
      throw new Error(
        `Já existe um consorciado com este CPF/CNPJ (${duplicado.nome}). Use "Usar Existente" para vinculá-lo.`,
      );
    }

    const input: ConsorciadoInput = parsed.data;
    const created = await createConsorciado(input);
    return created.id;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValorTouched(true);
    setError(null);

    if (!consorciadoMode) {
      setError("Escolha se vai criar um novo consorciado ou usar um existente.");
      return;
    }

    if (valorError) {
      setError(valorError);
      return;
    }

    let valorCentavos: number;
    try {
      valorCentavos = parseValorCreditoToCentavos(form.valor);
    } catch {
      setError("Valor do crédito inválido.");
      return;
    }

    const dataVencimento = Number.parseInt(form.dataVencimento, 10);
    const operacional = novaVendaOperacionalSchema.safeParse({
      numeroContrato: form.numeroContrato,
      grupo: form.grupo,
      cota: form.cota,
      dataVencimento,
      valorCentavos,
      dataFechamento: form.dataFechamento,
      mesAnoFechamento: form.mesAnoFechamento,
      administradoraId: form.administradoraId,
      planoId: form.planoId,
      equipeId: form.equipeId,
      vendedorId: form.vendedorId,
      statusOperacional: form.statusOperacional,
    });

    if (!operacional.success) {
      setError(formatZodError(operacional.error));
      return;
    }

    setSaving(true);
    try {
      const resolvedConsorciadoId = await resolveConsorciadoId();
      const { data } = operacional;

      await createVenda({
        consorciadoId: resolvedConsorciadoId,
        equipeId: data.equipeId,
        vendedorId: data.vendedorId,
        administradoraId: data.administradoraId,
        planoId: data.planoId,
        numeroContrato: data.numeroContrato,
        grupo: data.grupo,
        cota: data.cota,
        dataVencimento: data.dataVencimento,
        titulo: buildVendaTitulo(data.numeroContrato, data.grupo, data.cota),
        statusOperacional: data.statusOperacional,
        valorCentavos: data.valorCentavos,
        dataVenda: new Date(`${data.dataFechamento}T00:00:00.000Z`),
        mesAnoFechamento: data.mesAnoFechamento,
        descricao: null,
        observacoes: null,
      });

      router.push("/vendas");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  const step2Disabled = !consorciadoPronto;

  return (
    <form onSubmit={(e) => void onSubmit(e)} className={formSectionClass()}>
      {/* Passo 1 */}
      <section className="border-b border-zinc-100 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <StepBadge number={1} done={consorciadoPronto} />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-zinc-900">Consorciado</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              Evite duplicidade: busque um cliente existente antes de criar um novo cadastro.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className={modeButtonClass(consorciadoMode === "existente")}
            onClick={() => {
              setConsorciadoMode("existente");
              setNovoConsorciado({ nome: "", cpf_cnpj: "", telefone: "", email: "" });
              setConsorciadoSelecionado(null);
            }}
          >
            Usar Existente
          </button>
          <button
            type="button"
            className={modeButtonClass(consorciadoMode === "novo")}
            onClick={() => {
              setConsorciadoMode("novo");
              setConsorciadoId("");
              setConsorciadoSelecionado(null);
            }}
          >
            Criar Novo Consorciado
          </button>
        </div>

        {!consorciadoMode ? (
          <p className="mt-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
            Selecione uma das opções acima para continuar.
          </p>
        ) : null}

        {consorciadoMode === "existente" ? (
          <div className="relative z-20 mt-5 space-y-3">
            <label className="block">
              <div className="mb-1 text-xs font-medium text-zinc-600">
                Buscar consorciado <span className="text-red-600"> *</span>
              </div>
              <ConsorciadoAutocomplete
                remoteSearch
                value={consorciadoId}
                onChange={(id) => {
                  setConsorciadoId(id);
                  if (!id) setConsorciadoSelecionado(null);
                }}
                onSelect={setConsorciadoSelecionado}
                required
              />
            </label>
            <p className="text-xs text-zinc-500">
              A busca consulta o Firestore em tempo real por nome ou CPF/CNPJ.
            </p>
            {consorciadoSelecionado ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
                <span className="font-medium">{consorciadoSelecionado.nome}</span>
                <span className="text-emerald-800"> · {consorciadoSelecionado.cpf_cnpj}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        {consorciadoMode === "novo" ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field
              label="Nome"
              required
              value={novoConsorciado.nome}
              onChange={(v) => setNovoConsorciado((p) => ({ ...p, nome: v }))}
            />
            <Field
              label="CPF / CNPJ"
              required
              value={novoConsorciado.cpf_cnpj}
              onChange={(v) => setNovoConsorciado((p) => ({ ...p, cpf_cnpj: v }))}
            />
            <Field
              label="Telefone"
              required
              value={novoConsorciado.telefone}
              onChange={(v) => setNovoConsorciado((p) => ({ ...p, telefone: v }))}
            />
            <Field
              label="E-mail"
              required
              type="email"
              value={novoConsorciado.email}
              onChange={(v) => setNovoConsorciado((p) => ({ ...p, email: v }))}
            />
          </div>
        ) : null}
      </section>

      {/* Passo 2 — sempre visível; desabilitado até o passo 1 estar pronto */}
      <section className="relative p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <StepBadge number={2} done={false} />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-zinc-900">Dados operacionais da venda</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              Contrato, cota, valores e equipe responsável pela venda.
            </p>
          </div>
        </div>

        {step2Disabled ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {consorciadoMode === "existente"
              ? "Selecione um consorciado na busca acima para liberar os campos da venda."
              : consorciadoMode === null
                ? "Escolha como vincular o consorciado no passo 1."
                : "Preencha os dados do novo consorciado ou confirme a seleção para continuar."}
          </div>
        ) : null}

        <fieldset
          disabled={step2Disabled}
          className={[
            "mt-5 border-0 p-0",
            step2Disabled ? "pointer-events-none opacity-45" : "",
          ].join(" ")}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Número do contrato"
              required
              value={form.numeroContrato}
              onChange={(v) => setForm((p) => ({ ...p, numeroContrato: v }))}
              placeholder="Identificador único do contrato"
            />
            <CurrencyInput
              label="Valor do crédito"
              value={form.valor}
              onChange={(v) => setForm((p) => ({ ...p, valor: v }))}
              error={valorTouched ? valorError : null}
              required
            />
            <Field
              label="Grupo"
              required
              value={form.grupo}
              onChange={(v) => setForm((p) => ({ ...p, grupo: v }))}
              placeholder="Ex.: 1234"
            />
            <Field
              label="Cota"
              required
              value={form.cota}
              onChange={(v) => setForm((p) => ({ ...p, cota: v }))}
              placeholder="Ex.: 056"
            />
            <Field
              label="Dia de vencimento da parcela"
              required
              type="number"
              value={form.dataVencimento}
              onChange={(v) => setForm((p) => ({ ...p, dataVencimento: v }))}
              placeholder="1 a 31"
            />
            <Field
              label="Data de fechamento"
              required
              type="date"
              value={form.dataFechamento}
              onChange={(v) =>
                setForm((p) => ({
                  ...p,
                  dataFechamento: v,
                  mesAnoFechamento: syncMesAnoFromDataFechamento(v) || p.mesAnoFechamento,
                }))
              }
            />
            <Field
              label="Mês/ano de fechamento"
              required
              type="month"
              value={form.mesAnoFechamento}
              onChange={(v) => setForm((p) => ({ ...p, mesAnoFechamento: v }))}
            />

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
                required
              >
                {administradoras.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome} ({a.cnpj})
                  </option>
                ))}
              </select>
            </label>

            <label className="block md:col-span-2">
              <div className="mb-1 text-xs font-medium text-zinc-600">
                Plano <span className="text-red-600"> *</span>
              </div>
              <select
                value={form.planoId}
                onChange={(e) => setForm((p) => ({ ...p, planoId: e.target.value }))}
                className={formControlClass()}
                disabled={!form.administradoraId || planos.length === 0}
                required
              >
                <option value="">Selecione...</option>
                {planos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} — {p.tipoBem}
                  </option>
                ))}
              </select>
              {form.administradoraId && planos.length === 0 ? (
                <p className="mt-2 text-xs text-zinc-500">
                  Nenhum plano para esta administradora.{" "}
                  <Link href="/planos/nova" className="font-medium underline">
                    Cadastrar plano
                  </Link>
                </p>
              ) : null}
            </label>

            <label className="block">
              <div className="mb-1 text-xs font-medium text-zinc-600">
                Equipe <span className="text-red-600"> *</span>
              </div>
              <select
                value={form.equipeId}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    equipeId: e.target.value,
                    vendedorId: "",
                  }))
                }
                className={formControlClass()}
                disabled={equipes.length === 0}
                required
              >
                {equipes.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <div className="mb-1 text-xs font-medium text-zinc-600">
                Vendedor <span className="text-red-600"> *</span>
              </div>
              <select
                value={form.vendedorId}
                onChange={(e) => setForm((p) => ({ ...p, vendedorId: e.target.value }))}
                className={formControlClass()}
                disabled={!form.equipeId || vendedores.length === 0}
                required
              >
                <option value="">Selecione...</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <div className="mb-1 text-xs font-medium text-zinc-600">
                Status <span className="text-red-600"> *</span>
              </div>
              <select
                value={form.statusOperacional}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    statusOperacional: e.target.value as StatusOperacionalCota,
                  }))
                }
                className={formControlClass()}
                required
              >
                <option value="ATIVO">Ativo</option>
                <option value="INADIMPLENTE">Inadimplente</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </label>
          </div>
        </fieldset>
      </section>

      <footer className="flex flex-col gap-4 border-t border-zinc-100 bg-zinc-50/80 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        {error ? (
          <div className="flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            {consorciadoPronto
              ? "Revise os dados antes de registrar a venda."
              : "Complete o passo 1 para habilitar o registro."}
          </p>
        )}

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push("/vendas")}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={primaryCtaClass()}
            disabled={
              saving ||
              !consorciadoPronto ||
              administradoras.length === 0 ||
              equipes.length === 0
            }
          >
            {saving ? "Salvando..." : "Registrar venda"}
          </button>
        </div>
      </footer>
    </form>
  );
}
