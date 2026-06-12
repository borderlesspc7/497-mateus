"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { listPlanosMiniByAdministradora } from "@/actions/planos";
import { listVendedoresMiniByEquipe } from "@/actions/vendedores";
import { updateVenda } from "@/actions/vendas";
import { ConsorciadoAutocomplete } from "@/components/form/ConsorciadoAutocomplete";
import { CurrencyInput } from "@/components/form/MaskedInputs";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { formControlClass, panelClass } from "@/components/ui/list-panel-classes";
import { VendaPosVendaPanel } from "@/components/vendas/VendaPosVendaPanel";
import { CancelamentoEstornoModal } from "@/components/vendas/CancelamentoEstornoModal";
import type {
  AdministradoraMini,
  ConsorciadoMini,
  EquipeMini,
  PlanoMini,
  VendaRow,
  VendedorMini,
} from "@/lib/types/domain";
import {
  formatCentavosToCurrencyInput,
  parseCurrencyToCentavos,
} from "@/lib/validators/currency";

type EditarVendaFormProps = {
  item: VendaRow;
  administradoras: AdministradoraMini[];
  initialPlanos: PlanoMini[];
  consorciados: ConsorciadoMini[];
  equipes: EquipeMini[];
  vendedores: VendedorMini[];
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
  consorciados,
  equipes,
}: EditarVendaFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [valorTouched, setValorTouched] = useState(false);
  const [planos, setPlanos] = useState<PlanoMini[]>(initialPlanos);
  const [vendedores, setVendedores] = useState<VendedorMini[]>([]);

  const [form, setForm] = useState({
    consorciadoId: item.consorciadoId ?? "",
    equipeId: item.equipeId || equipes[0]?.id || "",
    vendedorId: item.vendedorId ?? "",
    administradoraId: item.administradoraId,
    planoId: item.planoId ?? "",
    numeroContrato: item.numeroContrato,
    grupo: item.grupo,
    cota: item.cota,
    dataVencimento: String(item.dataVencimento),
    titulo: item.titulo,
    statusOperacional: item.statusOperacional,
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

  useEffect(() => {
    if (!form.equipeId) {
      setVendedores([]);
      return;
    }
    let alive = true;
    void listVendedoresMiniByEquipe(form.equipeId)
      .then((data) => {
        if (!alive) return;
        setVendedores(data);
        setForm((p) => {
          if (!p.vendedorId) return p;
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
    if (!form.valor.trim()) return null;
    try {
      parseCurrencyToCentavos(form.valor);
      return null;
    } catch {
      return "Valor inválido.";
    }
  }, [form.valor, valorTouched]);

  async function executeSave(parcelasPagasCancelamento?: number) {
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

    if (!form.titulo.trim()) {
      setError("Informe o título da venda.");
      setSaving(false);
      return;
    }
    if (!form.consorciadoId.trim()) {
      setError("Selecione um consorciado.");
      setSaving(false);
      return;
    }
    if (!form.equipeId.trim()) {
      setError("Selecione uma equipe.");
      setSaving(false);
      return;
    }
    if (!form.vendedorId.trim()) {
      setError("Selecione o vendedor responsável.");
      setSaving(false);
      return;
    }

    const dataVencimento = Number.parseInt(form.dataVencimento, 10);
    if (!form.numeroContrato.trim()) {
      setError("Informe o número do contrato.");
      setSaving(false);
      return;
    }
    if (!form.grupo.trim()) {
      setError("Informe o grupo.");
      setSaving(false);
      return;
    }
    if (!form.cota.trim()) {
      setError("Informe a cota.");
      setSaving(false);
      return;
    }
    if (!Number.isInteger(dataVencimento) || dataVencimento < 1 || dataVencimento > 31) {
      setError("Informe o dia de vencimento entre 1 e 31.");
      setSaving(false);
      return;
    }

    try {
      await updateVenda(item.id, {
        consorciadoId: form.consorciadoId,
        equipeId: form.equipeId,
        vendedorId: form.vendedorId,
        administradoraId: form.administradoraId,
        planoId: form.planoId.trim() ? form.planoId.trim() : null,
        numeroContrato: form.numeroContrato.trim(),
        grupo: form.grupo.trim(),
        cota: form.cota.trim(),
        dataVencimento,
        titulo: form.titulo.trim(),
        statusOperacional: form.statusOperacional,
        valorCentavos,
        dataVenda: form.dataVenda ? new Date(`${form.dataVenda}T00:00:00.000Z`) : null,
        descricao: trimOrNull(form.descricao),
        observacoes: trimOrNull(form.observacoes),
        parcelasPagasCancelamento,
      });
      setCancelModalOpen(false);
      router.push("/vendas");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setValorTouched(true);

    if (valorError) {
      setError(valorError);
      return;
    }

    const isNovoCancelamento =
      form.statusOperacional === "CANCELADO" && item.statusOperacional !== "CANCELADO";
    if (isNovoCancelamento) {
      setCancelModalOpen(true);
      return;
    }

    await executeSave();
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
        description="Atualize consorciado, administradora, plano, status, valores e detalhes da venda."
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
              Consorciado <span className="text-red-600"> *</span>
            </div>
            <ConsorciadoAutocomplete
              consorciados={consorciados}
              value={form.consorciadoId}
              onChange={(consorciadoId) => setForm((p) => ({ ...p, consorciadoId }))}
              disabled={consorciados.length === 0}
              required
            />
            {consorciados.length === 0 ? (
              <div className="mt-2 text-xs text-zinc-500">
                Nenhum consorciado cadastrado.{" "}
                <Link
                  href="/consorciados/nova"
                  className="font-medium text-zinc-800 underline-offset-2 hover:underline"
                >
                  Novo consorciado
                </Link>
              </div>
            ) : null}
          </label>

          <label className="block">
            <div className="mb-1 text-xs font-medium text-zinc-600">
              Contrato <span className="text-red-600">*</span>
            </div>
            <input
              value={form.numeroContrato}
              onChange={(e) => setForm((p) => ({ ...p, numeroContrato: e.target.value }))}
              className={formControlClass()}
            />
          </label>
          <label className="block">
            <div className="mb-1 text-xs font-medium text-zinc-600">
              Grupo <span className="text-red-600">*</span>
            </div>
            <input
              value={form.grupo}
              onChange={(e) => setForm((p) => ({ ...p, grupo: e.target.value }))}
              className={formControlClass()}
            />
          </label>
          <label className="block">
            <div className="mb-1 text-xs font-medium text-zinc-600">
              Cota <span className="text-red-600">*</span>
            </div>
            <input
              value={form.cota}
              onChange={(e) => setForm((p) => ({ ...p, cota: e.target.value }))}
              className={formControlClass()}
            />
          </label>
          <label className="block">
            <div className="mb-1 text-xs font-medium text-zinc-600">
              Dia de vencimento <span className="text-red-600">*</span>
            </div>
            <input
              type="number"
              min={1}
              max={31}
              value={form.dataVencimento}
              onChange={(e) => setForm((p) => ({ ...p, dataVencimento: e.target.value }))}
              className={formControlClass()}
            />
          </label>

          <label className="block">
            <div className="mb-1 text-xs font-medium text-zinc-600">
              Equipe <span className="text-red-600">*</span>
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
            >
              {equipes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="mb-1 text-xs font-medium text-zinc-600">
              Vendedor responsável <span className="text-red-600">*</span>
            </div>
            <select
              value={form.vendedorId}
              onChange={(e) => setForm((p) => ({ ...p, vendedorId: e.target.value }))}
              className={formControlClass()}
              disabled={!form.equipeId || vendedores.length === 0}
            >
              <option value="">Selecione...</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </select>
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
              value={form.statusOperacional}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  statusOperacional: e.target.value as VendaRow["statusOperacional"],
                }))
              }
              className={formControlClass()}
            >
              <option value="ATIVO">Ativo</option>
              <option value="INADIMPLENTE">Inadimplente</option>
              <option value="CANCELADO">Cancelado</option>
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
            disabled={saving || consorciados.length === 0 || equipes.length === 0}
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>

      <VendaPosVendaPanel
        vendaId={item.id}
        initial={{
          checklistAtivacao: item.checklistAtivacao,
          dataPendencia: item.dataPendencia,
          alertaAtivo: item.alertaAtivo,
        }}
      />

      <CancelamentoEstornoModal
        open={cancelModalOpen}
        numeroContrato={form.numeroContrato.trim() || item.numeroContrato}
        saving={saving}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={(parcelasPagas) => void executeSave(parcelasPagas)}
      />
    </>
  );
}
